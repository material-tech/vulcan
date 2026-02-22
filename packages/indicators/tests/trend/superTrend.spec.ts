import { collect } from '@vulcan-js/core'
import { superTrend } from '@vulcan-js/indicators'
import { describe, expect, it } from 'vitest'

describe('superTrend / SuperTrend Indicator', () => {
  // Tight bands (multiplier=1, period=3) to trigger trend reversals
  const candles = [
    { h: 12, l: 8, c: 10 },
    { h: 13, l: 9, c: 11 },
    { h: 8, l: 4, c: 5 },
    { h: 6, l: 3, c: 4 },
    { h: 10, l: 6, c: 9 },
  ]

  it('should calculate SuperTrend with period=3 multiplier=1', () => {
    const result = collect(superTrend(candles, { period: 3, multiplier: 1 }))

    expect(result).toHaveLength(5)

    // Bar 1: uptrend, ST = HL2 - ATR = 10 - 4 = 6
    expect(result[0].superTrend).toMatchNumber(6)
    expect(result[0].direction).toBe(1)

    // Bar 2: uptrend continues, lower band ratchets up to 7
    expect(result[1].superTrend).toMatchNumber(7)
    expect(result[1].direction).toBe(1)

    // Bar 3: close(5) < finalLower(7) → reversal to downtrend, ST = finalUpper = 11
    expect(result[2].superTrend).toMatchNumber(11)
    expect(result[2].direction).toBe(-1)

    // Bar 4: still downtrend, upper band ratchets down to ~8.83
    expect(result[3].superTrend).toMatchNumber(8.83)
    expect(result[3].direction).toBe(-1)

    // Bar 5: close(9) > finalUpper(8.83) → reversal to uptrend, ST = finalLower
    expect(result[4].superTrend).toMatchNumber(3.11)
    expect(result[4].direction).toBe(1)
  })

  it('should calculate with default options (period=10, multiplier=3)', () => {
    const longCandles = Array.from({ length: 15 }, (_, i) => ({
      h: 100 + i * 2,
      l: 95 + i * 2,
      c: 98 + i * 2,
    }))

    const result = collect(superTrend(longCandles))

    expect(result).toHaveLength(15)
    // All bars should be uptrend in a steadily rising market
    for (const point of result) {
      expect(point.direction).toBe(1)
    }
  })

  it('should work with .create() for stateful processing', () => {
    const process = superTrend.create({ period: 3, multiplier: 1 })

    const r1 = process({ h: 12, l: 8, c: 10 })
    expect(r1.superTrend).toMatchNumber(6)
    expect(r1.direction).toBe(1)

    const r2 = process({ h: 13, l: 9, c: 11 })
    expect(r2.superTrend).toMatchNumber(7)
    expect(r2.direction).toBe(1)

    const r3 = process({ h: 8, l: 4, c: 5 })
    expect(r3.superTrend).toMatchNumber(11)
    expect(r3.direction).toBe(-1)
  })

  it('should throw RangeError for invalid period', () => {
    expect(() => superTrend.create({ period: 0, multiplier: 1 })).toThrow(RangeError)
    expect(() => superTrend.create({ period: -1, multiplier: 1 })).toThrow(RangeError)
    expect(() => superTrend.create({ period: 1.5, multiplier: 1 })).toThrow(RangeError)
  })

  it('should throw RangeError for invalid multiplier', () => {
    expect(() => superTrend.create({ period: 10, multiplier: 0 })).toThrow(RangeError)
    expect(() => superTrend.create({ period: 10, multiplier: -1 })).toThrow(RangeError)
  })

  it('should handle single candle input', () => {
    const result = collect(superTrend([{ h: 10, l: 8, c: 9 }], { period: 3, multiplier: 2 }))
    expect(result).toHaveLength(1)
    expect(result[0].direction).toBe(1)
  })

  it('should return empty array for empty input', () => {
    const result = collect(superTrend([]))
    expect(result).toEqual([])
  })

  it('should use default period of 10 and multiplier of 3', () => {
    expect(superTrend.defaultOptions.period).toBe(10)
    expect(superTrend.defaultOptions.multiplier).toBe(3)
  })

  it('should export as superTrendIndicator alias', async () => {
    const mod = await import('@vulcan-js/indicators')
    expect(mod.superTrendIndicator).toBe(mod.superTrend)
  })
})
