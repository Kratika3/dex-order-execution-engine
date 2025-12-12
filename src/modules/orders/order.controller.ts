import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../../lib/prisma';
import { addOrderToQueue } from './order.queue';
import { createOrderSchema, CreateOrderInput } from './order.validation';

/**
 * POST /api/orders
 * Create a new market order and add it to the processing queue
 */
export async function createOrder(
  request: FastifyRequest<{ Body: CreateOrderInput }>,
  reply: FastifyReply
) {
  try {
    // Validate request body
    const validatedData = createOrderSchema.parse(request.body);

    // Create order in database with PENDING status
    const order = await prisma.order.create({
      data: {
        pair: validatedData.pair,
        amount: validatedData.amount,
        direction: validatedData.direction,
        status: 'PENDING',
        logs: [],
      },
    });

    // Add order to BullMQ queue for processing
    await addOrderToQueue({
      orderId: order.id,
      pair: order.pair,
      amount: order.amount,
      direction: order.direction as 'BUY' | 'SELL',
    });

    // Return orderId immediately
    return reply.status(201).send({
      orderId: order.id,
      status: order.status,
      message: 'Order created and queued for processing',
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return reply.status(400).send({
        error: 'Validation error',
        details: error,
      });
    }

    console.error('[API] Error creating order:', error);
    return reply.status(500).send({
      error: 'Failed to create order',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * GET /api/orders/:orderId
 * Get order details by ID
 */
export async function getOrder(
  request: FastifyRequest<{ Params: { orderId: string } }>,
  reply: FastifyReply
) {
  try {
    const { orderId } = request.params;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return reply.status(404).send({
        error: 'Order not found',
      });
    }

    return reply.send(order);
  } catch (error) {
    console.error('[API] Error fetching order:', error);
    return reply.status(500).send({
      error: 'Failed to fetch order',
    });
  }
}

/**
 * GET /api/orders
 * List all orders with optional filters
 */
export async function listOrders(
  request: FastifyRequest<{
    Querystring: { status?: string; limit?: string };
  }>,
  reply: FastifyReply
) {
  try {
    const { status, limit } = request.query;

    const orders = await prisma.order.findMany({
      where: status
        ? {
            status: status as any,
          }
        : undefined,
      orderBy: {
        createdAt: 'desc',
      },
      take: limit ? parseInt(limit, 10) : 50,
    });

    return reply.send({
      orders,
      count: orders.length,
    });
  } catch (error) {
    console.error('[API] Error listing orders:', error);
    return reply.status(500).send({
      error: 'Failed to list orders',
    });
  }
}
