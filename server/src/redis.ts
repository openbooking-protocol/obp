import Redis from 'ioredis';
import { config } from './config.js';
import { logger } from './logger.js';

let redis: Redis | null = null;

export function getRedis(): Redis {
  if (!redis) {
    redis = new Redis(config.REDIS_URL, {
      maxRetriesPerRequest: 3,
      lazyConnect: false,
      enableReadyCheck: true,
    });

    redis.on('connect', () => logger.info('Redis connected'));
    redis.on('ready', () => logger.info('Redis ready'));
    redis.on('error', (err) => logger.error({ err }, 'Redis error'));
    redis.on('close', () => logger.warn('Redis connection closed'));
    redis.on('reconnecting', () => logger.info('Redis reconnecting'));
  }
  return redis;
}

export async function closeRedis(): Promise<void> {
  if (redis) {
    await redis.quit();
    redis = null;
    logger.info('Redis connection closed');
  }
}

// Redis key helpers
export const redisKeys = {
  slotHold: (slotId: string) => `slot:hold:${slotId}`,
  rateLimit: (key: string) => `ratelimit:${key}`,
  apiKeyCache: (prefix: string) => `apikey:${prefix}`,
  webhookQueue: () => 'webhook:queue',
} as const;

export const SLOT_HOLD_TTL_SECONDS = 600; // 10 minutes
