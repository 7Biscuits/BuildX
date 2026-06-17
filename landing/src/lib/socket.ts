import { io, Socket } from "socket.io-client";
import { API_BASE_URL } from "@/lib/api";
import { getStoredAuthToken } from "@/lib/api/client";

let socket: Socket | null = null;

export function getQuizSocket(token?: string) {
  const authToken = token ?? getStoredAuthToken();

  if (!socket) {
    socket = io(API_BASE_URL, {
      withCredentials: true,
      autoConnect: false,
      auth: authToken ? { token: authToken } : undefined,
    });
  }

  if (authToken) {
    socket.auth = { token: authToken };
  }

  return socket;
}

export function disconnectQuizSocket() {
  socket?.disconnect();
  socket = null;
}
