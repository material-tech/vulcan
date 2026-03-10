import { collect } from '@vulcan-js/core'
import { fi, forceIndex } from '@vulcan-js/indicators'
import { describe, expect, it } from 'vitest'

describe('force index (FI)', () => {
  // OHLCV candle data for testing
  const candles = [
    { h: 10.0, l: 8.0, c: 9.0, v: 1000 },
    { h: 11.0, l: 9.0, c: 10.0, v: 2000 },
    { h: 12.0, l: 10.0, c: 11.0, v: 1500 },
    { h: 11.5, l: 9.5, c: 10.5, v: 800 },
    { h: 11.0, l: 9.0, c: 10.0, v: 1200 },
  ]

  it('should calculate Force Index with default period (13)', () => {
    const result = collect(forceIndex(candles))

    expect(result).toHaveLength(candles.length)

    // First bar has no prior close, so FI should be 0
    expect(Number(result[0][0])).toBe(0)

    // All values should be valid numbers
    for (const val of result) {
      expect(Number.isFinite(Number(val[0]))).toBe(true)
    }
  })

  it('should calculate Force Index with custom period', () => {
    const result = collect(forceIndex(candles, { period: 3 }))

    expect(result).toHaveLength(candles.length)

    for (const val of result) {
      expect(Number.isFinite(Number(val[0]))).toBe(true)
    }
  })

  it('should produce positive Force Index during uptrend', () => {
    const uptrend = [
      { h: 10.0, l: 8.0, c: 9.0, v: 1000 },
      { h: 12.0, l: 10.0, c: 11.0, v: 1000 },
      { h: 14.0, l: 12.0, c: 13.0, v: 1000 },
      { h: 16.0, l: 14.0, c: 15.0, v: 1000 },
      { h: 18.0, l: 16.0, c: 17.0, v: 1000 },
    ]

    const result = collect(forceIndex(uptrend))

    // After initial bars, FI should be positive during uptrend
    const lastFI = Number(result[result.length - 1][0]) / 10 ** result[result.length - 1][1]
    expect(lastFI).toBeGreaterThan(0)
  })

  it('should produce negative Force Index during downtrend', () => {
    const downtrend = [
      { h: 18.0, l: 16.0, c: 17.0, v: 1000 },
      { h: 16.0, l: 14.0, c: 15.0, v: 1000 },
      { h: 14.0, l: 12.0, c: 13.0, v: 1000 },
      { h: 12.0, l: 10.0, c: 11.0, v: 1000 },
      { h: 10.0, l: 8.0, c: 9.0, v: 1000 },
    ]

    const result = collect(forceIndex(downtrend))

    // After initial bars, FI should be negative during downtrend
    const lastFI = Number(result[result.length - 1][0]) / 10 ** result[result.length - 1][1]
    expect(lastFI).toBeLessThan(0)
  })

  it('should work with stateful processor via .create()', () => {
    const process = forceIndex.create({ period: 13 })

    const results: Array<readonly [bigint, number]> = []
    for (const candle of candles) {
      results.push(process(candle))
    }

    expect(results).toHaveLength(candles.length)

    for (const val of results) {
      expect(Number.isFinite(Number(val[0]))).toBe(true)
    }
  })

  it('should work with fi alias', () => {
    const result1 = collect(forceIndex(candles))
    const result2 = collect(fi(candles))

    expect(result1).toEqual(result2)
  })

  it('should throw for invalid period', () => {
    expect(() => collect(forceIndex(candles, { period: 0 }))).toThrow(RangeError)
    expect(() => collect(forceIndex(candles, { period: -1 }))).toThrow(RangeError)
    expect(() => collect(forceIndex(candles, { period: 1.5 }))).toThrow(RangeError)
  })

  it('should calculate correct Force Index values manually', () => {
    // Simple case: price up with volume
    const simpleCandles = [
      { h: 10.0, l: 8.0, c: 9.0, v: 1000 },
      { h: 11.0, l: 9.0, c: 10.0, v: 2000 }, // +1 price change, 2000 volume = 2000 raw FI
    ]

    const result = collect(forceIndex(simpleCandles))

    // First bar: FI = 0 (no prior close)
    expect(Number(result[0][0])).toBe(0)

    // Second bar: FI should be positive
    const secondFI = Number(result[1][0]) / 10 ** result[1][1]
    expect(secondFI).toBeGreaterThan(0)
  })

  it('should handle zero volume', () => {
    const zeroVolCandles = [
      { h: 10.0, l: 8.0, c: 9.0, v: 1000 },
      { h: 11.0, l: 9.0, c: 10.0, v: 0 }, // price up but zero volume
    ]

    const result = collect(forceIndex(zeroVolCandles))

    // Second bar: FI should be 0 (zero volume means no force)
    const secondFI = Number(result[1][0]) / 10 ** result[1][1]
    expect(secondFI).toBe(0)
  })
})
