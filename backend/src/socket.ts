import { Server as HTTPServer } from "http";
import { Server, Socket } from "socket.io";
import { env } from "./config/env";

let io: Server;
const connectionAttempts = new Map<string, number[]>();

const SOCKET_WINDOW_MS = 60 * 1000;
const MAX_CONNECTIONS_PER_IP_PER_WINDOW = 30;
const MAX_ROOM_EVENTS_PER_SOCKET_PER_WINDOW = 60;

function trimWindow(timestamps: number[], now: number): number[] {
  return timestamps.filter((ts) => now - ts <= SOCKET_WINDOW_MS);
}

function isConnectionRateLimited(ip: string): boolean {
  const now = Date.now();
  const existing = connectionAttempts.get(ip) || [];
  const recent = trimWindow(existing, now);

  if (recent.length >= MAX_CONNECTIONS_PER_IP_PER_WINDOW) {
    connectionAttempts.set(ip, recent);
    return true;
  }

  recent.push(now);
  connectionAttempts.set(ip, recent);
  return false;
}

export function initSocket(httpServer: HTTPServer): Server {
  io = new Server(httpServer, {
    cors: {
      origin: env.FRONTEND_URL,
      methods: ["GET", "POST"],
      credentials: true,
    },
    allowRequest: (req, callback) => {
      const ip = req.socket.remoteAddress || "unknown";
      if (isConnectionRateLimited(ip)) {
        callback("Too many socket connection attempts", false);
        return;
      }
      callback(null, true);
    },
  });

  io.on("connection", (socket: Socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);
    let roomEventTimestamps: number[] = [];

    const canProcessRoomEvent = (): boolean => {
      const now = Date.now();
      roomEventTimestamps = trimWindow(roomEventTimestamps, now);
      if (roomEventTimestamps.length >= MAX_ROOM_EVENTS_PER_SOCKET_PER_WINDOW) {
        socket.emit("socket_error", {
          error: "Too many socket room actions. Please slow down.",
        });
        return false;
      }
      roomEventTimestamps.push(now);
      return true;
    };

    // Join a poll room for real-time updates
    socket.on("join_poll", (pollId: string) => {
      if (!canProcessRoomEvent()) return;
      if (typeof pollId !== "string" || pollId.length < 8 || pollId.length > 64) {
        return;
      }
      socket.join(pollId);
      console.log(`📊 Socket ${socket.id} joined poll room: ${pollId}`);
    });

    // Leave a poll room
    socket.on("leave_poll", (pollId: string) => {
      if (!canProcessRoomEvent()) return;
      if (typeof pollId !== "string" || pollId.length < 8 || pollId.length > 64) {
        return;
      }
      socket.leave(pollId);
      console.log(`👋 Socket ${socket.id} left poll room: ${pollId}`);
    });

    socket.on("disconnect", () => {
      console.log(`🔌 Socket disconnected: ${socket.id}`);
    });
  });

  return io;
}

export function getIO(): Server {
  if (!io) {
    throw new Error("Socket.io not initialized — call initSocket first");
  }
  return io;
}
