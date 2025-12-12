import Redis from 'ioredis';
import { config } from '../config/env';

/**
 * Redis Client for Upstash
 * Used for BullMQ queue and Pub/Sub
 */
export const redis = new Redis(config.redis.url, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

/**
 * Separate Redis client for Pub/Sub
 * Required because BullMQ uses blocking commands
 */
export const redisPubSub = new Redis(config.redis.url, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

redis.on('error', (err) => {
  console.error('Redis Client Error:', err);
});

redisPubSub.on('error', (err) => {
  console.error('Redis PubSub Error:', err);
});
