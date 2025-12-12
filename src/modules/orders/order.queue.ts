import { Queue } from 'bullmq';
import { redis } from '../../lib/redis';

/**
 * Order Job Data Interface
 */
export interface OrderJobData {
  orderId: string;
  pair: string;
  amount: number;
  direction: 'BUY' | 'SELL';
}

/**
 * Order Queue
 * Handles concurrent order processing with rate limiting
 */
export const orderQueue = new Queue<OrderJobData>('order-processing', {
  connection: redis,
  defaultJobOptions: {
    attempts: 3, // Retry up to 3 times on failure
    backoff: {
      type: 'exponential',
      delay: 2000, // Start with 2 seconds, then 4s, 8s
    },
    removeOnComplete: {
      age: 3600, // Keep completed jobs for 1 hour
      count: 1000, // Keep last 1000 completed jobs
    },
    removeOnFail: {
      age: 86400, // Keep failed jobs for 24 hours
    },
  },
});

/**
 * Add an order to the processing queue
 */
export async function addOrderToQueue(jobData: OrderJobData): Promise<string> {
  const job = await orderQueue.add('process-order', jobData, {
    jobId: jobData.orderId, // Use orderId as job ID to prevent duplicates
  });

  return job.id!;
}
