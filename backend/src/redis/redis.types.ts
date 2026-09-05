export type RedisConnectionStatus =
  | "connecting"
  | "connect"
  | "ready"
  | "close"
  | "reconnecting"
  | "end"
  | "offline";

export interface CacheOptions {
  /**
   * Time to live in seconds. Default is 300 seconds (5 minutes).
   */
  ttlSeconds?: number;
  /**
   * Optional custom key prefix.
   */
  prefix?: string;
}

export interface RedisHealth {
  status: "healthy" | "degraded" | "offline";
  connected: boolean;
  mode: "redis" | "fallback_memory";
  pingMs?: number;
  info?: {
    redisVersion?: string;
    usedMemoryHuman?: string;
    connectedClients?: number;
  };
}

export type PubSubHandler<T = unknown> = (message: T, channel: string) => void | Promise<void>;

export const CACHE_PREFIXES = {
  DASHBOARD: "dashboard:",
  EMPLOYEE: "employee:",
  CONTRACT: "contract:",
  WORKING_SCHEDULE: "schedule:",
  TIME_OFF: "timeoff:",
  PAYROLL: "payroll:",
  MASTERS: "masters:",
  API: "api:",
} as const;

export type CacheKeyPrefix = (typeof CACHE_PREFIXES)[keyof typeof CACHE_PREFIXES];
