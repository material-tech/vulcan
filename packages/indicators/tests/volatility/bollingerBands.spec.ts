import { collect } from '@vulcan-js/core'
import { bb } from '@vulcan-js/indicators'
import { describe, expect, it } from 'vitest'

describe('bb / Bollinger Bands', () => {
  // Test data: prices that will create meaningful bands
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

  it('should calculate Bollinger Bands with period=5 and multiplier=2', () => {
    const result = collect(bb(prices, { period: 5, stdDevMultiplier: 2 }))

    expect(result).toHaveLength(15)

    // Check that upper >= middle >= lower for all values after warmup
    for (let i = 4; i < result.length; i++) {
      const { upper, middle, lower } = result[i]
      expect(upper[0]).toBeGreaterThanOrEqual(middle[0])
      expect(middle[0]).toBeGreaterThanOrEqual(lower[0])
    }
  })

  it('should have middle band equal to SMA', () => {
    const result = collect(bb(prices, { period: 5, stdDevMultiplier: 2 }))

    // Middle band should be the SMA of the prices
    // For period 5, after warmup (index 4), SMA of [10,11,12,11,10] = 10.8
    expect(result[4].middle).toMatchNumber(10.8)
  })

  it('should calculate correct band width', () => {
    // Constant prices should have 0 standard deviation, so upper = lower = middle
    const constantPrices = [10, 10, 10, 10, 10]
    const result = collect(bb(constantPrices, { period: 5, stdDevMultiplier: 2 }))

    expect(result).toHaveLength(5)

    // After warmup, all bands should be equal
    const last = result[result.length - 1]
    expect(last.upper[0]).toBe(last.middle[0])
    expect(last.lower[0]).toBe(last.middle[0])
    expect(last.bandwidth[0]).toBe(0n)
  })

  it('should calculate bandwidth correctly', () => {
    const result = collect(bb(prices, { period: 5, stdDevMultiplier: 2 }))

    // Bandwidth = (upper - lower) / middle
    for (let i = 4; i < result.length; i++) {
      const { upper, lower, middle, bandwidth } = result[i]
      const expectedBandwidth = (upper[0] - lower[0]) * 1000000000000000000n / middle[0]
      // Allow small rounding differences
      expect(Number(bandwidth[0])).toBeCloseTo(Number(expectedBandwidth), -10)
    }
  })

  it('should calculate percentB correctly', () => {
    // When price is at upper band, %B should be 1
    // When price is at lower band, %B should be 0
    // When price is at middle, %B should be 0.5
    const result = collect(bb(prices, { period: 5, stdDevMultiplier: 2 }))

    for (let i = 4; i < result.length; i++) {
      const { percentB } = result[i]
      expect(percentB[0]).toBeGreaterThanOrEqual(-0.5e18) // Allow some overshoot
      expect(percentB[0]).toBeLessThanOrEqual(1.5e18) // Allow some overshoot
    }
  })

  it('should work with .create() for stateful processing', () => {
    const process = bb.create({ period: 5, stdDevMultiplier: 2 })

    const results: ReturnType<typeof process>[] = []
    for (const price of prices) {
      results.push(process(price))
    }

    expect(results).toHaveLength(15)

    // After warmup, upper >= middle >= lower
    for (let i = 4; i < results.length; i++) {
      expect(results[i].upper[0]).toBeGreaterThanOrEqual(results[i].middle[0])
      expect(results[i].middle[0]).toBeGreaterThanOrEqual(results[i].lower[0])
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

  it('should handle prices with clear trend', () => {
    // Strong uptrend: bands should expand
    const uptrend = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]
    const result = collect(bb(uptrend, { period: 5, stdDevMultiplier: 2 }))

    // After warmup, check that bands are valid
    for (let i = 4; i < result.length; i++) {
      expect(result[i].upper[0]).toBeGreaterThanOrEqual(result[i].middle[0])
      expect(result[i].middle[0]).toBeGreaterThanOrEqual(result[i].lower[0])
    }
  })

  it('should export as bollingerBands alias', async () => {
    const mod = await import('@vulcan-js/indicators')
    expect(mod.bollingerBands).toBe(mod.bb)
  })

  it('should handle decimal prices', () => {
    const decimalPrices = [10.5, 11.2, 10.8, 11.5, 12.0]
    const result = collect(bb(decimalPrices, { period: 5, stdDevMultiplier: 2 }))

    expect(result).toHaveLength(5)

    // Last value should have valid bands
    const last = result[result.length - 1]
    expect(last.upper[0]).toBeGreaterThanOrEqual(last.middle[0])
    expect(last.middle[0]).toBeGreaterThanOrEqual(last.lower[0])
  })

  it('should handle single price input', () => {
    const result = collect(bb([100], { period: 5, stdDevMultiplier: 2 }))

    expect(result).toHaveLength(1)
    expect(result[0].middle).toMatchNumber(100)
    expect(result[0].upper).toMatchNumber(100)
    expect(result[0].lower).toMatchNumber(100)
    expect(result[0].bandwidth).toMatchNumber(0)
    expect(result[0].percentB).toMatchNumber(0.5)
  })

  it('should calculate bands with different multipliers', () => {
    const testPrices = [10, 11, 12, 11, 10, 9, 10, 11, 12, 11, 10]

    const result1 = collect(bb(testPrices, { period: 5, stdDevMultiplier: 1 }))
    const result2 = collect(bb(testPrices, { period: 5, stdDevMultiplier: 2 }))
    const result3 = collect(bb(testPrices, { period: 5, stdDevMultiplier: 3 }))

    // Higher multiplier = wider bands
    const idx = 10 // Last index
    const width1 = result1[idx].upper[0] - result1[idx].lower[0]
    const width2 = result2[idx].upper[0] - result2[idx].lower[0]
    const width3 = result3[idx].upper[0] - result3[idx].lower[0]

    expect(width2).toBeGreaterThan(width1)
    expect(width3).toBeGreaterThan(width2)
  })
})
