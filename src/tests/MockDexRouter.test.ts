import { MockDexRouter, DexQuote } from '../../src/modules/orders/MockDexRouter';

describe('MockDexRouter', () => {
  let router: MockDexRouter;

  beforeEach(() => {
    router = new MockDexRouter(150); // Base price of $150
  });

  describe('Quote Fetching', () => {
    it('should return Raydium quote with price variance', async () => {
      const quote = await router.getRaydiumQuote('SOL', 'USDC', 10);

      expect(quote.dex).toBe('Raydium');
      expect(quote.price).toBeGreaterThan(140); // 150 * 0.98 = 147
      expect(quote.price).toBeLessThan(160); // 150 * 1.02 = 153
      expect(quote.fee).toBe(0.003);
      expect(quote.timestamp).toBeInstanceOf(Date);
    });

    it('should return Meteora quote with price variance', async () => {
      const quote = await router.getMeteorQuote('SOL', 'USDC', 10);

      expect(quote.dex).toBe('Meteora');
      expect(quote.price).toBeGreaterThan(140); // 150 * 0.97 = 145.5
      expect(quote.price).toBeLessThan(160); // 150 * 1.02 = 153
      expect(quote.fee).toBe(0.002);
      expect(quote.timestamp).toBeInstanceOf(Date);
    });

    it('should fetch quotes from both DEXs in parallel', async () => {
      const startTime = Date.now();
      const quotes = await router.getAllQuotes('SOL', 'USDC', 10);
      const endTime = Date.now();

      expect(quotes).toHaveLength(2);
      expect(quotes[0].dex).toBe('Raydium');
      expect(quotes[1].dex).toBe('Meteora');

      // Should take ~200ms (parallel), not ~400ms (sequential)
      expect(endTime - startTime).toBeLessThan(400);
    });
  });

  describe('Best Quote Selection', () => {
    it('should select lowest price for BUY orders', () => {
      const quotes: DexQuote[] = [
        { dex: 'Raydium', price: 150, fee: 0.003, timestamp: new Date() },
        { dex: 'Meteora', price: 148, fee: 0.002, timestamp: new Date() },
      ];

      const best = router.selectBestQuote(quotes, 'BUY');
      expect(best.dex).toBe('Meteora');
      expect(best.price).toBe(148);
    });

    it('should select highest price for SELL orders', () => {
      const quotes: DexQuote[] = [
        { dex: 'Raydium', price: 150, fee: 0.003, timestamp: new Date() },
        { dex: 'Meteora', price: 148, fee: 0.002, timestamp: new Date() },
      ];

      const best = router.selectBestQuote(quotes, 'SELL');
      expect(best.dex).toBe('Raydium');
      expect(best.price).toBe(150);
    });
  });

  describe('Swap Execution', () => {
    it('should execute swap with transaction hash', async () => {
      const result = await router.executeSwap('Raydium', 'SOL', 'USDC', 10, 150);

      expect(result.txHash).toBeDefined();
      expect(result.txHash.length).toBe(88); // Mock Solana tx hash length
      expect(result.executedPrice).toBeCloseTo(150, 0); // Within ±1%
      expect(result.dex).toBe('Raydium');
      expect(result.executedAt).toBeInstanceOf(Date);
    });

    it('should simulate blockchain confirmation delay (2-3 seconds)', async () => {
      const startTime = Date.now();
      await router.executeSwap('Meteora', 'SOL', 'USDC', 10, 150);
      const endTime = Date.now();

      const duration = endTime - startTime;
      expect(duration).toBeGreaterThanOrEqual(2000); // At least 2 seconds
      expect(duration).toBeLessThan(3500); // Less than 3.5 seconds
    });

    it('should apply slippage to execution price', async () => {
      const expectedPrice = 150;
      const result = await router.executeSwap('Raydium', 'SOL', 'USDC', 10, expectedPrice);

      // Slippage should be ±0.1%
      expect(result.executedPrice).toBeGreaterThan(expectedPrice * 0.999);
      expect(result.executedPrice).toBeLessThan(expectedPrice * 1.001);
    });
  });

  describe('Base Price Management', () => {
    it('should update base price correctly', async () => {
      router.setBasePrice(200);

      const quote = await router.getRaydiumQuote('SOL', 'USDC', 10);

      // Price should be around 200, not 150
      expect(quote.price).toBeGreaterThan(190);
      expect(quote.price).toBeLessThan(210);
    });
  });
});
