/**
 * Redis Module
 *
 * Enterprise-grade Redis integration supporting:
 * - Singleton connection manager with exponential backoff retry
 * - High-level caching service (get, set, del, scan-delete, getOrSet) with transparent in-memory fallback
 * - Pub/Sub messaging service for distributed real-time events
 * - Express route caching middleware (cacheMiddleware)
 */

export {
  initRedis,
  getRedisClient,
  isRedisReady,
  checkRedisHealth,
  closeRedis,
} from "./redis.client.js";

export { cacheService, CacheService } from "./services/cache.service.js";
export { pubSubService, PubSubService } from "./services/pubsub.service.js";
export { cacheMiddleware } from "./middlewares/cache.middleware.js";

export * from "./redis.types.js";
