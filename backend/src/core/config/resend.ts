import { Resend } from "resend";
import { env } from "./env.js";
import { logger } from "./logger.js";

/**
 * Resend Client Configuration
 * Initializes Resend SDK instance if RESEND_API_KEY is configured.
 * Fallback to null in development/test when API key is omitted.
 */
export const resend = env.RESEND_API_KEY
  ? new Resend(env.RESEND_API_KEY)
  : null;

if (!env.RESEND_API_KEY && env.NODE_ENV !== "test") {
  logger.warn("RESEND_API_KEY is missing in environment variables. Email sending will run in mock/log mode.");
}
