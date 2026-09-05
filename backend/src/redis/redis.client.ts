import { Redis, type RedisOptions } from "ioredis";
import { env } from "../core/config/env.js";
import { logger } from "../core/config/logger.js";
import type { RedisHealth } from "./redis.types.js";

let redisClient: Redis | null = null;
let isConnected = false;
let isFallbackMode = false;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;

/**
 * Builds ioredis configuration options from environment
 */
const buildRedisOptions = (): RedisOptions => {
  const baseOptions: RedisOptions = {
    lazyConnect: true,
    enableOfflineQueue: false,
    maxRetriesPerRequest: 2,
    connectTimeout: 5000,
    keyPrefix: env.REDIS_KEY_PREFIX || "peoplepay:",
    retryStrategy: (times: number) => {
      reconnectAttempts = times;
      if (times > MAX_RECONNECT_ATTEMPTS) {
        logger.warn(
          `[Redis] Max reconnect attempts (${MAX_RECONNECT_ATTEMPTS}) reached. Operating in graceful in-memory fallback mode.`,
        );
        isFallbackMode = true;
        return null; // Stop reconnecting
      }
      const delay = Math.min(times * 300, 2000);
      logger.debug(`[Redis] Reconnecting attempt #${times} in ${delay}ms...`);
      return delay;
    },
  };

  if (env.REDIS_URL && env.REDIS_URL.startsWith("redis")) {
    return {
      ...baseOptions,
    };
  }

  return {
    ...baseOptions,
    host: env.REDIS_HOST || "127.0.0.1",
    port: env.REDIS_PORT || 6379,
    password: env.REDIS_PASSWORD || undefined,
  };
};

/**
 * Initializes the Redis client singleton
 */
export const initRedis = async (): Promise<Redis | null> => {
  if (redisClient && isConnected) {
    return redisClient;
  }

  if (!env.REDIS_ENABLED) {
    logger.info("[Redis] Redis is disabled by configuration (REDIS_ENABLED=false). Using in-memory fallback cache.");
    isFallbackMode = true;
    return null;
  }

  try {
    const options = buildRedisOptions();
    redisClient = env.REDIS_URL ? new Redis(env.REDIS_URL, options) : new Redis(options);

    redisClient.on("connect", () => {
      logger.info("[Redis] Connecting to Redis server...");
    });

    redisClient.on("ready", () => {
      isConnected = true;
      isFallbackMode = false;
      reconnectAttempts = 0;
      logger.info("[Redis] Connection established and ready to accept commands");
    });

    redisClient.on("error", (error: Error) => {
      isConnected = false;
      logger.warn(`[Redis] Client error: ${error.message}`);
    });

    redisClient.on("close", () => {
      isConnected = false;
      logger.warn("[Redis] Connection closed");
    });

    redisClient.on("reconnecting", () => {
      logger.info("[Redis] Reconnecting to server...");
    });

    // Attempt initial connection with a 4-second timeout to avoid blocking server boot
    await Promise.race([
      redisClient.connect(),
      new Promise<void>((_, reject) =>
        setTimeout(() => reject(new Error("Redis connection timeout (4000ms)")), 4000),
      ),
    ]);

    return redisClient;
  } catch (error) {
    logger.warn(
      `[Redis] Could not establish initial connection: ${(error as Error).message}. Running with in-memory fallback cache.`,
    );
    isConnected = false;
    isFallbackMode = true;
    return null;
  }
};

/**
 * Returns the active Redis client instance or null
 */
export const getRedisClient = (): Redis | null => {
  return isConnected && redisClient ? redisClient : null;
};

/**
 * Check if Redis is currently connected and healthy
 */
export const isRedisReady = (): boolean => {
  return isConnected && !isFallbackMode && redisClient?.status === "ready";
};

/**
 * Health check diagnostic for Redis connection
 */
export const checkRedisHealth = async (): Promise<RedisHealth> => {
  if (!redisClient || !isRedisReady()) {
    return {
      status: "offline",
      connected: false,
      mode: "fallback_memory",
    };
  }

  try {
    const start = Date.now();
    const pingResult = await redisClient.ping();
    const pingMs = Date.now() - start;

    if (pingResult === "PONG") {
      let infoData: Record<string, string> = {};
      try {
        const infoRaw = await redisClient.info();
        infoData = infoRaw.split("\r\n").reduce((acc: Record<string, string>, line: string) => {
          const [k, v] = line.split(":");
          if (k && v) acc[k.trim()] = v.trim();
          return acc;
        }, {});
      } catch {
        // Info parsing optional
      }

      return {
        status: "healthy",
        connected: true,
        mode: "redis",
        pingMs,
        info: {
          redisVersion: infoData.redis_version,
          usedMemoryHuman: infoData.used_memory_human,
          connectedClients: infoData.connected_clients ? parseInt(infoData.connected_clients, 10) : undefined,
        },
      };
    }

    return {
      status: "degraded",
      connected: true,
      mode: "redis",
      pingMs,
    };
  } catch (err) {
    return {
      status: "offline",
      connected: false,
      mode: "fallback_memory",
    };
  }
};

/**
 * Gracefully close Redis client connection on application shutdown
 */
export const closeRedis = async (): Promise<void> => {
  if (redisClient) {
    try {
      logger.info("[Redis] Closing Redis connection...");
      await redisClient.quit();
    } catch {
      redisClient.disconnect();
    } finally {
      redisClient = null;
      isConnected = false;
    }
  }
};
