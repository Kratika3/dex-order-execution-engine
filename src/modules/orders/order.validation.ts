import { z } from 'zod';

/**
 * Validation Schema for Order Creation
 */
export const createOrderSchema = z.object({
  pair: z
    .string()
    .regex(/^[A-Z]+-[A-Z]+$/, 'Pair must be in format TOKEN-TOKEN (e.g., SOL-USDC)')
    .refine((val) => val.split('-').length === 2, 'Pair must contain exactly two tokens'),
  amount: z
    .number()
    .positive('Amount must be positive')
    .min(0.001, 'Amount must be at least 0.001'),
  direction: z.enum(['BUY', 'SELL'], {
    errorMap: () => ({ message: 'Direction must be either BUY or SELL' }),
  }),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
