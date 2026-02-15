import express from "express";
import http from "http";
import cookieParser from "cookie-parser";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { env } from "./config/env";
import { initSocket } from "./socket";
import authRoutes from "./routes/auth";
import pollRoutes from "./routes/polls";
import voteRoutes from "./routes/votes";

const app = express();
const server = http.createServer(app);

app.set("trust proxy", 1);

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Please try again shortly." },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many auth attempts. Please try again later." },
});

const voteLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many vote requests. Please slow down." },
});

// ─── Middleware ─────────────────────────────────────────────────────
app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true,
  })
);
app.use(express.json({ limit: "20kb" }));
app.use(cookieParser());

// ─── Health Check ──────────────────────────────────────────────────
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ─── Routes ────────────────────────────────────────────────────────
app.use("/api", apiLimiter);
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/polls", pollRoutes);
app.use("/api/votes", voteLimiter, voteRoutes);

// ─── Socket.io ─────────────────────────────────────────────────────
initSocket(server);

// ─── Start Server ──────────────────────────────────────────────────
server.listen(env.PORT, () => {
  console.log(`
╔══════════════════════════════════════════════╗
║   🗳️  PollSafe Backend Running              ║
║   Port: ${env.PORT}                              ║
║   Mode: ${env.NODE_ENV.padEnd(19)}          ║
╚══════════════════════════════════════════════╝
  `);
});

export default app;
