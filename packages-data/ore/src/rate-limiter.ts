import { RateLimitError } from './types.ts'

/**
 * Rate limiter configuration
 */
export interface RateLimiterConfig {
  /** Maximum number of requests per interval */
  maxRequests: number
  /** Time window in milliseconds */
  intervalMs: number
  /** Burst capacity (allows short bursts above maxRequests) */
  burstCapacity?: number
}

/**
 * Token bucket rate limiter
 *
 * Implements the token bucket algorithm for smooth rate limiting
 * with optional burst capacity.
 */
export class RateLimiter {
  private tokens: number
  private lastRefill: number
  private readonly maxTokens: number
  private readonly refillRate: number
  private readonly intervalMs: number

  constructor(config: RateLimiterConfig) {
    this.intervalMs = config.intervalMs
    this.maxTokens = config.burstCapacity ?? config.maxRequests
    this.tokens = this.maxTokens
    this.lastRefill = Date.now()
    this.refillRate = config.maxRequests / config.intervalMs
  }

  /**
   * Try to acquire a token for making a request
   *
   * @returns Promise that resolves when a token is available
   * @throws RateLimitError if rate limit is exceeded and cannot wait
   */
  async acquire(): Promise<void> {
    this.refill()

    if (this.tokens >= 1) {
      this.tokens--
      return
    }

    // Calculate wait time for next token
    const tokensNeeded = 1 - this.tokens
    const waitTime = Math.ceil(tokensNeeded / this.refillRate)

    // Wait for token to become available
    await sleep(waitTime)

    // Try again after waiting
    this.refill()
    if (this.tokens >= 1) {
      this.tokens--
      return
    }

    throw new RateLimitError(
      `Rate limit exceeded. Retry after ${waitTime}ms`,
      waitTime,
      'generic',
    )
  }

  /**
   * Check if a request can be made without waiting
   */
  canAcquire(): boolean {
    this.refill()
    return this.tokens >= 1
  }

  /**
   * Get current token count (for debugging/monitoring)
   */
  getTokens(): number {
    this.refill()
    return this.tokens
  }

  private refill(): void {
    const now = Date.now()
    const elapsed = now - this.lastRefill
    const tokensToAdd = elapsed * this.refillRate

    this.tokens = Math.min(this.maxTokens, this.tokens + tokensToAdd)
    this.lastRefill = now
  }
}

/**
 * Rate limiter manager for multiple endpoints
 *
 * Manages separate rate limiters for different endpoints
 * with different limits (e.g., REST vs WebSocket).
 */
export class RateLimiterManager {
  private limiters: Map<string, RateLimiter> = new Map()

  /**
   * Register a rate limiter for an endpoint
   *
   * @param name - Endpoint identifier
   * @param config - Rate limiter configuration
   */
  register(name: string, config: RateLimiterConfig): void {
    this.limiters.set(name, new RateLimiter(config))
  }

  /**
   * Acquire a token from a specific limiter
   *
   * @param name - Endpoint identifier
   */
  async acquire(name: string): Promise<void> {
    const limiter = this.limiters.get(name)
    if (!limiter) {
      throw new Error(`No rate limiter registered for: ${name}`)
    }
    await limiter.acquire()
  }

  /**
   * Check if a request can be made without waiting
   *
   * @param name - Endpoint identifier
   */
  canAcquire(name: string): boolean {
    const limiter = this.limiters.get(name)
    if (!limiter)
      return true
    return limiter.canAcquire()
  }

  /**
   * Get token count for a limiter
   *
   * @param name - Endpoint identifier
   */
  getTokens(name: string): number {
    const limiter = this.limiters.get(name)
    if (!limiter)
      return 0
    return limiter.getTokens()
  }
}

/**
 * Common exchange rate limits
 */
export const ExchangeRateLimits: Record<string, RateLimiterConfig> = {
  /** Binance: 1200 request weight per minute */
  binance: {
    maxRequests: 1200,
    intervalMs: 60 * 1000,
    burstCapacity: 1200,
  },
  /** Binance US: 1200 request weight per minute */
  binanceUs: {
    maxRequests: 1200,
    intervalMs: 60 * 1000,
    burstCapacity: 1200,
  },
  /** OKX: 30 requests per 2 seconds for public endpoints */
  okx: {
    maxRequests: 30,
    intervalMs: 2 * 1000,
    burstCapacity: 60,
  },
  /** Hyperliquid: 1200 requests per minute */
  hyperliquid: {
    maxRequests: 1200,
    intervalMs: 60 * 1000,
    burstCapacity: 1200,
  },
  /** Alpaca: 200 requests per minute */
  alpaca: {
    maxRequests: 200,
    intervalMs: 60 * 1000,
    burstCapacity: 200,
  },
  /** Conservative default: 10 requests per second */
  default: {
    maxRequests: 10,
    intervalMs: 1000,
    burstCapacity: 20,
  },
}

/**
 * Create a rate limiter for a specific exchange
 *
 * @param exchange - Exchange name
 * @param customConfig - Optional custom configuration override
 */
export function createExchangeRateLimiter(
  exchange: string,
  customConfig?: Partial<RateLimiterConfig>,
): RateLimiter {
  const config = ExchangeRateLimits[exchange] ?? ExchangeRateLimits.default
  return new RateLimiter({
    ...config,
    ...customConfig,
  })
}

/**
 * Sleep utility
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}
