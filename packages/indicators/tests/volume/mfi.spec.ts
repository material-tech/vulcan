import { collect } from '@vulcan-js/core'
import { mfi } from '@vulcan-js/indicators'
import { describe, expect, it } from 'vitest'

describe('money Flow Index (MFI)', () => {
  // OHLCV candle data for testing
  const candles = [
    { h: 24.20, l: 23.85, c: 23.89, v: 18730 },
    { h: 24.07, l: 23.72, c: 23.95, v: 12272 },
    { h: 24.04, l: 23.64, c: 23.67, v: 24691 },
    { h: 23.87, l: 23.37, c: 23.78, v: 18358 },
    { h: 23.67, l: 23.46, c: 23.50, v: 22964 },
    { h: 23.59, l: 23.18, c: 23.32, v: 15919 },
    { h: 23.80, l: 23.40, c: 23.75, v: 16067 },
    { h: 23.80, l: 23.57, c: 23.79, v: 16568 },
    { h: 24.30, l: 23.77, c: 24.14, v: 16019 },
    { h: 24.15, l: 23.95, c: 23.81, v: 9774 },
    { h: 24.05, l: 23.60, c: 23.78, v: 22573 },
    { h: 24.06, l: 23.84, c: 23.86, v: 12987 },
    { h: 24.22, l: 23.96, c: 24.16, v: 20315 },
    { h: 24.44, l: 24.19, c: 24.25, v: 24582 },
    { h: 24.26, l: 24.07, c: 24.09, v: 20204 },
    { h: 24.39, l: 24.12, c: 24.38, v: 23952 },
    { h: 24.55, l: 24.34, c: 24.44, v: 17127 },
    { h: 24.65, l: 24.32, c: 24.44, v: 13673 },
    { h: 24.96, l: 24.44, c: 24.87, v: 17187 },
    { h: 25.00, l: 24.73, c: 24.60, v: 14602 },
  ]

  it('should calculate MFI with default period (14)', () => {
    const result = collect(mfi(candles))

    // MFI outputs one value per candle. The first candle has no previous TP,
    // so its money flow direction is neutral (0 positive, 0 negative).
    // Values stabilize after the lookback period fills.
    expect(result).toHaveLength(candles.length)

    // All MFI values should be between 0 and 100
    for (const val of result) {
      const num = Number(val[0]) / 10 ** val[1]
      expect(num).toBeGreaterThanOrEqual(0)
      expect(num).toBeLessThanOrEqual(100)
    }
  })

  it('should calculate MFI with a custom period', () => {
    const result = collect(mfi(candles, { period: 5 }))
    expect(result).toHaveLength(candles.length)

    for (const val of result) {
      const num = Number(val[0]) / 10 ** val[1]
      expect(num).toBeGreaterThanOrEqual(0)
      expect(num).toBeLessThanOrEqual(100)
    }
  })

  it('should return 100 when all money flow is positive', () => {
    // Strictly increasing typical prices with volume
    const rising = [
      { h: 10, l: 8, c: 9, v: 100 },
      { h: 11, l: 9, c: 10, v: 100 },
      { h: 12, l: 10, c: 11, v: 100 },
      { h: 13, l: 11, c: 12, v: 100 },
      { h: 14, l: 12, c: 13, v: 100 },
    ]
    const result = collect(mfi(rising, { period: 3 }))
    const lastVal = Number(result[result.length - 1][0]) / 10 ** result[result.length - 1][1]
    expect(lastVal).toBeCloseTo(100, 0)
  })

  it('should return 0 when all money flow is negative', () => {
    // Strictly decreasing typical prices with volume
    const falling = [
      { h: 14, l: 12, c: 13, v: 100 },
      { h: 13, l: 11, c: 12, v: 100 },
      { h: 12, l: 10, c: 11, v: 100 },
      { h: 11, l: 9, c: 10, v: 100 },
      { h: 10, l: 8, c: 9, v: 100 },
    ]
    const result = collect(mfi(falling, { period: 3 }))
    const lastVal = Number(result[result.length - 1][0]) / 10 ** result[result.length - 1][1]
    expect(lastVal).toBeCloseTo(0, 0)
  })

  it('should handle period of 1', () => {
    const data = [
      { h: 10, l: 8, c: 9, v: 100 },
      { h: 11, l: 9, c: 10, v: 200 },
      { h: 10, l: 8, c: 9, v: 150 },
    ]
    const result = collect(mfi(data, { period: 1 }))
    expect(result).toHaveLength(3)
  })

  it('should throw for invalid period', () => {
    const data = [{ h: 10, l: 8, c: 9, v: 100 }]
    expect(() => collect(mfi(data, { period: 0 }))).toThrow(RangeError)
    expect(() => collect(mfi(data, { period: -1 }))).toThrow(RangeError)
    expect(() => collect(mfi(data, { period: 1.5 }))).toThrow(RangeError)
  })
})
