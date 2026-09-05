import type { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import { createClerkClient, verifyToken } from "@clerk/express";

import { prisma } from "../config/prisma.js";
import { env } from "../config/env.js";
import ApiError from "../../shared/utils/ApiError.js";
import { verifyAccessToken } from "../../shared/utils/Token.js";

const clerkClient = env.CLERK_SECRET_KEY
  ? createClerkClient({ secretKey: env.CLERK_SECRET_KEY, publishableKey: env.CLERK_PUBLISHABLE_KEY })
  : null;

// Helper to get or create a default tenant company
const getDefaultCompanyId = async (): Promise<string> => {
  let company = await prisma.company.findFirst({
    where: { deletedAt: null },
    orderBy: { createdAt: "asc" },
  });

  if (!company) {
    company = await prisma.company.create({
      data: {
        name: "PeoplePay360 Inc.",
        slug: "peoplepay360",
        currency: "INR",
        industry: "Information Technology",
        country: "India",
        timezone: "Asia/Kolkata",
      },
    });
  }

  return company.id;
};

/// Unified Auth Middleware supporting Clerk JWT, local JWT tokens, and x-clerk-user-id / x-user-role headers
export const clerkAuthMiddleware = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  try {
    let token = req.headers.authorization;
    if (token && token.startsWith("Bearer ")) {
      token = token.split(" ")[1];
    }

    // 1. Check if token is a local JWT token (from REST login)
    if (token) {
      try {
        const payload = verifyAccessToken(token);
        if (payload && payload.userId) {
          const dbUser = await prisma.user.findFirst({
            where: { id: payload.userId, deletedAt: null },
          });

          if (dbUser && dbUser.isActive) {
            const companyId = dbUser.companyId || (await getDefaultCompanyId());
            req.user = {
              id: dbUser.id,
              clerkUserId: dbUser.clerkUserId,
              email: dbUser.email,
              role: dbUser.role,
              companyId,
              employeeId: dbUser.employeeId,
              isActive: dbUser.isActive,
            };
            next();
            return;
          }
        }
      } catch {
        // Token is not a local JWT, proceed to Clerk verification
      }
    }

    let clerkUserId: string | null = null;

    // 2. Verify Clerk Token
    if (token && env.CLERK_SECRET_KEY) {
      try {
        const verified = await verifyToken(token, {
          secretKey: env.CLERK_SECRET_KEY,
        });
        clerkUserId = verified.sub;
      } catch {
        // Verification failed
      }
    }

    // 3. Fallback Header for testing/dev (x-clerk-user-id or x-user-id)
    if (!clerkUserId && req.headers["x-clerk-user-id"]) {
      clerkUserId = req.headers["x-clerk-user-id"] as string;
    }

    if (!clerkUserId && req.headers["x-user-id"]) {
      clerkUserId = req.headers["x-user-id"] as string;
    }

    // Dev mode convenience: allow testing roles directly via x-user-role header
    if (!clerkUserId && env.NODE_ENV === "development" && req.headers["x-user-role"]) {
      const devRole = (req.headers["x-user-role"] as string).toLowerCase();
      const devEmail = (req.headers["x-user-email"] as string) || `dev_${devRole}@peoplepay360.com`;

      let devUser = await prisma.user.findFirst({
        where: { email: devEmail, deletedAt: null },
      });

      const companyId = await getDefaultCompanyId();

      if (!devUser) {
        devUser = await prisma.user.create({
          data: {
            email: devEmail,
            role: devRole,
            companyId,
            isActive: true,
          },
        });
      } else if (devUser.role !== devRole) {
        devUser = await prisma.user.update({
          where: { id: devUser.id },
          data: { role: devRole },
        });
      }

      req.user = {
        id: devUser.id,
        clerkUserId: devUser.clerkUserId,
        email: devUser.email,
        role: devUser.role,
        companyId: devUser.companyId || companyId,
        employeeId: devUser.employeeId,
        isActive: devUser.isActive,
      };

      req.auth = {
        userId: devUser.id,
        sessionId: null,
      };

      next();
      return;
    }

    if (!clerkUserId && req.headers["x-user-email"]) {
      const emailHeader = req.headers["x-user-email"] as string;
      const userByEmail = await prisma.user.findFirst({
        where: { email: emailHeader, deletedAt: null },
      });
      if (userByEmail && userByEmail.isActive) {
        const companyId = userByEmail.companyId || (await getDefaultCompanyId());
        req.user = {
          id: userByEmail.id,
          clerkUserId: userByEmail.clerkUserId,
          email: userByEmail.email,
          role: userByEmail.role,
          companyId,
          employeeId: userByEmail.employeeId,
          isActive: userByEmail.isActive,
        };
        next();
        return;
      }
    }

    if (!clerkUserId) {
      next(new ApiError(StatusCodes.UNAUTHORIZED, "Authentication token missing or invalid"));
      return;
    }

    // Retrieve corresponding PeoplePay360 database user
    let dbUser = await prisma.user.findFirst({
      where: {
        OR: [{ clerkUserId }, { id: clerkUserId }, { email: clerkUserId }],
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

          const defaultCompanyId = await getDefaultCompanyId();

          if (dbUser) {
            dbUser = await prisma.user.update({
              where: { id: dbUser.id },
              data: { clerkUserId, lastLoginAt: new Date(), companyId: dbUser.companyId || defaultCompanyId },
            });
          } else {
            const userCount = await prisma.user.count({ where: { deletedAt: null } });
            const initialRole = userCount === 0 ? "admin" : "employee";

            dbUser = await prisma.user.create({
              data: {
                clerkUserId,
                email: primaryEmail,
                role: initialRole,
                companyId: defaultCompanyId,
                isActive: true,
                lastLoginAt: new Date(),
              },
            });
          }
        }
      } catch {
        // Clerk user fetch failed
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

    const defaultCompanyId = dbUser.companyId || (await getDefaultCompanyId());

    req.user = {
      id: dbUser.id,
      clerkUserId: dbUser.clerkUserId,
      email: dbUser.email,
      role: dbUser.role,
      companyId: defaultCompanyId,
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
