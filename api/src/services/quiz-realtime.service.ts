import { Server } from "socket.io";

let io: Server | null = null;

export const setQuizIo = (server: Server) => {
  io = server;
};

export const quizRoom = (sessionId: string) => `quiz-session:${sessionId}`;

export const emitQuizEvent = (sessionId: string, event: string, payload: unknown) => {
  io?.to(quizRoom(sessionId)).emit(event, payload);
};
