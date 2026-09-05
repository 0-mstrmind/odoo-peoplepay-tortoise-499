import type { Request, Response, NextFunction } from "express";
import { cacheService } from "../services/cache.service.js";
import type { CacheOptions } from "../redis.types.js";

/**
 * Express Middleware to cache GET responses in Redis with configurable TTL.
 * Automatically adds 'X-Cache: HIT' or 'X-Cache: MISS' headers.
 */
export const cacheMiddleware = (options?: CacheOptions) => {
  const ttl = options?.ttlSeconds ?? 180; // 3 minutes default
  const prefix = options?.prefix ?? "api";

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Only cache GET requests
    if (req.method !== "GET") {
      return next();
    }

    try {
      const companyId = req.user?.companyId || "global";
      const userRole = req.user?.role || "anonymous";
      const cacheKey = `${prefix}:${companyId}:${userRole}:${req.originalUrl || req.url}`;

      const cached = await cacheService.get<Record<string, unknown>>(cacheKey);

      if (cached) {
        res.setHeader("X-Cache", "HIT");
        res.setHeader("X-Cache-Key", cacheKey);
        res.status(200).json(cached);
        return;
      }

      res.setHeader("X-Cache", "MISS");

      // Intercept res.json to capture response payload
      const originalJson = res.json.bind(res);
      res.json = (body: any): Response => {
        // Only cache successful 200 responses
        if (res.statusCode >= 200 && res.statusCode < 300 && body) {
          cacheService.set(cacheKey, body, ttl).catch(() => {});
        }
        return originalJson(body);
      };

      next();
    } catch {
      next();
    }
  };
};
