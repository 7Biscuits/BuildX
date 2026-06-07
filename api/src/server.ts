import app from "./app";
import { prisma } from "./lib/prisma";
import { createServer } from "http";
import { Server } from "socket.io";
import { configureSocket } from "./socket";
import { resumeRunningQuizTimers } from "./services/quiz.service";

const port = process.env.PORT;
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_ORIGIN ?? "http://localhost:3000",
    credentials: true,
  },
});

configureSocket(io);

async function startServer() {
  try {
    await prisma.$connect();
    await resumeRunningQuizTimers();

    console.log("Connected to PostgreSQL database");

    httpServer.listen(port, () => {
      console.log(`Server running on http://localhost:${port}`);
    });
  } catch (error) {
    console.error("Database connection failed");
    console.error(error);
    process.exit(1);
  }
}

startServer();
