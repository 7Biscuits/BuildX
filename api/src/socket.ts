import { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { assertSessionAccess, getSessionState } from "./services/quiz.service";
import { quizRoom, setQuizIo } from "./services/quiz-realtime.service";

type JwtPayload = {
  userId: string;
  role: string;
};

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined");
}

export const configureSocket = (io: Server) => {
  setQuizIo(io);

  io.use((socket, next) => {
    try {
      const token = getSocketToken(socket);
      if (!token) throw new Error("Missing token");
      const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
      socket.data.user = decoded;
      next();
    } catch {
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    socket.on("quiz:join-room", async ({ sessionId }: { sessionId: string }) => {
      try {
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

    socket.on("quiz:leave-room", ({ sessionId }: { sessionId: string }) => {
      socket.leave(quizRoom(sessionId));
      socket.to(quizRoom(sessionId)).emit("participant:left", {
        sessionId,
        userId: (socket.data.user as JwtPayload).userId,
      });
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
