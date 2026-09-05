import type { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";

import ApiError from "../../shared/utils/ApiError.js";
import { verifyAccessToken, verifyRefreshToken } from "../../shared/utils/Token.js";

// Legacy middleware to authenticate access tokens
export const authMiddleware = (req: Request, _res: Response, next: NextFunction): void => {
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

    req.user = {
      id: payload.userId,
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
      isActive: true,
    };
    next();
  } catch {
    next(new ApiError(StatusCodes.UNAUTHORIZED, "Invalid or expired token"));
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