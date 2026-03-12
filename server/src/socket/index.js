import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import { Chat } from "../models/chat.model.js";
import { Message } from "../models/message.model.js";
import {
  getGeminiClient,
  GEMINI_MODEL_CANDIDATES,
  fetchAvailableGeminiModels,
  getRetryDelaySeconds,
  buildGeminiPartsFromMessage,
  sanitizeAttachments,
} from "../controllers/chat.controller.js";

/* ── helper: parse raw cookie string into an object ── */
const parseCookies = (header = "") =>
  Object.fromEntries(
    header.split(";").map((c) => {
      const [k, ...v] = c.trim().split("=");
      return [k.trim(), decodeURIComponent(v.join("="))];
    })
  );

/* ── Socket.io authentication middleware ── */
const authenticateSocket = async (socket, next) => {
  try {
    const cookies = parseCookies(socket.handshake.headers.cookie || "");
    const token =
      cookies.accessToken ||
      socket.handshake.auth?.token;

    if (!token) return next(new Error("Authentication required"));

    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const user = await User.findById(decoded?._id).select(
      "-password -refreshToken"
    );

    if (!user) return next(new Error("User not found"));

    socket.user = user;
    next();
  } catch {
    next(new Error("Invalid or expired token"));
  }
};

/**
 * Register all Socket.io event handlers.
 * @param {import('socket.io').Server} io
 */
const registerSocketHandlers = (io) => {
  /* Apply auth to every connection */
  io.use(authenticateSocket);

  io.on("connection", (socket) => {
    console.log(
      `[Socket] Connected  → ${socket.user.email} (${socket.id})`
    );

    /* Put the user in their own room so we can target them later */
    socket.join(`user_${socket.user._id}`);

    /* ─────────────────────────────────────────────────────────
       Event: send_message
       Payload: { chatId?, content, attachments? }
       Emits:
         "chat_created"  → { chatId }          (only for new chats)
         "ai_chunk"      → { text, chatId }    (one per streaming chunk)
         "ai_done"       → { userMessage, aiMessage, chatId }
         "ai_error"      → { error }
    ───────────────────────────────────────────────────────── */
    socket.on("send_message", async ({ chatId, content, attachments }) => {
      try {
        const normalizedAttachments = sanitizeAttachments(attachments);
        const normalizedContent = String(
          content || "Please analyze the attached files/images."
        ).trim();

        /* ── 1. Create chat if needed ── */
        let currentChatId = chatId;
        if (!currentChatId) {
          const newChat = await Chat.create({
            userId: socket.user._id,
            title: normalizedContent.substring(0, 30),
          });
          currentChatId = newChat._id;
          socket.emit("chat_created", { chatId: currentChatId });
        }

        /* ── 2. Persist user message ── */
        const userMessage = await Message.create({
          chatId: currentChatId,
          senderRole: "user",
          content: normalizedContent,
          attachments: normalizedAttachments,
        });

        /* ── 3. Build Gemini conversation history ── */
        const history = await Message.find({ chatId: currentChatId }).sort({
          createdAt: 1,
        });
        const latestId = String(userMessage._id);
        const googleHistory = history.map((msg) => ({
          role: msg.senderRole === "ai" ? "model" : "user",
          parts: buildGeminiPartsFromMessage(msg, {
            includeAttachmentData:
              msg.senderRole === "user" && String(msg._id) === latestId,
          }),
        }));

        /* ── 4. Try model candidates and start streaming ── */
        const rawKey = process.env.GEMINI_API_KEY;
        const apiKey = rawKey?.trim();
        const genAI = getGeminiClient();
        let streamResult = null;
        let lastModelError = null;

        const discoveredModels = await fetchAvailableGeminiModels(apiKey);
        const modelCandidates = [
          ...new Set([...GEMINI_MODEL_CANDIDATES, ...discoveredModels]),
        ];

        for (const modelName of modelCandidates) {
          if (!modelName) continue;
          try {
            const model = genAI.getGenerativeModel({ model: modelName });
            streamResult = await model.generateContentStream({
              contents: googleHistory,
            });
            lastModelError = null;
            break; // found a working model
          } catch (err) {
            lastModelError = err;
            const skip =
              err?.status === 404 ||
              err?.status === 429 ||
              /not found|not supported/i.test(err?.message || "");
            if (skip) continue;
            throw err; // unexpected error — surface it
          }
        }

        if (!streamResult) {
          const reason = lastModelError?.errorDetails?.[0]?.reason;
          const retryAfterSeconds = getRetryDelaySeconds(lastModelError);

          if (reason === "API_KEY_INVALID") {
            socket.emit("ai_error", {
              error:
                "Gemini API key is invalid. Update GEMINI_API_KEY in server .env.",
            });
            return;
          }

          if (reason === "SERVICE_DISABLED") {
            socket.emit("ai_error", {
              error:
                "Generative Language API is disabled for this key/project. Enable it in Google Cloud.",
            });
            return;
          }

          if (lastModelError?.status === 403) {
            socket.emit("ai_error", {
              error:
                "Gemini API request is forbidden for this key/project. Check key restrictions and enabled APIs.",
            });
            return;
          }

          if (lastModelError?.status === 429) {
            socket.emit("ai_error", {
              error: retryAfterSeconds
                ? `Gemini quota/rate limit exceeded. Retry after about ${retryAfterSeconds}s.`
                : "Gemini quota/rate limit exceeded. Retry shortly.",
            });
            return;
          }

          socket.emit("ai_error", {
            error:
              lastModelError?.message ||
              "No compatible Gemini model is available. Set GEMINI_MODEL in .env to a supported model.",
          });
          return;
        }

        /* ── 5. Stream chunks to the client ── */
        let fullText = "";

        for await (const chunk of streamResult.stream) {
          const text = chunk.text();
          if (text) {
            fullText += text;
            socket.emit("ai_chunk", { text, chatId: currentChatId });
          }
        }

        /* ── 6. Persist the completed AI message ── */
        const aiMessage = await Message.create({
          chatId: currentChatId,
          senderRole: "ai",
          content: fullText,
        });

        await Chat.findByIdAndUpdate(currentChatId, { updatedAt: new Date() });

        /* ── 7. Signal completion ── */
        socket.emit("ai_done", {
          userMessage,
          aiMessage,
          chatId: currentChatId,
        });
      } catch (err) {
        console.error("[Socket] send_message error:", err);
        socket.emit("ai_error", {
          error:
            err?.message || "Failed to generate AI response. Check server logs.",
        });
      }
    });

    socket.on("disconnect", () => {
      console.log(
        `[Socket] Disconnected → ${socket.user?.email} (${socket.id})`
      );
    });
  });
};

export default registerSocketHandlers;
