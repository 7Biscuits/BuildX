import app from "./app";
import { prisma } from "./lib/prisma";
import { createServer } from "http";
import { AddressInfo } from "net";
import { Server } from "socket.io";
import { configureSocket } from "./socket";
import { clearQuizTimers, resumeRunningQuizTimers } from "./services/quiz.service";
import { env, isProduction } from "./config/env";
import { logger } from "./lib/logger";

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: env.FRONTEND_ORIGIN,
    credentials: true,
  },
});

configureSocket(io);

const listenOnPort = async (preferredPort: number): Promise<number> => {
  const tryListen = (port: number): Promise<number> =>
    new Promise((resolve, reject) => {
      const onError = (error: NodeJS.ErrnoException) => {
        httpServer.off("listening", onListening);

        if (error.code === "EADDRINUSE" && !isProduction) {
          logger.warn(`Port ${port} is already in use; trying port ${port + 1} instead.`);
          resolve(tryListen(port + 1));
          return;
        }

        reject(error);
      };

      const onListening = () => {
        httpServer.off("error", onError);
        const address = httpServer.address();

        if (!address || typeof address === "string") {
          resolve(port);
          return;
        }

        resolve((address as AddressInfo).port);
      };

      httpServer.once("error", onError);
      httpServer.once("listening", onListening);
      httpServer.listen(port);
    });

  return tryListen(preferredPort);
};

async function startServer() {
  try {
    await prisma.$connect();
    await resumeRunningQuizTimers();

    logger.info("Connected to PostgreSQL database");
    const activePort = await listenOnPort(env.PORT);
    logger.info(`Server running on port ${activePort}`);
  } catch (error) {
    logger.error("Server startup failed", { error });
    process.exit(1);
  }
}

const shutdown = async (signal: NodeJS.Signals) => {
  logger.info(`Received ${signal}; shutting down`);
  clearQuizTimers();
  io.close();
  httpServer.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });

  setTimeout(() => {
    logger.error("Forced shutdown after timeout");
    process.exit(1);
  }, 10_000).unref();
};

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));

void startServer();
