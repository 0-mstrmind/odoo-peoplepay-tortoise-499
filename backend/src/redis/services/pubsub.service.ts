import EventEmitter from "node:events";
import { Redis } from "ioredis";
import { env } from "../../core/config/env.js";
import { logger } from "../../core/config/logger.js";
import { getRedisClient, isRedisReady, buildRedisOptions } from "../redis.client.js";
import type { PubSubHandler } from "../redis.types.js";

const localEmitter = new EventEmitter();
let subClient: Redis | null = null;
const registeredHandlers = new Map<string, Set<PubSubHandler>>();

/**
 * Ensures the dedicated subscriber Redis connection exists
 */
const getOrCreateSubscriber = async (): Promise<Redis | null> => {
  if (subClient && subClient.status === "ready") {
    return subClient;
  }

  if (!isRedisReady()) {
    return null;
  }

  try {
    const opts = buildRedisOptions({ keyPrefix: "" });

    subClient = env.REDIS_URL
      ? new Redis(env.REDIS_URL, opts)
      : new Redis(opts);

    subClient.on("message", (channel, message) => {
      try {
        const parsed = JSON.parse(message);
        const handlers = registeredHandlers.get(channel);
        if (handlers) {
          for (const handler of handlers) {
            handler(parsed, channel);
          }
        }
      } catch (err) {
        logger.warn(`[PubSub] Error parsing message on channel '${channel}': ${(err as Error).message}`);
      }
    });

    await subClient.connect();
    return subClient;
  } catch (err) {
    logger.warn(`[PubSub] Could not connect dedicated subscriber: ${(err as Error).message}`);
    return null;
  }
};

/**
 * PubSub Service
 * Cross-process messaging with in-process EventEmitter fallback.
 */
export class PubSubService {
  /**
   * Publish a message to a Redis channel
   */
  async publish(channel: string, message: unknown): Promise<number> {
    const serialized = JSON.stringify(message);

    // Also trigger local event emitter for in-process subscribers
    localEmitter.emit(channel, message);

    try {
      if (isRedisReady()) {
        const client = getRedisClient();
        if (client) {
          return await client.publish(channel, serialized);
        }
      }
      return 1;
    } catch (err) {
      logger.warn(`[PubSub:publish] Error publishing to '${channel}': ${(err as Error).message}`);
      return 0;
    }
  }

  /**
   * Subscribe to a Redis channel with a typed handler
   */
  async subscribe<T = unknown>(channel: string, handler: PubSubHandler<T>): Promise<void> {
    // 1. Register handler in memory
    if (!registeredHandlers.has(channel)) {
      registeredHandlers.set(channel, new Set());
    }
    registeredHandlers.get(channel)!.add(handler as PubSubHandler);

    // 2. Register local fallback
    localEmitter.on(channel, handler);

    // 3. Register on Redis subscriber client
    if (isRedisReady()) {
      try {
        const sub = await getOrCreateSubscriber();
        if (sub) {
          await sub.subscribe(channel);
          logger.debug(`[PubSub] Subscribed to Redis channel: ${channel}`);
        }
      } catch (err) {
        logger.warn(`[PubSub:subscribe] Error subscribing on Redis: ${(err as Error).message}`);
      }
    }
  }

  /**
   * Unsubscribe from a Redis channel
   */
  async unsubscribe(channel: string): Promise<void> {
    registeredHandlers.delete(channel);
    localEmitter.removeAllListeners(channel);

    if (subClient && subClient.status === "ready") {
      try {
        await subClient.unsubscribe(channel);
      } catch {
        // Safe ignore
      }
    }
  }

  /**
   * Close subscriber connection on shutdown
   */
  async close(): Promise<void> {
    if (subClient) {
      try {
        await subClient.quit();
      } catch {
        subClient.disconnect();
      } finally {
        subClient = null;
      }
    }
  }
}

export const pubSubService = new PubSubService();
