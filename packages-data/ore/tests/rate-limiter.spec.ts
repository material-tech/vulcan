import {
  RateLimiter,
  RateLimiterManager,
  ExchangeRateLimits,
  createExchangeRateLimiter,
  RateLimitError,
} from '@vulcan-js/ore'
import { describe, expect, it } from 'vitest'

describe('RateLimiter', () => {
  it('should allow requests within rate limit', async () => {
    const limiter = new RateLimiter({
      maxRequests: 10,
      intervalMs: 1000,
    })

    // Should not throw for first request
    await expect(limiter.acquire()).resolves.toBeUndefined()
  })

  it('should track token count', async () => {
    const limiter = new RateLimiter({
      maxRequests: 5,
      intervalMs: 1000,
      burstCapacity: 5,
    })

    // Initially at max capacity
    expect(limiter.getTokens()).toBe(5)

    // After acquiring one token
    await limiter.acquire()
    expect(limiter.getTokens()).toBe(4)
  })

  it('should check if can acquire without waiting', () => {
    const limiter = new RateLimiter({
      maxRequests: 1,
      intervalMs: 1000,
    })

    expect(limiter.canAcquire()).toBe(true)
  })
})

describe('RateLimiterManager', () => {
  it('should register and use rate limiters', async () => {
    const manager = new RateLimiterManager()

    manager.register('api', {
      maxRequests: 10,
      intervalMs: 1000,
    })

    // Should be able to acquire
    expect(manager.canAcquire('api')).toBe(true)

    // Should acquire successfully
    await expect(manager.acquire('api')).resolves.toBeUndefined()
  })

  it('should throw for unregistered limiter', async () => {
    const manager = new RateLimiterManager()

    await expect(manager.acquire('unknown')).rejects.toThrow('No rate limiter registered')
  })

  it('should return true for canAcquire on unregistered limiter', () => {
    const manager = new RateLimiterManager()

    // Should return true for unknown limiters (pass-through)
    expect(manager.canAcquire('unknown')).toBe(true)
  })

  it('should track tokens per limiter', () => {
    const manager = new RateLimiterManager()

    manager.register('api', {
      maxRequests: 5,
      intervalMs: 1000,
      burstCapacity: 5,
    })

    expect(manager.getTokens('api')).toBe(5)
  })

  it('should return 0 tokens for unregistered limiter', () => {
    const manager = new RateLimiterManager()
    expect(manager.getTokens('unknown')).toBe(0)
  })
})

describe('ExchangeRateLimits', () => {
  it('should have predefined rate limits for major exchanges', () => {
    expect(ExchangeRateLimits.binance).toBeDefined()
    expect(ExchangeRateLimits.okx).toBeDefined()
    expect(ExchangeRateLimits.hyperliquid).toBeDefined()
    expect(ExchangeRateLimits.alpaca).toBeDefined()
    expect(ExchangeRateLimits.default).toBeDefined()
  })

  it('should have correct Binance rate limits', () => {
    expect(ExchangeRateLimits.binance.maxRequests).toBe(1200)
    expect(ExchangeRateLimits.binance.intervalMs).toBe(60000)
  })

  it('should have correct OKX rate limits', () => {
    expect(ExchangeRateLimits.okx.maxRequests).toBe(30)
    expect(ExchangeRateLimits.okx.intervalMs).toBe(2000)
  })

  it('should have correct Alpaca rate limits', () => {
    expect(ExchangeRateLimits.alpaca.maxRequests).toBe(200)
    expect(ExchangeRateLimits.alpaca.intervalMs).toBe(60000)
  })
})

describe('createExchangeRateLimiter', () => {
  it('should create limiter for known exchange', () => {
    const limiter = createExchangeRateLimiter('binance')

    expect(limiter).toBeInstanceOf(RateLimiter)
    expect(limiter.canAcquire()).toBe(true)
  })

  it('should create limiter with default config for unknown exchange', () => {
    const limiter = createExchangeRateLimiter('unknown-exchange')

    expect(limiter).toBeInstanceOf(RateLimiter)
  })

  it('should allow custom config override', () => {
    const limiter = createExchangeRateLimiter('binance', {
      maxRequests: 50,
      intervalMs: 1000,
    })

    expect(limiter).toBeInstanceOf(RateLimiter)
  })
})

describe('RateLimitError', () => {
  it('should create RateLimitError with retryAfter', () => {
    const error = new RateLimitError('Rate limited', 5000, 'binance')

    expect(error.message).toBe('Rate limited')
    expect(error.retryAfter).toBe(5000)
    expect(error.exchange).toBe('binance')
    expect(error.code).toBe('RATE_LIMIT')
    expect(error.name).toBe('RateLimitError')
  })
})
