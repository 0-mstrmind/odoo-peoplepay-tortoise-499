import type { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";

import ApiError from "../../shared/utils/ApiError.js";

export const requireRole = (...allowedRoles: string[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new ApiError(StatusCodes.UNAUTHORIZED, "Authentication required"));
      return;
    }

    const userRole = req.user.role.toLowerCase();
    const isAllowed = allowedRoles.some((role) => role.toLowerCase() === userRole || userRole === "admin");

    if (!isAllowed) {
      next(
        new ApiError(
          StatusCodes.FORBIDDEN,
          `Access denied. Requires one of the following roles: ${allowedRoles.join(", ")}`,
        ),
      );
      return;
    }

    next();
  };
};
