import { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { z } from "zod";
import {
  assertSessionAccess,
  getSessionState,
  kickParticipantFromSession,
} from "./services/quiz.service";
import { quizRoom, setQuizIo } from "./services/quiz-realtime.service";
import { env } from "./config/env";
import { UserRole } from "../generated/prisma/client";

type JwtPayload = {
  userId: string;
  role: UserRole;
};

const socketPayloadValidator = z.object({
  userId: z.uuid(),
  role: z.enum([UserRole.USER, UserRole.ADMIN]),
});
const roomPayloadValidator = z.object({ sessionId: z.uuid() });
const kickPayloadValidator = z.object({ sessionId: z.uuid(), userId: z.uuid() });

export const configureSocket = (io: Server) => {
  setQuizIo(io);

  io.use((socket, next) => {
    try {
      const token = getSocketToken(socket);
      if (!token) throw new Error("Missing token");
      const decoded = socketPayloadValidator.parse(jwt.verify(token, env.JWT_SECRET));
      socket.data.user = decoded;
      next();
    } catch {
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    socket.on("quiz:join-room", async (payload: unknown) => {
      try {
        const { sessionId } = roomPayloadValidator.parse(payload);
        const user = socket.data.user as JwtPayload;
        const canAccess = await assertSessionAccess(sessionId, user.userId, user.role);

        if (!canAccess) {
          socket.emit("quiz:error", { message: "Forbidden" });
          return;
        }

        socket.join(quizRoom(sessionId));
        socket.emit("quiz:room-joined", { sessionId });
        const state = await getSessionState(sessionId);
        socket.emit("participant:status-updated", state);
      } catch {
        socket.emit("quiz:error", { message: "Failed to join quiz room" });
      }
    });

    socket.on("quiz:leave-room", (payload: unknown) => {
      const parsed = roomPayloadValidator.safeParse(payload);
      if (!parsed.success) return;
      const { sessionId } = parsed.data;
      socket.leave(quizRoom(sessionId));
      socket.to(quizRoom(sessionId)).emit("participant:left", {
        sessionId,
        userId: (socket.data.user as JwtPayload).userId,
      });
    });

    socket.on("quiz:kick-user", async (payload: unknown) => {
      try {
        const user = socket.data.user as JwtPayload;
        const parsed = kickPayloadValidator.safeParse(payload);
        if (!parsed.success) return;
        const { sessionId, userId } = parsed.data;

        if (user.role !== UserRole.ADMIN) {
          socket.emit("quiz:error", { message: "Forbidden" });
          return;
        }

        await kickParticipantFromSession(sessionId, user.userId, userId);

        const room = quizRoom(sessionId);
        const roomSockets = await io.in(room).fetchSockets();

        for (const roomSocket of roomSockets) {
          const roomUser = roomSocket.data.user as JwtPayload | undefined;
          if (roomUser?.userId !== userId) continue;

          roomSocket.leave(room);
          roomSocket.emit("participant:kicked", { sessionId, userId });
        }

        io.to(room).emit("participant:kicked", { sessionId, userId });
        const state = await getSessionState(sessionId);
        io.to(room).emit("participant:status-updated", state);
      } catch {
        socket.emit("quiz:error", { message: "Failed to kick participant" });
      }
    });

    socket.on("disconnecting", () => {
      const user = socket.data.user as JwtPayload | undefined;
      if (!user) return;

      for (const room of socket.rooms) {
        if (!room.startsWith("quiz-session:")) continue;

        const sessionId = room.replace("quiz-session:", "");
        socket.to(room).emit("participant:left", {
          sessionId,
          userId: user.userId,
        });
      }
    });
  });
};

const getSocketToken = (socket: Socket) => {
  const authToken = socket.handshake.auth?.token;
  if (typeof authToken === "string") return authToken;

  const header = socket.handshake.headers.authorization;
  if (header?.startsWith("Bearer ")) return header.slice("Bearer ".length);

  const cookieHeader = socket.handshake.headers.cookie;
  if (!cookieHeader) return undefined;

  return cookieHeader
    .split(";")
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith("token="))
    ?.slice("token=".length);
};
