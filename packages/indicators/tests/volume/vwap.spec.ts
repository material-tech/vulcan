import { collect } from '@vulcan-js/core'
import { vwap } from '@vulcan-js/indicators'
import { describe, expect, it } from 'vitest'

describe('volume weighted average price (VWAP)', () => {
  // OHLCV candle data for testing
  const candles = [
    { h: 10.0, l: 8.0, c: 9.0, v: 1000 },
    { h: 11.0, l: 9.0, c: 10.0, v: 2000 },
    { h: 12.0, l: 10.0, c: 11.0, v: 1500 },
    { h: 11.5, l: 9.5, c: 10.5, v: 800 },
    { h: 11.0, l: 9.0, c: 10.0, v: 1200 },
  ]

  it('should calculate cumulative VWAP with default period (0)', () => {
    const result = collect(vwap(candles))

    expect(result).toHaveLength(candles.length)

    // First bar: Typical = (10+8+9)/3 = 9, VWAP = 9
    const firstVal = Number(result[0][0]) / 10 ** result[0][1]
    expect(firstVal).toBeCloseTo(9, 1)

    // All values should be valid numbers
    for (const val of result) {
      expect(Number.isFinite(Number(val[0]))).toBe(true)
    }
  })

  it('should calculate rolling VWAP with custom period', () => {
    const result = collect(vwap(candles, { period: 3 }))

    expect(result).toHaveLength(candles.length)

    // After 3 bars, we should have a proper rolling VWAP
    // Before that, it's just cumulative
    for (const val of result) {
      expect(Number.isFinite(Number(val[0]))).toBe(true)
    }
  })

  it('should handle zero volume', () => {
    const zeroVolCandles = [
      { h: 10.0, l: 8.0, c: 9.0, v: 0 },
      { h: 11.0, l: 9.0, c: 10.0, v: 1000 },
    ]

    const result = collect(vwap(zeroVolCandles))

    // First bar has zero volume, VWAP should be 0
    expect(Number(result[0][0])).toBe(0)

    // Second bar: VWAP = (0 + 10*1000) / (0 + 1000) = 10
    const secondVal = Number(result[1][0]) / 10 ** result[1][1]
    expect(secondVal).toBeCloseTo(10, 1)
  })

  it('should produce higher VWAP during uptrend', () => {
    const uptrend = [
      { h: 10.0, l: 8.0, c: 9.0, v: 1000 },
      { h: 12.0, l: 10.0, c: 11.0, v: 1000 },
      { h: 14.0, l: 12.0, c: 13.0, v: 1000 },
    ]

    const result = collect(vwap(uptrend))

    // VWAP should increase during uptrend
    const vwap1 = Number(result[0][0]) / 10 ** result[0][1]
    const vwap3 = Number(result[2][0]) / 10 ** result[2][1]

    expect(vwap3).toBeGreaterThan(vwap1)
  })

  it('should produce lower VWAP during downtrend', () => {
    const downtrend = [
      { h: 14.0, l: 12.0, c: 13.0, v: 1000 },
      { h: 12.0, l: 10.0, c: 11.0, v: 1000 },
      { h: 10.0, l: 8.0, c: 9.0, v: 1000 },
    ]

    const result = collect(vwap(downtrend))

    // VWAP should decrease during downtrend
    const vwap1 = Number(result[0][0]) / 10 ** result[0][1]
    const vwap3 = Number(result[2][0]) / 10 ** result[2][1]

    expect(vwap3).toBeLessThan(vwap1)
  })

  it('should work with stateful processor via .create()', () => {
    const process = vwap.create({ period: 0 })

    const results: Array<readonly [bigint, number]> = []
    for (const candle of candles) {
      results.push(process(candle))
    }

    expect(results).toHaveLength(candles.length)

    for (const val of results) {
      expect(Number.isFinite(Number(val[0]))).toBe(true)
    }
  })

  it('should work with rolling window via .create()', () => {
    const process = vwap.create({ period: 2 })

    const results: Array<readonly [bigint, number]> = []
    for (const candle of candles) {
      results.push(process(candle))
    }

    expect(results).toHaveLength(candles.length)

    for (const val of results) {
      expect(Number.isFinite(Number(val[0]))).toBe(true)
    }
  })

  it('should throw for invalid period', () => {
    expect(() => collect(vwap(candles, { period: -1 }))).toThrow(RangeError)
    expect(() => collect(vwap(candles, { period: 1.5 }))).toThrow(RangeError)
  })

  it('should calculate correct VWAP values manually', () => {
    // Simple case: 2 bars
    const simpleCandles = [
      { h: 10.0, l: 8.0, c: 9.0, v: 1000 }, // Typical = 9, TPV = 9000
      { h: 12.0, l: 10.0, c: 11.0, v: 2000 }, // Typical = 11, TPV = 22000
    ]

    const result = collect(vwap(simpleCandles))

    // First bar: VWAP = 9
    const vwap1 = Number(result[0][0]) / 10 ** result[0][1]
    expect(vwap1).toBeCloseTo(9, 1)

    // Second bar: VWAP = (9000 + 22000) / (1000 + 2000) = 31000 / 3000 = 10.33...
    const vwap2 = Number(result[1][0]) / 10 ** result[1][1]
    expect(vwap2).toBeCloseTo(10.33, 1)
  })
})
