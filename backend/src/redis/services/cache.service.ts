import { logger } from "../../core/config/logger.js";
import { getRedisClient, isRedisReady } from "../redis.client.js";
import type { CacheOptions } from "../redis.types.js";

interface MemoryCacheEntry {
  value: string;
  expiresAt: number | null;
}

// In-memory fallback cache when Redis is disconnected or offline
const memoryStore = new Map<string, MemoryCacheEntry>();

const DEFAULT_TTL_SECONDS = 300; // 5 minutes

/**
 * Cache Service
 * Provides robust Redis caching with seamless, transparent in-memory fallback.
 */
export class CacheService {
  /**
   * Retrieve a value by key. Automatically parses JSON.
   */
  async get<T = unknown>(key: string): Promise<T | null> {
    try {
      if (isRedisReady()) {
        const client = getRedisClient();
        if (client) {
          const raw = await client.get(key);
          if (!raw) return null;
          return JSON.parse(raw) as T;
        }
      }

      // In-memory fallback
      const entry = memoryStore.get(key);
      if (!entry) return null;

      if (entry.expiresAt && Date.now() > entry.expiresAt) {
        memoryStore.delete(key);
        return null;
      }

      return JSON.parse(entry.value) as T;
    } catch (error) {
      logger.warn(`[CacheService:get] Error reading key '${key}': ${(error as Error).message}`);
      return null;
    }
  }

  /**
   * Store a value with optional TTL (in seconds). Automatically stringifies JSON.
   */
  async set(key: string, value: unknown, options?: CacheOptions | number): Promise<boolean> {
    try {
      const ttl = typeof options === "number" ? options : options?.ttlSeconds ?? DEFAULT_TTL_SECONDS;
      const serialized = JSON.stringify(value);

      if (isRedisReady()) {
        const client = getRedisClient();
        if (client) {
          if (ttl > 0) {
            await client.set(key, serialized, "EX", ttl);
          } else {
            await client.set(key, serialized);
          }
          return true;
        }
      }

      // In-memory fallback
      memoryStore.set(key, {
        value: serialized,
        expiresAt: ttl > 0 ? Date.now() + ttl * 1000 : null,
      });
      return true;
    } catch (error) {
      logger.warn(`[CacheService:set] Error storing key '${key}': ${(error as Error).message}`);
      return false;
    }
  }

  /**
   * Delete one or more keys from cache.
   */
  async del(...keys: string[]): Promise<number> {
    if (keys.length === 0) return 0;
    try {
      if (isRedisReady()) {
        const client = getRedisClient();
        if (client) {
          return await client.del(...keys);
        }
      }

      // In-memory fallback
      let deleted = 0;
      for (const k of keys) {
        if (memoryStore.delete(k)) deleted++;
      }
      return deleted;
    } catch (error) {
      logger.warn(`[CacheService:del] Error deleting keys: ${(error as Error).message}`);
      return 0;
    }
  }

  /**
   * Delete keys matching a pattern (e.g. 'dashboard:*', 'employee:123:*').
   * Uses non-blocking SCAN in Redis.
   */
  async delByPattern(pattern: string): Promise<number> {
    try {
      if (isRedisReady()) {
        const client = getRedisClient();
        if (client) {
          const prefix = (client.options as any)?.keyPrefix || "";
          const searchPattern = prefix ? `${prefix}${pattern}` : pattern;

          let cursor = "0";
          let totalDeleted = 0;
          do {
            const [nextCursor, matchedKeys] = await client.scan(cursor, "MATCH", searchPattern, "COUNT", 100);
            cursor = nextCursor;
            if (matchedKeys.length > 0) {
              // Strip prefix because client.del automatically prepends client.options.keyPrefix
              const keysToDelete = prefix
                ? matchedKeys.map((k) => (k.startsWith(prefix) ? k.slice(prefix.length) : k))
                : matchedKeys;
              const count = await client.del(...keysToDelete);
              totalDeleted += count;
            }
          } while (cursor !== "0");
          return totalDeleted;
        }
      }

      // In-memory fallback
      let deleted = 0;
      const regex = new RegExp(`^${pattern.replace(/\*/g, ".*")}$`);
      for (const key of memoryStore.keys()) {
        if (regex.test(key)) {
          memoryStore.delete(key);
          deleted++;
        }
      }
      return deleted;
    } catch (error) {
      logger.warn(`[CacheService:delByPattern] Error deleting pattern '${pattern}': ${(error as Error).message}`);
      return 0;
    }
  }

  /**
   * Cache-aside pattern: Fetch from cache or compute and cache result.
   */
  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    options?: CacheOptions | number,
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null && cached !== undefined) {
      return cached;
    }

    const fresh = await fetcher();
    if (fresh !== null && fresh !== undefined) {
      await this.set(key, fresh, options);
    }
    return fresh;
  }

  /**
   * Check if a key exists in cache.
   */
  async exists(key: string): Promise<boolean> {
    try {
      if (isRedisReady()) {
        const client = getRedisClient();
        if (client) {
          const result = await client.exists(key);
          return result === 1;
        }
      }

      const entry = memoryStore.get(key);
      if (!entry) return false;
      if (entry.expiresAt && Date.now() > entry.expiresAt) {
        memoryStore.delete(key);
        return false;
      }
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Update TTL on an existing key.
   */
  async expire(key: string, ttlSeconds: number): Promise<boolean> {
    try {
      if (isRedisReady()) {
        const client = getRedisClient();
        if (client) {
          const res = await client.expire(key, ttlSeconds);
          return res === 1;
        }
      }

      const entry = memoryStore.get(key);
      if (entry) {
        entry.expiresAt = Date.now() + ttlSeconds * 1000;
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  /**
   * Clear all keys in memory or flush active Redis database.
   */
  async flushAll(): Promise<boolean> {
    try {
      memoryStore.clear();
      if (isRedisReady()) {
        const client = getRedisClient();
        if (client) {
          await client.flushdb();
        }
      }
      return true;
    } catch {
      return false;
    }
  }
}

export const cacheService = new CacheService();
