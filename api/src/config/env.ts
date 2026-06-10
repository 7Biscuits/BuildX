import "dotenv/config";
import { z } from "zod";

const stripWrappingQuotes = (value: string) => value.trim().replace(/^['"]+|['"]+$/g, "");

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(8080),
  FRONTEND_ORIGIN: z
    .string()
    .default("http://localhost:3000")
    .transform((value) =>
      value
        .split(",")
        .map((origin) => origin.trim())
        .filter(Boolean),
    ),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  DIRECT_URL: z.string().optional(),
  JWT_SECRET: z.string().min(1, "JWT_SECRET is required"),
  ADMIN_EMAILS: z
    .string()
    .default("")
    .transform((value) =>
      value
        .split(",")
        .map((email) => stripWrappingQuotes(email).toLowerCase())
        .filter(Boolean),
    ),
  ADMIN_DEFAULT_PASSWORD: z.string().min(8).optional(),
  SUPABASE_URL: z.string().url("SUPABASE_URL must be a URL"),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, "SUPABASE_SERVICE_ROLE_KEY is required"),
  SUPABASE_ANON_KEY: z.string().optional(),
  PAYMENT_SLIPS_BUCKET: z.string().min(1).default("payment-slips"),
  COOKIE_DOMAIN: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const details = parsed.error.issues
    .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    .join("; ");
  throw new Error(`Invalid environment configuration: ${details}`);
}

if (parsed.data.NODE_ENV === "production" && parsed.data.JWT_SECRET.length < 32) {
  throw new Error("Invalid environment configuration: JWT_SECRET must be at least 32 characters in production");
}

if (parsed.data.NODE_ENV !== "production" && parsed.data.JWT_SECRET.length < 32) {
  console.warn("Warning: JWT_SECRET is shorter than 32 characters. Use a stronger secret before production.");
}

const parseUrlOrNull = (value: string | undefined) => {
  if (!value) return null;

  try {
    return new URL(value);
  } catch {
    return null;
  }
};

const databaseUrl = parseUrlOrNull(parsed.data.DATABASE_URL);
const directUrl = parseUrlOrNull(parsed.data.DIRECT_URL);

if (!databaseUrl && !directUrl) {
  throw new Error(
    "Invalid environment configuration: neither DATABASE_URL nor DIRECT_URL is a valid URL",
  );
}

if (!databaseUrl && directUrl) {
  console.warn(
    "Warning: DATABASE_URL is invalid, falling back to DIRECT_URL. Check for unencoded special characters in DATABASE_URL credentials.",
  );
}

export const env = {
  ...parsed.data,
  DATABASE_RUNTIME_URL: (databaseUrl?.toString() ?? directUrl!.toString()),
};
export const isProduction = env.NODE_ENV === "production";
