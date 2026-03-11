import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { createNewChat, getUserChats, getChatMessages, sendMessage } from "../controllers/chat.controller.js";

const router = Router();
router.use(verifyJWT);

router.route("/").post(createNewChat).get(getUserChats);
router.route("/send").post(sendMessage);
router.route("/:chatId").get(getChatMessages);

export default router;