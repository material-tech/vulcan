import { collect } from '@vulcan-js/core'
import { dc, donchianChannels } from '@vulcan-js/indicators'
import { describe, expect, it } from 'vitest'

describe('donchian channels (DC)', () => {
  const candles = [
    { h: 10.0, l: 8.0, c: 9.0 },
    { h: 11.0, l: 9.0, c: 10.0 },
    { h: 12.0, l: 10.0, c: 11.0 },
    { h: 11.5, l: 9.5, c: 10.5 },
    { h: 11.0, l: 9.0, c: 10.0 },
    { h: 12.0, l: 10.0, c: 11.0 },
    { h: 13.0, l: 11.0, c: 12.0 },
    { h: 14.0, l: 12.0, c: 13.0 },
    { h: 15.0, l: 13.0, c: 14.0 },
    { h: 16.0, l: 14.0, c: 15.0 },
  ]

  it('should calculate Donchian Channels with default period (20)', () => {
    const result = collect(donchianChannels(candles))

    expect(result).toHaveLength(candles.length)

    for (const channel of result) {
      expect(channel.upper).toBeDefined()
      expect(channel.middle).toBeDefined()
      expect(channel.lower).toBeDefined()

      // Upper should be >= middle >= lower
      const upperVal = Number(channel.upper[0]) / 10 ** channel.upper[1]
      const middleVal = Number(channel.middle[0]) / 10 ** channel.middle[1]
      const lowerVal = Number(channel.lower[0]) / 10 ** channel.lower[1]

      expect(upperVal).toBeGreaterThanOrEqual(middleVal)
      expect(middleVal).toBeGreaterThanOrEqual(lowerVal)
    }
  })

  it('should calculate Donchian Channels with custom period', () => {
    const result = collect(donchianChannels(candles, { period: 5 }))

    expect(result).toHaveLength(candles.length)

    for (const channel of result) {
      const upperVal = Number(channel.upper[0]) / 10 ** channel.upper[1]
      const middleVal = Number(channel.middle[0]) / 10 ** channel.middle[1]
      const lowerVal = Number(channel.lower[0]) / 10 ** channel.lower[1]

      expect(upperVal).toBeGreaterThanOrEqual(middleVal)
      expect(middleVal).toBeGreaterThanOrEqual(lowerVal)
    }
  })

  it('should have upper equal to highest high over period', () => {
    const period = 5
    const result = collect(donchianChannels(candles, { period }))

    // Check last bar
    const lastChannel = result[result.length - 1]
    const upperVal = Number(lastChannel.upper[0]) / 10 ** lastChannel.upper[1]

    // Calculate expected highest high over last 5 bars
    const last5Highs = candles.slice(-5).map(c => c.h)
    const expectedUpper = Math.max(...last5Highs)

    expect(upperVal).toBeCloseTo(expectedUpper, 1)
  })

  it('should have lower equal to lowest low over period', () => {
    const period = 5
    const result = collect(donchianChannels(candles, { period }))

    // Check last bar
    const lastChannel = result[result.length - 1]
    const lowerVal = Number(lastChannel.lower[0]) / 10 ** lastChannel.lower[1]

    // Calculate expected lowest low over last 5 bars
    const last5Lows = candles.slice(-5).map(c => c.l)
    const expectedLower = Math.min(...last5Lows)

    expect(lowerVal).toBeCloseTo(expectedLower, 1)
  })

  it('should have middle equal to average of upper and lower', () => {
    const result = collect(donchianChannels(candles, { period: 5 }))

    for (const channel of result) {
      const upperVal = Number(channel.upper[0]) / 10 ** channel.upper[1]
      const middleVal = Number(channel.middle[0]) / 10 ** channel.middle[1]
      const lowerVal = Number(channel.lower[0]) / 10 ** channel.lower[1]

      expect(middleVal).toBeCloseTo((upperVal + lowerVal) / 2, 1)
    }
  })

  it('should expand channels during high volatility', () => {
    const volatileCandles = [
      { h: 10.0, l: 9.0, c: 9.5 },
      { h: 15.0, l: 8.0, c: 11.5 }, // high volatility
      { h: 16.0, l: 7.0, c: 11.5 }, // even higher volatility
    ]

    const result = collect(donchianChannels(volatileCandles, { period: 2 }))

    // Channel should be wide at the end
    const lastChannel = result[result.length - 1]
    const upperVal = Number(lastChannel.upper[0]) / 10 ** lastChannel.upper[1]
    const lowerVal = Number(lastChannel.lower[0]) / 10 ** lastChannel.lower[1]
    const width = upperVal - lowerVal

    expect(width).toBeGreaterThan(5) // Should be wide
  })

  it('should contract channels during low volatility', () => {
    const stableCandles = [
      { h: 10.0, l: 9.0, c: 9.5 },
      { h: 10.1, l: 9.1, c: 9.6 },
      { h: 10.2, l: 9.2, c: 9.7 },
    ]

    const result = collect(donchianChannels(stableCandles, { period: 2 }))

    // Channel should be narrow at the end
    const lastChannel = result[result.length - 1]
    const upperVal = Number(lastChannel.upper[0]) / 10 ** lastChannel.upper[1]
    const lowerVal = Number(lastChannel.lower[0]) / 10 ** lastChannel.lower[1]
    const width = upperVal - lowerVal

    expect(width).toBeLessThan(2) // Should be narrow
  })

  it('should work with stateful processor via .create()', () => {
    const process = donchianChannels.create({ period: 5 })

    const results = []
    for (const candle of candles) {
      results.push(process(candle))
    }

    expect(results).toHaveLength(candles.length)

    for (const channel of results) {
      const upperVal = Number(channel.upper[0]) / 10 ** channel.upper[1]
      const middleVal = Number(channel.middle[0]) / 10 ** channel.middle[1]
      const lowerVal = Number(channel.lower[0]) / 10 ** channel.lower[1]

      expect(upperVal).toBeGreaterThanOrEqual(middleVal)
      expect(middleVal).toBeGreaterThanOrEqual(lowerVal)
    }
  })

  it('should work with dc alias', () => {
    const result1 = collect(donchianChannels(candles))
    const result2 = collect(dc(candles))

    expect(result1).toEqual(result2)
  })

  it('should throw for invalid period', () => {
    expect(() => collect(donchianChannels(candles, { period: 0 }))).toThrow(RangeError)
    expect(() => collect(donchianChannels(candles, { period: -1 }))).toThrow(RangeError)
    expect(() => collect(donchianChannels(candles, { period: 1.5 }))).toThrow(RangeError)
  })
})
