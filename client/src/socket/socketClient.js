import { io } from "socket.io-client";

/**
 * Derive the plain origin from VITE_BACKEND_URL.
 * e.g. "http://localhost:5000/api/users" → "http://localhost:5000"
 */
const SOCKET_URL = (() => {
  const raw = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000/api/users";
  try {
    const { origin } = new URL(raw);
    return origin;
  } catch {
    return "http://localhost:5000";
  }
})();

let socket = null;

/**
 * Returns (and lazily creates) the singleton Socket.io instance.
 * Cookies are forwarded automatically via `withCredentials: true`,
 * so the server can authenticate the user from the HTTP-only cookie.
 */
export const getSocket = () => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      withCredentials: true, // sends the accessToken cookie automatically
      autoConnect: false,    // connect explicitly via socket.connect()
      transports: ["websocket", "polling"],
    });
  }
  return socket;
};

/**
 * Fully disconnect and destroy the singleton so the next
 * call to getSocket() creates a fresh connection.
 */
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
