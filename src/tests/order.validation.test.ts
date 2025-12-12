import { createOrderSchema } from '../../src/modules/orders/order.validation';

describe('Order Validation', () => {
  describe('Valid Orders', () => {
    it('should validate a valid BUY order', () => {
      const validOrder = {
        pair: 'SOL-USDC',
        amount: 10.5,
        direction: 'BUY',
      };

      const result = createOrderSchema.safeParse(validOrder);
      expect(result.success).toBe(true);
    });

    it('should validate a valid SELL order', () => {
      const validOrder = {
        pair: 'BTC-USDT',
        amount: 0.001,
        direction: 'SELL',
      };

      const result = createOrderSchema.safeParse(validOrder);
      expect(result.success).toBe(true);
    });
  });

  describe('Invalid Pairs', () => {
    it('should reject lowercase pair format', () => {
      const invalidOrder = {
        pair: 'sol-usdc',
        amount: 10,
        direction: 'BUY',
      };

      const result = createOrderSchema.safeParse(invalidOrder);
      expect(result.success).toBe(false);
    });

    it('should reject pair without hyphen', () => {
      const invalidOrder = {
        pair: 'SOLUSDC',
        amount: 10,
        direction: 'BUY',
      };

      const result = createOrderSchema.safeParse(invalidOrder);
      expect(result.success).toBe(false);
    });

    it('should reject pair with more than two tokens', () => {
      const invalidOrder = {
        pair: 'SOL-USDC-ETH',
        amount: 10,
        direction: 'BUY',
      };

      const result = createOrderSchema.safeParse(invalidOrder);
      expect(result.success).toBe(false);
    });
  });

  describe('Invalid Amounts', () => {
    it('should reject negative amount', () => {
      const invalidOrder = {
        pair: 'SOL-USDC',
        amount: -10,
        direction: 'BUY',
      };

      const result = createOrderSchema.safeParse(invalidOrder);
      expect(result.success).toBe(false);
    });

    it('should reject zero amount', () => {
      const invalidOrder = {
        pair: 'SOL-USDC',
        amount: 0,
        direction: 'BUY',
      };

      const result = createOrderSchema.safeParse(invalidOrder);
      expect(result.success).toBe(false);
    });

    it('should reject amount below minimum', () => {
      const invalidOrder = {
        pair: 'SOL-USDC',
        amount: 0.0001,
        direction: 'BUY',
      };

      const result = createOrderSchema.safeParse(invalidOrder);
      expect(result.success).toBe(false);
    });
  });

  describe('Invalid Directions', () => {
    it('should reject lowercase direction', () => {
      const invalidOrder = {
        pair: 'SOL-USDC',
        amount: 10,
        direction: 'buy',
      };

      const result = createOrderSchema.safeParse(invalidOrder);
      expect(result.success).toBe(false);
    });

    it('should reject invalid direction value', () => {
      const invalidOrder = {
        pair: 'SOL-USDC',
        amount: 10,
        direction: 'HOLD',
      };

      const result = createOrderSchema.safeParse(invalidOrder);
      expect(result.success).toBe(false);
    });
  });
});
