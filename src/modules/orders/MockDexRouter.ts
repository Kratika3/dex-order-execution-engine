import { sleep, generateMockTxHash } from '../../lib/utils';

/**
 * DEX Quote Interface
 */
export interface DexQuote {
  dex: 'Raydium' | 'Meteora';
  price: number;
  fee: number;
  timestamp: Date;
}

/**
 * Swap Execution Result Interface
 */
export interface SwapResult {
  txHash: string;
  executedPrice: number;
  executedAt: Date;
  dex: 'Raydium' | 'Meteora';
}

/**
 * MockDexRouter
 * 
 * Simulates DEX routing by fetching quotes from Raydium and Meteora.
 * Adds realistic variance and network latency to simulate real DEX behavior.
 */
export class MockDexRouter {
  private basePrice: number;

  constructor(basePrice: number = 150) {
    this.basePrice = basePrice;
  }

  /**
   * Get a quote from Raydium
   * Simulates network delay and price variance of ±2-5%
   */
  async getRaydiumQuote(
    _tokenIn: string,
    _tokenOut: string,
    _amount: number
  ): Promise<DexQuote> {
    // Simulate network latency (200ms)
    await sleep(200);

    // Add variance: -2% to +2%
    const variance = 0.98 + Math.random() * 0.04;
    const price = this.basePrice * variance;

    return {
      dex: 'Raydium',
      price: parseFloat(price.toFixed(4)),
      fee: 0.003, // 0.3% fee
      timestamp: new Date(),
    };
  }

  /**
   * Get a quote from Meteora
   * Simulates network delay and price variance of ±3-5%
   */
  async getMeteorQuote(
    _tokenIn: string,
    _tokenOut: string,
    _amount: number
  ): Promise<DexQuote> {
    // Simulate network latency (200ms)
    await sleep(200);

    // Add variance: -3% to +2%
    const variance = 0.97 + Math.random() * 0.05;
    const price = this.basePrice * variance;

    return {
      dex: 'Meteora',
      price: parseFloat(price.toFixed(4)),
      fee: 0.002, // 0.2% fee
      timestamp: new Date(),
    };
  }

  /**
   * Get quotes from both DEXs in parallel
   */
  async getAllQuotes(
    tokenIn: string,
    tokenOut: string,
    amount: number
  ): Promise<DexQuote[]> {
    const [raydiumQuote, meteoraQuote] = await Promise.all([
      this.getRaydiumQuote(tokenIn, tokenOut, amount),
      this.getMeteorQuote(tokenIn, tokenOut, amount),
    ]);

    return [raydiumQuote, meteoraQuote];
  }

  /**
   * Select the best quote (lowest price for BUY, highest for SELL)
   */
  selectBestQuote(quotes: DexQuote[], direction: 'BUY' | 'SELL'): DexQuote {
    if (direction === 'BUY') {
      // For buying, we want the lowest price
      return quotes.reduce((best, current) =>
        current.price < best.price ? current : best
      );
    } else {
      // For selling, we want the highest price
      return quotes.reduce((best, current) =>
        current.price > best.price ? current : best
      );
    }
  }

  /**
   * Execute a swap on the selected DEX
   * Simulates blockchain confirmation delay (2-3 seconds)
   */
  async executeSwap(
    dex: 'Raydium' | 'Meteora',
    _tokenIn: string,
    _tokenOut: string,
    _amount: number,
    expectedPrice: number
  ): Promise<SwapResult> {
    // Simulate blockchain confirmation time (2-3 seconds)
    const confirmationDelay = 2000 + Math.random() * 1000;
    await sleep(confirmationDelay);

    // Add slight slippage (±0.1%)
    const slippage = 0.999 + Math.random() * 0.002;
    const executedPrice = parseFloat((expectedPrice * slippage).toFixed(4));

    return {
      txHash: generateMockTxHash(),
      executedPrice,
      executedAt: new Date(),
      dex,
    };
  }

  /**
   * Update base price (for testing different market conditions)
   */
  setBasePrice(price: number): void {
    this.basePrice = price;
  }
}
