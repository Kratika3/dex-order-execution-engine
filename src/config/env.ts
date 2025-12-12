import { z } from 'zod';
import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

/**
 * Environment Configuration Schema
 * Strictly validates required environment variables for Supabase and Upstash
 */
const envSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required (Supabase PostgreSQL)'),
  REDIS_URL: z.string().min(1, 'REDIS_URL is required (Upstash Redis)'),
  PORT: z.string().default('3000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  WS_PING_INTERVAL: z.string().default('30000'),
});

/**
 * Parse and validate environment variables
 * Throws an error if required variables are missing
 */
function validateEnv() {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error('❌ Invalid environment variables:');
    console.error(parsed.error.flatten().fieldErrors);
    throw new Error('Environment validation failed');
  }

  return parsed.data;
}

export const env = validateEnv();

export const config = {
  database: {
    url: env.DATABASE_URL,
  },
  redis: {
    url: env.REDIS_URL,
  },
  server: {
    port: parseInt(env.PORT, 10),
    environment: env.NODE_ENV,
  },
  websocket: {
    pingInterval: parseInt(env.WS_PING_INTERVAL, 10),
  },
};
