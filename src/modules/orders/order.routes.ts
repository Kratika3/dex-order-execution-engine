import { FastifyInstance } from 'fastify';
import { createOrder, getOrder, listOrders } from './order.controller';

/**
 * Register order routes
 */
export async function orderRoutes(fastify: FastifyInstance) {
  // Create a new order
  fastify.post('/api/orders', createOrder);

  // Get order by ID
  fastify.get('/api/orders/:orderId', getOrder);

  // List all orders
  fastify.get('/api/orders', listOrders);
}
