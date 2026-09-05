import { prisma } from "./prisma.js";
import { logger } from "./logger.js";

export const connectDB = async (): Promise<void> => {
  try {
    await prisma.$connect();
    logger.info("PostgreSQL (Prisma) connected");
  } catch (error) {
    logger.warn("PostgreSQL database connection issue:", error);
  }
};
