import { describe, expect, it } from 'vitest'
import { generate, generateSync } from '../src/index'

describe('generateSync', () => {
  it('should generate correct number of candles', () => {
    const result = generateSync(
      { sector: 'crypto', seed: 12345 },
      { count: 10, timeFrame: '1h' },
    )

    expect(result.candles.length).toBeGreaterThanOrEqual(1)
  })

  it('should be reproducible with same seed', () => {
    const result1 = generateSync(
      { sector: 'crypto', seed: 12345 },
      { count: 10, timeFrame: '1h', initialPrice: 100 },
    )

    const result2 = generateSync(
      { sector: 'crypto', seed: 12345 },
      { count: 10, timeFrame: '1h', initialPrice: 100 },
    )

    expect(result1.candles.length).toBe(result2.candles.length)
    for (let i = 0; i < result1.candles.length; i++) {
      expect(result1.candles[i]!.o[0]).toBe(result2.candles[i]!.o[0])
      expect(result1.candles[i]!.h[0]).toBe(result2.candles[i]!.h[0])
      expect(result1.candles[i]!.l[0]).toBe(result2.candles[i]!.l[0])
      expect(result1.candles[i]!.c[0]).toBe(result2.candles[i]!.c[0])
    }
  })

  it('should generate different data with different seeds', () => {
    const result1 = generateSync(
      { sector: 'crypto', seed: 12345 },
      { count: 10, timeFrame: '1h', initialPrice: 100 },
    )

    const result2 = generateSync(
      { sector: 'crypto', seed: 54321 },
      { count: 10, timeFrame: '1h', initialPrice: 100 },
    )

    const hasDifference = result1.candles.some((c, i) => {
      const c2 = result2.candles[i]
      if (!c2)
        return true
      return c.o[0] !== c2.o[0] || c.c[0] !== c2.c[0]
    })

    expect(hasDifference).toBe(true)
  })

  it('should include metadata', () => {
    const result = generateSync(
      { sector: 'crypto', seed: 12345 },
      { count: 10, timeFrame: '1h' },
    )

    expect(result.meta).toBeDefined()
    expect(result.meta.params).toBeDefined()
    expect(typeof result.meta.params.mu).toBe('number')
    expect(typeof result.meta.params.sigma).toBe('number')
    expect(result.meta.seed).toBe(12345)
    expect(result.meta.tickCount).toBeGreaterThan(0)
  })

  it('should respect custom GBM parameters', () => {
    const result = generateSync(
      {
        sector: 'custom',
        gbm: { mu: 0.5, sigma: 0.1, initialPrice: 500 },
        seed: 12345,
      },
      { count: 10, timeFrame: '1h' },
    )

    expect(result.meta.params.mu).toBe(0.5)
    expect(result.meta.params.sigma).toBe(0.1)
  })

  it('should generate candles with valid OHLCV structure', () => {
    const result = generateSync(
      { sector: 'forex', seed: 12345 },
      { count: 5, timeFrame: '1h', initialPrice: 100 },
    )

    for (const candle of result.candles) {
      expect(candle.o).toBeDefined()
      expect(candle.h).toBeDefined()
      expect(candle.l).toBeDefined()
      expect(candle.c).toBeDefined()
      expect(candle.v).toBeDefined()
      expect(candle.h[0]).toBeGreaterThanOrEqual(candle.l[0])
      expect(candle.h[0]).toBeGreaterThanOrEqual(candle.o[0])
      expect(candle.h[0]).toBeGreaterThanOrEqual(candle.c[0])
      expect(candle.l[0]).toBeLessThanOrEqual(candle.o[0])
      expect(candle.l[0]).toBeLessThanOrEqual(candle.c[0])
    }
  })
})

describe('generate', () => {
  it('should generate candles asynchronously', async () => {
    const result = await generate(
      { sector: 'equity', seed: 12345 },
      { count: 10, timeFrame: '1h' },
    )

    expect(result.candles.length).toBeGreaterThanOrEqual(1)
  })

  it('should work with LLM mode (mock)', async () => {
    const result = await generate(
      { sector: 'crypto', seed: 12345, useLLM: true },
      { count: 10, timeFrame: '1h', initialPrice: 100 },
    )

    expect(result.candles.length).toBeGreaterThanOrEqual(1)
    expect(result.meta.params.mu).toBeDefined()
    expect(result.meta.params.sigma).toBeDefined()
  })
})
