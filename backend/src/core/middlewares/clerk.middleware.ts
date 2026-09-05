import type { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import { createClerkClient, verifyToken } from "@clerk/express";

import { prisma } from "../config/prisma.js";
import { env } from "../config/env.js";
import ApiError from "../../shared/utils/ApiError.js";

const clerkClient = env.CLERK_SECRET_KEY
  ? createClerkClient({ secretKey: env.CLERK_SECRET_KEY, publishableKey: env.CLERK_PUBLISHABLE_KEY })
  : null;

/// Middleware to authenticate requests via Clerk token & load local PeoplePay360 database user
export const clerkAuthMiddleware = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  try {
    let token = req.headers.authorization;
    if (token && token.startsWith("Bearer ")) {
      token = token.split(" ")[1];
    }

    let clerkUserId: string | null = null;

    if (token && env.CLERK_SECRET_KEY) {
      try {
        const verified = await verifyToken(token, {
          secretKey: env.CLERK_SECRET_KEY,
        });
        clerkUserId = verified.sub;
      } catch {
        // Token verification fallback or decode
      }
    }

    // Fallback or dev header for local testing
    if (!clerkUserId && req.headers["x-clerk-user-id"]) {
      clerkUserId = req.headers["x-clerk-user-id"] as string;
    }

    if (!clerkUserId) {
      next(new ApiError(StatusCodes.UNAUTHORIZED, "Clerk authentication token missing or invalid"));
      return;
    }

    // Retrieve corresponding PeoplePay360 database user
    let dbUser = await prisma.user.findFirst({
      where: {
        OR: [{ clerkUserId }, { id: clerkUserId }],
        deletedAt: null,
      },
    });

    // Auto-sync user if found in Clerk but not yet in PostgreSQL DB
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
          } else {
            dbUser = await prisma.user.create({
              data: {
                clerkUserId,
                email: primaryEmail,
                role: "employee",
                isActive: true,
                lastLoginAt: new Date(),
              },
            });
          }
        }
      } catch {
        // Error fetching Clerk user profile
      }
    }

    if (!dbUser) {
      next(new ApiError(StatusCodes.UNAUTHORIZED, "User record not found in database"));
      return;
    }

    if (!dbUser.isActive) {
      next(new ApiError(StatusCodes.FORBIDDEN, "User account is inactive"));
      return;
    }

    req.user = {
      id: dbUser.id,
      clerkUserId: dbUser.clerkUserId,
      email: dbUser.email,
      role: dbUser.role,
      companyId: dbUser.companyId,
      employeeId: dbUser.employeeId,
      isActive: dbUser.isActive,
    };

    req.auth = {
      userId: clerkUserId,
      sessionId: null,
    };

    next();
  } catch (error) {
    next(new ApiError(StatusCodes.UNAUTHORIZED, "Authentication failed", [String(error)]));
  }
};
