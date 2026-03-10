import { collect } from '@vulcan-js/core'
import { kc, keltnerChannels } from '@vulcan-js/indicators'
import { describe, expect, it } from 'vitest'

describe('keltner channels (KC)', () => {
  const candles = [
    { h: 10.0, l: 8.0, c: 9.0 },
    { h: 11.0, l: 9.0, c: 10.0 },
    { h: 12.0, l: 10.0, c: 11.0 },
    { h: 11.5, l: 9.5, c: 10.5 },
    { h: 11.0, l: 9.0, c: 10.0 },
    { h: 12.0, l: 10.0, c: 11.0 },
    { h: 13.0, l: 11.0, c: 12.0 },
    { h: 14.0, l: 12.0, c: 13.0 },
    { h: 13.5, l: 11.5, c: 12.5 },
    { h: 13.0, l: 11.0, c: 12.0 },
  ]

  it('should calculate Keltner Channels with default parameters', () => {
    const result = collect(keltnerChannels(candles))

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

      expect(Number.isFinite(upper)).toBe(true)
      expect(Number.isFinite(middle)).toBe(true)
      expect(Number.isFinite(lower)).toBe(true)
    }
  })

  it('should calculate Keltner Channels with custom parameters', () => {
    const result = collect(keltnerChannels(candles, { emaPeriod: 5, atrPeriod: 3, multiplier: 1.5 }))

    expect(result).toHaveLength(candles.length)

    for (const channel of result) {
      const upper = Number(channel.upper[0]) / 10 ** channel.upper[1]
      const middle = Number(channel.middle[0]) / 10 ** channel.middle[1]
      const lower = Number(channel.lower[0]) / 10 ** channel.lower[1]

      expect(upper).toBeGreaterThanOrEqual(middle)
      expect(middle).toBeGreaterThanOrEqual(lower)
    }
  })

  it('should have wider channels with higher multiplier', () => {
    const result1 = collect(keltnerChannels(candles, { multiplier: 1 }))
    const result2 = collect(keltnerChannels(candles, { multiplier: 3 }))

    // Compare channel widths at the last bar
    const width1 = Number(result1[result1.length - 1].upper[0]) / 10 ** result1[result1.length - 1].upper[1]
      - Number(result1[result1.length - 1].lower[0]) / 10 ** result1[result1.length - 1].lower[1]
    const width2 = Number(result2[result2.length - 1].upper[0]) / 10 ** result2[result2.length - 1].upper[1]
      - Number(result2[result2.length - 1].lower[0]) / 10 ** result2[result2.length - 1].lower[1]

    expect(width2).toBeGreaterThan(width1)
  })

  it('should work with stateful processor via .create()', () => {
    const process = keltnerChannels.create({ emaPeriod: 5, atrPeriod: 3 })

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

  it('should work with kc alias', () => {
    const result1 = collect(keltnerChannels(candles))
    const result2 = collect(kc(candles))

    expect(result1).toEqual(result2)
  })

  it('should throw for invalid parameters', () => {
    expect(() => collect(keltnerChannels(candles, { emaPeriod: 0 }))).toThrow(RangeError)
    expect(() => collect(keltnerChannels(candles, { atrPeriod: 0 }))).toThrow(RangeError)
    expect(() => collect(keltnerChannels(candles, { multiplier: 0 }))).toThrow(RangeError)
    expect(() => collect(keltnerChannels(candles, { multiplier: -1 }))).toThrow(RangeError)
  })

  it('should expand channels during high volatility', () => {
    // High volatility candles
    const highVolCandles = [
      { h: 10.0, l: 9.0, c: 9.5 },
      { h: 15.0, l: 8.0, c: 11.0 }, // Large range
      { h: 16.0, l: 7.0, c: 11.5 }, // Large range
      { h: 14.0, l: 9.0, c: 11.0 },
    ]

    const result = collect(keltnerChannels(highVolCandles, { emaPeriod: 2, atrPeriod: 2 }))

    // Last bar should have wider channels due to high volatility
    const lastChannel = result[result.length - 1]
    const upper = Number(lastChannel.upper[0]) / 10 ** lastChannel.upper[1]
    const lower = Number(lastChannel.lower[0]) / 10 ** lastChannel.lower[1]
    const width = upper - lower

    expect(width).toBeGreaterThan(0)
  })
})
