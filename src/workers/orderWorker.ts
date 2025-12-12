import { Worker, Job } from 'bullmq';
import { redis, redisPubSub } from '../lib/redis';
import { prisma } from '../lib/prisma';
import { MockDexRouter } from '../modules/orders/MockDexRouter';
import { OrderJobData } from '../modules/orders/order.queue';

/**
 * Publish order status update to Redis Pub/Sub
 */
async function publishOrderUpdate(orderId: string, data: any) {
  const channel = `order-updates:${orderId}`;
  await redisPubSub.publish(channel, JSON.stringify(data));
}

/**
 * Update order status in database and publish to Redis
 */
async function updateOrderStatus(
  orderId: string,
  status: 'PENDING' | 'ROUTING' | 'BUILDING' | 'SUBMITTED' | 'CONFIRMED' | 'FAILED',
  additionalData?: any
) {
  // Update in database
  const order = await prisma.order.update({
    where: { id: orderId },
    data: {
      status,
      ...additionalData,
    },
  });

  // Publish to WebSocket subscribers
  await publishOrderUpdate(orderId, {
    orderId,
    status,
    timestamp: new Date().toISOString(),
    ...additionalData,
  });

  return order;
}

/**
 * Add log entry to order's logs array
 */
async function addOrderLog(orderId: string, logMessage: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { logs: true },
  });

  const logs = Array.isArray(order?.logs) ? order.logs : [];
  logs.push({
    message: logMessage,
    timestamp: new Date().toISOString(),
  });

  await prisma.order.update({
    where: { id: orderId },
    data: { logs },
  });
}

/**
 * Order Processing Worker
 * 
 * Implements a state machine for order execution:
 * PENDING -> ROUTING -> BUILDING -> SUBMITTED -> CONFIRMED
 * 
 * Concurrency: 10 orders at the same time
 * Rate Limiting: 100 jobs per minute
 */
export const orderWorker = new Worker<OrderJobData>(
  'order-processing',
  async (job: Job<OrderJobData>) => {
    const { orderId, pair, amount, direction } = job.data;

    console.log(`[Worker] Processing order ${orderId} - ${direction} ${amount} ${pair}`);

    try {
      // ============================================================
      // STEP 1: ROUTING - Fetch quotes from both DEXs
      // ============================================================
      await updateOrderStatus(orderId, 'ROUTING');
      await addOrderLog(orderId, 'Fetching quotes from Raydium and Meteora');

      const [tokenIn, tokenOut] = pair.split('-');
      const dexRouter = new MockDexRouter(150); // Base price for SOL

      // Get quotes from both DEXs in parallel
      const quotes = await dexRouter.getAllQuotes(tokenIn, tokenOut, amount);

      await addOrderLog(
        orderId,
        `Raydium quote: $${quotes[0].price} (fee: ${quotes[0].fee * 100}%)`
      );
      await addOrderLog(
        orderId,
        `Meteora quote: $${quotes[1].price} (fee: ${quotes[1].fee * 100}%)`
      );

      // Select best quote
      const bestQuote = dexRouter.selectBestQuote(quotes, direction);
      const effectivePrice = bestQuote.price * (1 + bestQuote.fee);

      await addOrderLog(
        orderId,
        `Selected ${bestQuote.dex} with effective price: $${effectivePrice.toFixed(4)}`
      );

      // ============================================================
      // STEP 2: BUILDING - Prepare transaction
      // ============================================================
      await updateOrderStatus(orderId, 'BUILDING', {
        executionPrice: effectivePrice,
      });
      await addOrderLog(orderId, `Building transaction on ${bestQuote.dex}`);

      // Simulate transaction building time
      await new Promise((resolve) => setTimeout(resolve, 500));

      // ============================================================
      // STEP 3: SUBMITTED - Execute swap
      // ============================================================
      await updateOrderStatus(orderId, 'SUBMITTED');
      await addOrderLog(orderId, `Submitting transaction to ${bestQuote.dex}`);

      // Execute the swap (simulates 2-3 second blockchain confirmation)
      const swapResult = await dexRouter.executeSwap(
        bestQuote.dex,
        tokenIn,
        tokenOut,
        amount,
        bestQuote.price
      );

      await addOrderLog(
        orderId,
        `Transaction submitted with hash: ${swapResult.txHash}`
      );

      // ============================================================
      // STEP 4: CONFIRMED - Update final status
      // ============================================================
      await updateOrderStatus(orderId, 'CONFIRMED', {
        txHash: swapResult.txHash,
        executionPrice: swapResult.executedPrice,
      });

      await addOrderLog(
        orderId,
        `Order confirmed! Final price: $${swapResult.executedPrice} on ${swapResult.dex}`
      );

      console.log(`[Worker] ✅ Order ${orderId} completed successfully`);

      return {
        success: true,
        txHash: swapResult.txHash,
        executionPrice: swapResult.executedPrice,
        dex: swapResult.dex,
      };
    } catch (error) {
      // ============================================================
      // ERROR HANDLING - Mark as failed and log error
      // ============================================================
      console.error(`[Worker] ❌ Order ${orderId} failed:`, error);

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      await updateOrderStatus(orderId, 'FAILED', {
        logs: await prisma.order
          .findUnique({ where: { id: orderId }, select: { logs: true } })
          .then((order) => {
            const logs = Array.isArray(order?.logs) ? order.logs : [];
            logs.push({
              message: `Error: ${errorMessage}`,
              timestamp: new Date().toISOString(),
            });
            return logs;
          }),
      });

      throw error; // Re-throw to trigger BullMQ retry mechanism
    }
  },
  {
    connection: redis,
    concurrency: 10, // Process 10 orders concurrently
    limiter: {
      max: 100, // Maximum number of jobs
      duration: 60000, // Per 60 seconds (1 minute)
    },
  }
);

// Worker event listeners
orderWorker.on('completed', (job) => {
  console.log(`[Worker] Job ${job.id} completed`);
});

orderWorker.on('failed', (job, err) => {
  console.error(`[Worker] Job ${job?.id} failed with error:`, err.message);
});

orderWorker.on('error', (err) => {
  console.error('[Worker] Worker error:', err);
});

console.log('[Worker] Order worker initialized with 10 concurrent jobs, 100/min rate limit');
