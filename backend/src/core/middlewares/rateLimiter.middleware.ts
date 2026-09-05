import type { Request, Response, NextFunction } from "express";

/**
 * Rate limiters disabled to prevent 429 throttling issues during UI workflows.
 */
export const globalRateLimiter = (_req: Request, _res: Response, next: NextFunction) => {
  next();
};

export const authRateLimiter = (_req: Request, _res: Response, next: NextFunction) => {
  next();
};

