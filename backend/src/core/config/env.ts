import dotenv from "dotenv";
import { z } from "zod";

dotenv.config({ quiet: true });

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(5000),
  DATABASE_URL: z.string().default("postgresql://postgres:postgres@localhost:5432/peoplepay360?schema=public"),
  MONGODB_URI: z.string().optional().default("mongodb://127.0.0.1:27017/neatnode_ts_rest"),
  CLERK_PUBLISHABLE_KEY: z.string().optional().default(""),
  CLERK_SECRET_KEY: z.string().optional().default(""),
  CLERK_WEBHOOK_SECRET: z.string().optional().default(""),
  JWT_ACCESS_SECRET: z.string().default("default_jwt_access_secret"),
  JWT_ACCESS_EXPIRES_IN: z.string().default("1d"),
  JWT_REFRESH_SECRET: z.string().default("default_jwt_refresh_secret"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(15 * 60 * 1000),
  RATE_LIMIT_MAX: z.coerce.number().default(100),
  RESEND_API_KEY: z.string().optional().default(""),
  RESEND_FROM_EMAIL: z.string().default("PeoplePay360 <onboarding@resend.dev>"),
  REDIS_URL: z.string().optional().default("redis://127.0.0.1:6379"),
  REDIS_HOST: z.string().optional().default("127.0.0.1"),
  REDIS_PORT: z.coerce.number().optional().default(6379),
  REDIS_PASSWORD: z.string().optional().default(""),
  REDIS_KEY_PREFIX: z.string().optional().default("peoplepay:"),
  REDIS_ENABLED: z.string().optional().transform((val) => val === "true" || val === "1" || val === undefined).default(true),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  throw new Error(`Invalid environment variables: ${JSON.stringify(parsed.error.flatten().fieldErrors)}`);
}

export const env = parsed.data;
