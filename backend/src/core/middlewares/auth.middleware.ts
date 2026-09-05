import type { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";

import ApiError from "../../shared/utils/ApiError.js";
import { verifyAccessToken, verifyRefreshToken } from "../../shared/utils/Token.js";

import { prisma } from "../config/prisma.js";

// Session-validated middleware to authenticate access tokens and check isActive status
export const authMiddleware = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  let token = req.cookies?.accessToken || req.headers?.authorization;

  if (token && token.startsWith("Bearer ")) {
    token = token.split(" ")[1];
  }
  if (!token) {
    next(new ApiError(StatusCodes.UNAUTHORIZED, "Access token missing"));
    return;
  }

  try {
    const payload = verifyAccessToken(token);

    if (payload.type !== "access") {
      throw new ApiError(StatusCodes.UNAUTHORIZED, "Invalid token type");
    }

    // Verify against DB to enforce account active status
    const dbUser = await prisma.user.findFirst({
      where: { id: payload.userId, deletedAt: null },
      select: { id: true, email: true, role: true, isActive: true, companyId: true, employeeId: true },
    });

    if (!dbUser || !dbUser.isActive) {
      next(new ApiError(StatusCodes.UNAUTHORIZED, "User account is inactive or has been disabled"));
      return;
    }

    req.user = {
      id: dbUser.id,
      userId: dbUser.id,
      email: dbUser.email,
      role: dbUser.role.toLowerCase(),
      companyId: dbUser.companyId ?? undefined,
      employeeId: dbUser.employeeId ?? undefined,
      isActive: dbUser.isActive,
    };

    // Update lastLoginAt asynchronously
    prisma.user
      .update({
        where: { id: dbUser.id },
        data: { lastLoginAt: new Date() },
      })
      .catch(() => {});

    next();
  } catch (err: any) {
    if (err instanceof ApiError) {
      next(err);
    } else {
      next(new ApiError(StatusCodes.UNAUTHORIZED, "Invalid or expired token"));
    }
  }
};

// Legacy middleware to authenticate refresh tokens
export const refreshTokenMiddleware = (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  let token = req.cookies?.refreshToken || req.headers?.authorization;

  if (token && token.startsWith("Bearer ")) {
    token = token.split(" ")[1];
  }
  if (!token) {
    next(new ApiError(StatusCodes.UNAUTHORIZED, "Refresh token missing"));
    return;
  }

  try {
    const payload = verifyRefreshToken(token);

    if (payload.type !== "refresh") {
      throw new ApiError(StatusCodes.UNAUTHORIZED, "Invalid token type");
    }

    req.user = {
      id: payload.userId,
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
      isActive: true,
    };

    req.refreshToken = token;

    next();
  } catch {
    next(new ApiError(StatusCodes.UNAUTHORIZED, "Invalid refresh token"));
  }
};