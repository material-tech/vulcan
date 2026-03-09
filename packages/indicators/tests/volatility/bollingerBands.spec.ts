import { collect } from '@vulcan-js/core'
import { bb, sma } from '@vulcan-js/indicators'
import { describe, expect, it } from 'vitest'

describe('bb / Bollinger Bands', () => {
  const prices = [10, 11, 12, 11, 10, 9, 10, 11, 12, 13, 14, 13, 12, 11, 10]

  it('should throw RangeError for period of 0', () => {
    expect(() => bb.create({ period: 0 })).toThrow(RangeError)
  })

  it('should throw RangeError for negative period', () => {
    expect(() => bb.create({ period: -1 })).toThrow(RangeError)
  })

  it('should throw RangeError for non-positive stdDevMultiplier', () => {
    expect(() => bb.create({ stdDevMultiplier: 0 })).toThrow(RangeError)
    expect(() => bb.create({ stdDevMultiplier: -1 })).toThrow(RangeError)
  })

  it('should have middle band equal to SMA', () => {
    const bbResult = collect(bb(prices, { period: 5, stdDevMultiplier: 2 }))
    const smaResult = collect(sma(prices, { period: 5 }))

    expect(bbResult).toHaveLength(smaResult.length)
    for (let i = 0; i < bbResult.length; i++) {
      expect(bbResult[i].middle).toMatchNumber(Number(smaResult[i][0]) / 1e18, { digits: 4 })
    }
  })

  it('should have upper >= middle >= lower for all values', () => {
    const result = collect(bb(prices, { period: 5, stdDevMultiplier: 2 }))

    for (const { upper, middle, lower } of result) {
      expect(upper[0]).toBeGreaterThanOrEqual(middle[0])
      expect(middle[0]).toBeGreaterThanOrEqual(lower[0])
    }
  })

  it('should collapse bands to SMA for constant prices', () => {
    const constantPrices = [10, 10, 10, 10, 10]
    const result = collect(bb(constantPrices, { period: 5, stdDevMultiplier: 2 }))

    expect(result).toHaveLength(5)

    const last = result[result.length - 1]
    expect(last.middle).toMatchNumber(10)
    expect(last.upper).toMatchNumber(10)
    expect(last.lower).toMatchNumber(10)
    expect(last.bandwidth).toMatchNumber(0)
    expect(last.percentB).toMatchNumber(0.5)
  })

  it('should calculate known values for period=5', () => {
    // Window [10, 11, 12, 11, 10]:
    // SMA = 10.8
    // population stdDev = sqrt(((10-10.8)^2 + (11-10.8)^2 + (12-10.8)^2 + (11-10.8)^2 + (10-10.8)^2) / 5)
    //                   = sqrt((0.64 + 0.04 + 1.44 + 0.04 + 0.64) / 5)
    //                   = sqrt(0.56) ≈ 0.74833
    // upper = 10.8 + 2 * 0.74833 ≈ 12.2967
    // lower = 10.8 - 2 * 0.74833 ≈ 9.3033
    const result = collect(bb(prices, { period: 5, stdDevMultiplier: 2 }))

    expect(result[4].middle).toMatchNumber(10.8, { digits: 2 })
    expect(result[4].upper).toMatchNumber(12.30, { digits: 1 })
    expect(result[4].lower).toMatchNumber(9.30, { digits: 1 })
  })

  it('should calculate bandwidth correctly', () => {
    const result = collect(bb(prices, { period: 5, stdDevMultiplier: 2 }))

    // Bandwidth = (upper - lower) / middle
    // For constant prices, bandwidth should be 0
    const constantResult = collect(bb([10, 10, 10, 10, 10], { period: 5, stdDevMultiplier: 2 }))
    expect(constantResult[4].bandwidth).toMatchNumber(0)

    // For varying prices, bandwidth should be positive
    for (let i = 1; i < result.length; i++) {
      const bw = Number(result[i].bandwidth[0]) / 1e18
      expect(bw).toBeGreaterThanOrEqual(0)
    }

    // Higher volatility should produce higher bandwidth
    const stablePrices = [10, 10.1, 10, 10.1, 10]
    const volatilePrices = [10, 15, 5, 15, 5]
    const stableResult = collect(bb(stablePrices, { period: 5, stdDevMultiplier: 2 }))
    const volatileResult = collect(bb(volatilePrices, { period: 5, stdDevMultiplier: 2 }))
    expect(volatileResult[4].bandwidth[0]).toBeGreaterThan(stableResult[4].bandwidth[0])
  })

  it('should calculate percentB correctly', () => {
    // For constant price at the middle, %B should be ~0.5
    const result = collect(bb(prices, { period: 5, stdDevMultiplier: 2 }))

    for (const { percentB } of result) {
      // %B should be in a reasonable range (can be < 0 or > 1 when price is outside bands)
      const pB = Number(percentB[0]) / 1e18
      expect(pB).toBeGreaterThanOrEqual(-1)
      expect(pB).toBeLessThanOrEqual(2)
    }
  })

  it('should have %B = 0.5 for single data point', () => {
    const result = collect(bb([100], { period: 5, stdDevMultiplier: 2 }))

    expect(result).toHaveLength(1)
    expect(result[0].middle).toMatchNumber(100)
    expect(result[0].upper).toMatchNumber(100)
    expect(result[0].lower).toMatchNumber(100)
    expect(result[0].percentB).toMatchNumber(0.5)
  })

  it('should widen bands with higher multipliers', () => {
    const result1 = collect(bb(prices, { period: 5, stdDevMultiplier: 1 }))
    const result2 = collect(bb(prices, { period: 5, stdDevMultiplier: 2 }))
    const result3 = collect(bb(prices, { period: 5, stdDevMultiplier: 3 }))

    const idx = prices.length - 1
    const width1 = result1[idx].upper[0] - result1[idx].lower[0]
    const width2 = result2[idx].upper[0] - result2[idx].lower[0]
    const width3 = result3[idx].upper[0] - result3[idx].lower[0]

    expect(width2).toBeGreaterThan(width1)
    expect(width3).toBeGreaterThan(width2)
  })

  it('should work with .create() for stateful processing', () => {
    const process = bb.create({ period: 5, stdDevMultiplier: 2 })
    const generatorResult = collect(bb(prices, { period: 5, stdDevMultiplier: 2 }))

    for (let i = 0; i < prices.length; i++) {
      const r = process(prices[i])
      expect(r.middle[0]).toBe(generatorResult[i].middle[0])
      expect(r.upper[0]).toBe(generatorResult[i].upper[0])
      expect(r.lower[0]).toBe(generatorResult[i].lower[0])
    }
  })

  it('should return empty array for empty input', () => {
    const result = collect(bb([], { period: 5, stdDevMultiplier: 2 }))
    expect(result).toEqual([])
  })

  it('should use default period of 20', () => {
    expect(bb.defaultOptions.period).toBe(20)
  })

  it('should use default stdDevMultiplier of 2', () => {
    expect(bb.defaultOptions.stdDevMultiplier).toBe(2)
  })

  it('should handle decimal prices', () => {
    const decimalPrices = [10.5, 11.2, 10.8, 11.5, 12.0]
    const result = collect(bb(decimalPrices, { period: 5, stdDevMultiplier: 2 }))

    expect(result).toHaveLength(5)

    const last = result[result.length - 1]
    expect(last.upper[0]).toBeGreaterThanOrEqual(last.middle[0])
    expect(last.middle[0]).toBeGreaterThanOrEqual(last.lower[0])
  })

  it('should export as bollingerBands alias', async () => {
    const mod = await import('@vulcan-js/indicators')
    expect(mod.bollingerBands).toBe(mod.bb)
  })
})
