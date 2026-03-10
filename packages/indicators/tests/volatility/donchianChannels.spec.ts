import { collect } from '@vulcan-js/core'
import { dc, donchianChannels } from '@vulcan-js/indicators'
import { describe, expect, it } from 'vitest'

describe('donchian channels (DC)', () => {
  const candles = [
    { h: 10.0, l: 8.0 },
    { h: 11.0, l: 9.0 },
    { h: 12.0, l: 10.0 },
    { h: 11.5, l: 9.5 },
    { h: 11.0, l: 9.0 },
    { h: 12.0, l: 10.0 },
    { h: 13.0, l: 11.0 },
    { h: 14.0, l: 12.0 },
    { h: 13.5, l: 11.5 },
    { h: 13.0, l: 11.0 },
  ]

  it('should calculate Donchian Channels with default parameters', () => {
    const result = collect(donchianChannels(candles))

    expect(result).toHaveLength(candles.length)

    for (const channel of result) {
      expect(channel.upper).toBeDefined()
      expect(channel.middle).toBeDefined()
      expect(channel.lower).toBeDefined()

      const upper = Number(channel.upper[0]) / 10 ** channel.upper[1]
      const middle = Number(channel.middle[0]) / 10 ** channel.middle[1]
      const lower = Number(channel.lower[0]) / 10 ** channel.lower[1]

      // Upper should be >= Middle >= Lower
      expect(upper).toBeGreaterThanOrEqual(middle)
      expect(middle).toBeGreaterThanOrEqual(lower)

      // Middle should be exactly average of upper and lower
      expect(middle).toBeCloseTo((upper + lower) / 2, 10)

      expect(Number.isFinite(upper)).toBe(true)
      expect(Number.isFinite(middle)).toBe(true)
      expect(Number.isFinite(lower)).toBe(true)
    }
  })

  it('should calculate Donchian Channels with custom period', () => {
    const result = collect(donchianChannels(candles, { period: 5 }))

    expect(result).toHaveLength(candles.length)

    for (const channel of result) {
      const upper = Number(channel.upper[0]) / 10 ** channel.upper[1]
      const middle = Number(channel.middle[0]) / 10 ** channel.middle[1]
      const lower = Number(channel.lower[0]) / 10 ** channel.lower[1]

      expect(upper).toBeGreaterThanOrEqual(middle)
      expect(middle).toBeGreaterThanOrEqual(lower)
    }
  })

  it('should track highest high as upper channel', () => {
    const result = collect(donchianChannels(candles, { period: 3 }))

    // At index 2 (3rd candle), upper should be 12 (highest of 10, 11, 12)
    const upper2 = Number(result[2].upper[0]) / 10 ** result[2].upper[1]
    expect(upper2).toBe(12)

    // At index 6 (7th candle), upper should be 13 (highest of 12, 13, 14)
    const upper6 = Number(result[6].upper[0]) / 10 ** result[6].upper[1]
    expect(upper6).toBe(13)
  })

  it('should track lowest low as lower channel', () => {
    const result = collect(donchianChannels(candles, { period: 3 }))

    // At index 2 (3rd candle), lower should be 8 (lowest of 8, 9, 10)
    const lower2 = Number(result[2].lower[0]) / 10 ** result[2].lower[1]
    expect(lower2).toBe(8)

    // At index 6 (7th candle), lower should be 9 (lowest of 9, 10, 11 from candles[4], [5], [6])
    const lower6 = Number(result[6].lower[0]) / 10 ** result[6].lower[1]
    expect(lower6).toBe(9)
  })

  it('should have wider channels with higher volatility', () => {
    // Low volatility candles
    const lowVolCandles = [
      { h: 10.0, l: 9.5 },
      { h: 10.2, l: 9.8 },
      { h: 10.1, l: 9.9 },
      { h: 10.3, l: 10.0 },
    ]

    // High volatility candles
    const highVolCandles = [
      { h: 10.0, l: 9.0 },
      { h: 15.0, l: 8.0 },
      { h: 16.0, l: 7.0 },
      { h: 14.0, l: 9.0 },
    ]

    const resultLow = collect(donchianChannels(lowVolCandles, { period: 3 }))
    const resultHigh = collect(donchianChannels(highVolCandles, { period: 3 }))

    // Compare channel widths at the last bar
    const widthLow = Number(resultLow[resultLow.length - 1].upper[0]) / 10 ** resultLow[resultLow.length - 1].upper[1]
      - Number(resultLow[resultLow.length - 1].lower[0]) / 10 ** resultLow[resultLow.length - 1].lower[1]
    const widthHigh = Number(resultHigh[resultHigh.length - 1].upper[0]) / 10 ** resultHigh[resultHigh.length - 1].upper[1]
      - Number(resultHigh[resultHigh.length - 1].lower[0]) / 10 ** resultHigh[resultHigh.length - 1].lower[1]

    expect(widthHigh).toBeGreaterThan(widthLow)
  })

  it('should work with stateful processor via .create()', () => {
    const process = donchianChannels.create({ period: 5 })

    const results: Array<{ upper: readonly [bigint, number], middle: readonly [bigint, number], lower: readonly [bigint, number] }> = []
    for (const candle of candles) {
      results.push(process(candle))
    }

    expect(results).toHaveLength(candles.length)

    for (const channel of results) {
      const upper = Number(channel.upper[0]) / 10 ** channel.upper[1]
      const middle = Number(channel.middle[0]) / 10 ** channel.middle[1]
      const lower = Number(channel.lower[0]) / 10 ** channel.lower[1]

      expect(upper).toBeGreaterThanOrEqual(middle)
      expect(middle).toBeGreaterThanOrEqual(lower)
    }
  })

  it('should work with dc alias', () => {
    const result1 = collect(donchianChannels(candles))
    const result2 = collect(dc(candles))

    expect(result1).toEqual(result2)
  })

  it('should throw for invalid parameters', () => {
    expect(() => collect(donchianChannels(candles, { period: 0 }))).toThrow(RangeError)
    expect(() => collect(donchianChannels(candles, { period: -1 }))).toThrow(RangeError)
  })

  it('should handle single candle', () => {
    const singleCandle = [{ h: 10.0, l: 8.0 }]
    const result = collect(donchianChannels(singleCandle, { period: 5 }))

    expect(result).toHaveLength(1)
    expect(result[0].upper).toBeDefined()
    expect(result[0].middle).toBeDefined()
    expect(result[0].lower).toBeDefined()

    const upper = Number(result[0].upper[0]) / 10 ** result[0].upper[1]
    const lower = Number(result[0].lower[0]) / 10 ** result[0].lower[1]

    expect(upper).toBe(10)
    expect(lower).toBe(8)
  })
})
