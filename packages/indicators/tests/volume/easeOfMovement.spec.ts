import { collect } from '@vulcan-js/core'
import { eom, eomDetailed } from '@vulcan-js/indicators'
import { describe, expect, it } from 'vitest'

describe('ease of movement (EOM)', () => {
  // OHLCV candle data for testing
  const candles = [
    { h: 10.0, l: 8.0, v: 10000 },
    { h: 11.0, l: 9.0, v: 12000 },
    { h: 12.0, l: 10.0, v: 15000 },
    { h: 11.5, l: 9.5, v: 8000 },
    { h: 11.0, l: 9.0, v: 5000 },
    { h: 12.5, l: 10.5, v: 18000 },
    { h: 13.0, l: 11.0, v: 20000 },
    { h: 12.0, l: 10.0, v: 10000 },
    { h: 11.5, l: 9.5, v: 7000 },
    { h: 12.0, l: 10.0, v: 9000 },
    { h: 13.5, l: 11.5, v: 22000 },
    { h: 14.0, l: 12.0, v: 25000 },
    { h: 13.5, l: 11.5, v: 15000 },
    { h: 12.5, l: 10.5, v: 12000 },
    { h: 12.0, l: 10.0, v: 10000 },
  ]

  it('should calculate EOM with default period (14)', () => {
    const result = collect(eom(candles))

    expect(result).toHaveLength(candles.length)

    // First value should be zero (no previous midpoint)
    const firstVal = Number(result[0][0]) / 10 ** result[0][1]
    expect(firstVal).toBe(0)

    // All values should be valid numbers
    for (const val of result) {
      expect(Number.isFinite(Number(val[0]))).toBe(true)
    }
  })

  it('should calculate EOM with custom period', () => {
    const result = collect(eom(candles, { period: 5 }))
    expect(result).toHaveLength(candles.length)

    for (const val of result) {
      expect(Number.isFinite(Number(val[0]))).toBe(true)
    }
  })

  it('should calculate EOM with custom volumeDivisor', () => {
    const result = collect(eom(candles, { volumeDivisor: 1000 }))
    expect(result).toHaveLength(candles.length)

    for (const val of result) {
      expect(Number.isFinite(Number(val[0]))).toBe(true)
    }
  })

  it('should handle zero range (high === low) without division by zero', () => {
    const zeroRangeCandles = [
      { h: 10.0, l: 10.0, v: 10000 },
      { h: 11.0, l: 9.0, v: 12000 },
      { h: 12.0, l: 12.0, v: 15000 },
    ]

    const result = collect(eom(zeroRangeCandles))
    expect(result).toHaveLength(3)

    // Should not contain NaN or Infinity
    for (const val of result) {
      expect(Number.isFinite(Number(val[0]))).toBe(true)
    }
  })

  it('should return positive EOM for upward price movement with light volume', () => {
    // Rising prices with relatively light volume should produce positive EOM
    const risingLightVolume = [
      { h: 10.0, l: 8.0, v: 1000 },
      { h: 12.0, l: 10.0, v: 1200 },
      { h: 14.0, l: 12.0, v: 1100 },
      { h: 16.0, l: 14.0, v: 1300 },
      { h: 18.0, l: 16.0, v: 1000 },
    ]

    const result = collect(eom(risingLightVolume, { period: 3 }))
    const lastVal = Number(result[result.length - 1][0]) / 10 ** result[result.length - 1][1]
    expect(lastVal).toBeGreaterThan(0)
  })

  it('should return negative EOM for downward price movement with light volume', () => {
    // Falling prices with relatively light volume should produce negative EOM
    const fallingLightVolume = [
      { h: 18.0, l: 16.0, v: 1000 },
      { h: 16.0, l: 14.0, v: 1200 },
      { h: 14.0, l: 12.0, v: 1100 },
      { h: 12.0, l: 10.0, v: 1300 },
      { h: 10.0, l: 8.0, v: 1000 },
    ]

    const result = collect(eom(fallingLightVolume, { period: 3 }))
    const lastVal = Number(result[result.length - 1][0]) / 10 ** result[result.length - 1][1]
    expect(lastVal).toBeLessThan(0)
  })

  it('should work with stateful processor via .create()', () => {
    const process = eom.create({ period: 5, volumeDivisor: 10000 })

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
    expect(() => collect(eom(candles, { period: 0 }))).toThrow(RangeError)
    expect(() => collect(eom(candles, { period: -1 }))).toThrow(RangeError)
    expect(() => collect(eom(candles, { period: 1.5 }))).toThrow(RangeError)
  })

  it('should throw for invalid volumeDivisor', () => {
    expect(() => collect(eom(candles, { volumeDivisor: 0 }))).toThrow(RangeError)
    expect(() => collect(eom(candles, { volumeDivisor: -100 }))).toThrow(RangeError)
  })

  describe('eomDetailed', () => {
    it('should return both raw and smoothed values', () => {
      const result = collect(eomDetailed(candles, { period: 3 }))

      expect(result).toHaveLength(candles.length)

      for (const val of result) {
        expect(val).toHaveProperty('raw')
        expect(val).toHaveProperty('smoothed')
        expect(Number.isFinite(Number(val.raw[0]))).toBe(true)
        expect(Number.isFinite(Number(val.smoothed[0]))).toBe(true)
      }
    })

    it('should have raw value as zero for first bar', () => {
      const result = collect(eomDetailed(candles.slice(0, 2), { period: 2 }))

      const firstRaw = Number(result[0].raw[0]) / 10 ** result[0].raw[1]
      expect(firstRaw).toBe(0)
    })

    it('should match smoothed value with regular eom', () => {
      const detailed = collect(eomDetailed(candles, { period: 5 }))
      const regular = collect(eom(candles, { period: 5 }))

      expect(detailed).toHaveLength(regular.length)

      for (let i = 0; i < regular.length; i++) {
        expect(detailed[i].smoothed[0]).toBe(regular[i][0])
        expect(detailed[i].smoothed[1]).toBe(regular[i][1])
      }
    })
  })
})
