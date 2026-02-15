import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

function resolveSocketUrl(): string {
  const configuredUrl = process.env.NEXT_PUBLIC_SOCKET_URL;
  if (configuredUrl) return configuredUrl;

  if (typeof window !== "undefined") {
    const { protocol, hostname, origin } = window.location;
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return `${protocol}//${hostname}:5000`;
    }
    return origin;
  }

  return "http://localhost:5000";
}

export function getSocket(): Socket {
  if (!socket) {
    socket = io(resolveSocketUrl(), {
      withCredentials: true,
      transports: ["websocket", "polling"],
      path: "/socket.io",
    });
  }
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
