import winston from "winston";
import { env, isProduction } from "../config/env";

export const logger = winston.createLogger({
  level: isProduction ? "info" : "debug",
  defaultMeta: {
    service: "buildx-api",
    environment: env.NODE_ENV,
  },
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: !isProduction }),
    winston.format.json(),
  ),
  transports: [new winston.transports.Console()],
});
