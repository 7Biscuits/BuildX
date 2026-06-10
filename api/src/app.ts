import express, { Express } from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";
import morgan from "morgan";

// ─── Route Imports ────────────────────────────────────────────
import { authRouter } from "./routes/auth.routes";
import { userRouter } from "./routes/user.routes";
import { adminRouter } from "./routes/admin.routes";
import { paymentRouter } from "./routes/payment.routes";
import { quizRouter } from "./routes/quiz.routes";
import { errorHandler, notFoundHandler } from "./middleware/error.middleware";
import { env, isProduction } from "./config/env";
import { logger } from "./lib/logger";

const app: Express = express();

// ─── Security Middleware ──────────────────────────────────────
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || env.FRONTEND_ORIGIN.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("CORS origin not allowed"));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);

app.set("trust proxy", isProduction ? 1 : false);
app.use(
  morgan(isProduction ? "combined" : "dev", {
    stream: {
      write: (message) => logger.http(message.trim()),
    },
  }),
);

// ─── Rate Limiting ─────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  message: {
    success: false,
    message:
      "Too many requests from this IP. Please try again after 15 minutes.",
    code: "RATE_LIMIT_EXCEEDED",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10, // Strict limit for auth endpoints
  message: {
    success: false,
    message:
      "Too many authentication attempts. Please try again after 15 minutes.",
    code: "AUTH_RATE_LIMIT_EXCEEDED",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful logins
});

app.use(globalLimiter);

// ─── Request Parsing ──────────────────────────────────────────
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

// ─── Health Check ─────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "BuildX API is running",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  });
});

// ─── API Routes ───────────────────────────────────────────────
app.use("/api/auth", authLimiter, authRouter);
app.use("/api/user", userRouter);
app.use("/api/payments", paymentRouter);
app.use("/api/admin", adminRouter);
app.use("/api/quizzes", quizRouter);
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
