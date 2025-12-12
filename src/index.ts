import Fastify from 'fastify';
import cors from '@fastify/cors';
import websocketPlugin from '@fastify/websocket';
import { config } from './config/env';
import { prisma } from './lib/prisma';
import { redis } from './lib/redis';
import { orderRoutes } from './modules/orders/order.routes';
import { websocketRoutes } from './modules/websocket/websocket.routes';
import './workers/orderWorker'; // Import to initialize the worker

/**
 * Initialize Fastify Server
 */
const fastify = Fastify({
  logger: {
    level: config.server.environment === 'development' ? 'info' : 'warn',
  },
});

/**
 * Register CORS plugin
 */
fastify.register(cors, {
  origin: true, // Allow all origins in development
  credentials: true,
});

/**
 * Register WebSocket plugin
 */
fastify.register(websocketPlugin);

/**
 * Health check endpoint
 */
fastify.get('/health', async () => {
  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      database: 'connected',
      redis: 'connected',
    },
  };
});

/**
 * Register routes
 */
async function registerRoutes() {
  await fastify.register(orderRoutes);
  await fastify.register(websocketRoutes);
}

/**
 * Start the server
 */
async function start() {
  try {
    console.log('🚀 Starting Solana Order Execution Engine...');

    // Test database connection
    await prisma.$connect();
    console.log('✅ Database connected (Supabase)');

    // Test Redis connection
    await redis.ping();
    console.log('✅ Redis connected (Upstash)');

    // Register all routes
    await registerRoutes();
    console.log('✅ Routes registered');

    // Start server
    const address = await fastify.listen({
      port: config.server.port,
      host: '0.0.0.0', // Listen on all interfaces for deployment
    });

    console.log(`🎉 Server listening at ${address}`);
    console.log(`📊 HTTP API: ${address}/api/orders`);
    console.log(`🔌 WebSocket: ws://localhost:${config.server.port}/ws/orders/:orderId`);
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

/**
 * Graceful shutdown
 */
async function shutdown() {
  console.log('\n🛑 Shutting down gracefully...');

  try {
    await fastify.close();
    await prisma.$disconnect();
    await redis.quit();
    console.log('✅ Shutdown complete');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
}

// Handle shutdown signals
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Start the server
start();
