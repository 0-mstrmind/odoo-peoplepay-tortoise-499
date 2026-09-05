import { verifyToken, createClerkClient } from "@clerk/express";
import { prisma } from "../../core/config/prisma.js";
import { env } from "../../core/config/env.js";
import { logger } from "../../core/config/logger.js";
import type { AppSocket } from "../socket.types.js";

const clerkClient = env.CLERK_SECRET_KEY
  ? createClerkClient({ secretKey: env.CLERK_SECRET_KEY, publishableKey: env.CLERK_PUBLISHABLE_KEY })
  : null;

// Middleware for socket handshake authentication and identity verification
export const socketAuthMiddleware = async (
  socket: AppSocket,
  next: (err?: Error) => void,
): Promise<void> => {
  try {
    const authPayload = socket.handshake.auth || {};
    const headers = socket.handshake.headers || {};

    let token = authPayload.token || headers.authorization;
    if (token && typeof token === "string" && token.startsWith("Bearer ")) {
      token = token.split(" ")[1];
    }

    let clerkUserId: string | null = null;

    if (token && typeof token === "string" && env.CLERK_SECRET_KEY) {
      try {
        const verified = await verifyToken(token, {
          secretKey: env.CLERK_SECRET_KEY,
        });
        clerkUserId = verified.sub;
      } catch {
        // Token verification failed or invalid
      }
    }

    // Check dev/fallback authentication
    if (!clerkUserId && authPayload.clerkUserId) {
      clerkUserId = String(authPayload.clerkUserId);
    }
    if (!clerkUserId && headers["x-clerk-user-id"]) {
      clerkUserId = String(headers["x-clerk-user-id"]);
    }
    if (!clerkUserId && headers["x-user-id"]) {
      clerkUserId = String(headers["x-user-id"]);
    }

    // In development mode, allow handshake testing with role or email
    if (!clerkUserId && env.NODE_ENV === "development") {
      const devRole = String(authPayload.role || headers["x-user-role"] || "").toLowerCase();
      if (devRole) {
        let devUser = await prisma.user.findFirst({
          where: { role: devRole, deletedAt: null },
        });

        if (!devUser) {
          const company = await prisma.company.findFirst({ where: { deletedAt: null } });
          devUser = await prisma.user.create({
            data: {
              email: `dev_socket_${devRole}@peoplepay.internal`,
              role: devRole,
              companyId: company?.id || null,
              isActive: true,
            },
          });
        }

        socket.data.user = {
          id: devUser.id,
          userId: devUser.id,
          clerkUserId: devUser.clerkUserId,
          email: devUser.email,
          role: devUser.role,
          companyId: devUser.companyId,
          employeeId: devUser.employeeId,
          isActive: devUser.isActive,
        };

        return next();
      }
    }

    if (!clerkUserId) {
      logger.warn(`[Socket] Connection rejected: Missing handshake token for socket ${socket.id}`);
      return next(new Error("Authentication error: Unauthorized handshake token missing"));
    }

    // Retrieve database user record
    let dbUser = await prisma.user.findFirst({
      where: {
        OR: [{ clerkUserId }, { id: clerkUserId }],
        deletedAt: null,
      },
    });

    // Auto-sync if user exists in Clerk but not yet in database
    if (!dbUser && clerkClient) {
      try {
        const clerkUser = await clerkClient.users.getUser(clerkUserId);
        const primaryEmail = clerkUser.emailAddresses.find(
          (e) => e.id === clerkUser.primaryEmailAddressId,
        )?.emailAddress;

        if (primaryEmail) {
          dbUser = await prisma.user.findFirst({
            where: { email: primaryEmail, deletedAt: null },
          });

          if (dbUser) {
            dbUser = await prisma.user.update({
              where: { id: dbUser.id },
              data: { clerkUserId, lastLoginAt: new Date() },
            });
          }
        }
      } catch (err) {
        logger.error("[Socket] Clerk user lookup error:", err);
      }
    }

    if (!dbUser) {
      logger.warn(`[Socket] Connection rejected: User not found in DB for clerkUserId ${clerkUserId}`);
      return next(new Error("Authentication error: User record not found"));
    }

    if (!dbUser.isActive) {
      logger.warn(`[Socket] Connection rejected: Inactive user account ${dbUser.id}`);
      return next(new Error("Authentication error: User account is inactive"));
    }

    // Attach authenticated user to socket instance
    socket.data.user = {
      id: dbUser.id,
      userId: dbUser.id,
      clerkUserId: dbUser.clerkUserId,
      email: dbUser.email,
      role: dbUser.role,
      companyId: dbUser.companyId,
      employeeId: dbUser.employeeId,
      isActive: dbUser.isActive,
    };

    logger.info(`[Socket] Authenticated connection from ${dbUser.email} (Role: ${dbUser.role}, Socket: ${socket.id})`);
    next();
  } catch (error) {
    logger.error("[Socket] Handshake verification error:", error);
    next(new Error("Authentication error: Handshake verification failed"));
  }
};
