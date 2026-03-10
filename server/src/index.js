import 'dotenv/config';
import express from 'express';
import http from 'http';
import cors from 'cors';
import { Server } from 'socket.io';

import connectDB from './config/db.js';
import routes from './routes/index.js';
import registerSocketHandlers from './socket/index.js';

const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// ── Express app ──────────────────────────────────────────────────────────────
const app = express();
app.use(cors({ origin: CLIENT_URL, credentials: true }));
app.use(express.json());

// ── Routes ───────────────────────────────────────────────────────────────────
app.use('/api', routes);

// ── HTTP server (needed to share with Socket.io) ─────────────────────────────
const server = http.createServer(app);

// ── Socket.io ────────────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: CLIENT_URL,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});
registerSocketHandlers(io);

// ── Start ─────────────────────────────────────────────────────────────────────
connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
});
