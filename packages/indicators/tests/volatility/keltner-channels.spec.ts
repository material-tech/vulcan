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
    { h: 15.0, l: 13.0, c: 14.0 },
    { h: 16.0, l: 14.0, c: 15.0 },
    { h: 17.0, l: 15.0, c: 16.0 },
    { h: 18.0, l: 16.0, c: 17.0 },
    { h: 19.0, l: 17.0, c: 18.0 },
    { h: 20.0, l: 18.0, c: 19.0 },
    { h: 21.0, l: 19.0, c: 20.0 },
    { h: 22.0, l: 20.0, c: 21.0 },
    { h: 23.0, l: 21.0, c: 22.0 },
    { h: 24.0, l: 22.0, c: 23.0 },
    { h: 25.0, l: 23.0, c: 24.0 },
    { h: 26.0, l: 24.0, c: 25.0 },
    { h: 27.0, l: 25.0, c: 26.0 },
    { h: 28.0, l: 26.0, c: 27.0 },
    { h: 29.0, l: 27.0, c: 28.0 },
    { h: 30.0, l: 28.0, c: 29.0 },
    { h: 31.0, l: 29.0, c: 30.0 },
  ]

  it('should calculate Keltner Channels with default parameters', () => {
    const result = collect(keltnerChannels(candles))

    expect(result).toHaveLength(candles.length)

    for (const channel of result) {
      expect(channel.middle).toBeDefined()
      expect(channel.upper).toBeDefined()
      expect(channel.lower).toBeDefined()

      // Upper should be >= middle >= lower
      const middleVal = Number(channel.middle[0]) / 10 ** channel.middle[1]
      const upperVal = Number(channel.upper[0]) / 10 ** channel.upper[1]
      const lowerVal = Number(channel.lower[0]) / 10 ** channel.lower[1]

      expect(upperVal).toBeGreaterThanOrEqual(middleVal)
      expect(middleVal).toBeGreaterThanOrEqual(lowerVal)
    }
  })

  it('should calculate Keltner Channels with custom parameters', () => {
    const result = collect(keltnerChannels(candles, { period: 10, multiplier: 1.5, atrPeriod: 5 }))

    expect(result).toHaveLength(candles.length)

    for (const channel of result) {
      const middleVal = Number(channel.middle[0]) / 10 ** channel.middle[1]
      const upperVal = Number(channel.upper[0]) / 10 ** channel.upper[1]
      const lowerVal = Number(channel.lower[0]) / 10 ** channel.lower[1]

      expect(upperVal).toBeGreaterThanOrEqual(middleVal)
      expect(middleVal).toBeGreaterThanOrEqual(lowerVal)
    }
  })

  it('should have wider channels with higher multiplier', () => {
    const resultNarrow = collect(keltnerChannels(candles, { multiplier: 1.0 }))
    const resultWide = collect(keltnerChannels(candles, { multiplier: 3.0 }))

    // Compare channel widths at the last bar
    const narrowWidth = Number(resultNarrow[resultNarrow.length - 1].upper[0]) / 10 ** resultNarrow[resultNarrow.length - 1].upper[1]
      - Number(resultNarrow[resultNarrow.length - 1].lower[0]) / 10 ** resultNarrow[resultNarrow.length - 1].lower[1]
    const wideWidth = Number(resultWide[resultWide.length - 1].upper[0]) / 10 ** resultWide[resultWide.length - 1].upper[1]
      - Number(resultWide[resultWide.length - 1].lower[0]) / 10 ** resultWide[resultWide.length - 1].lower[1]

    expect(wideWidth).toBeGreaterThan(narrowWidth)
  })

  it('should follow price trend', () => {
    const uptrend = [
      { h: 10.0, l: 8.0, c: 9.0 },
      { h: 12.0, l: 10.0, c: 11.0 },
      { h: 14.0, l: 12.0, c: 13.0 },
      { h: 16.0, l: 14.0, c: 15.0 },
      { h: 18.0, l: 16.0, c: 17.0 },
      { h: 20.0, l: 18.0, c: 19.0 },
      { h: 22.0, l: 20.0, c: 21.0 },
      { h: 24.0, l: 22.0, c: 23.0 },
      { h: 26.0, l: 24.0, c: 25.0 },
      { h: 28.0, l: 26.0, c: 27.0 },
    ]

    const result = collect(keltnerChannels(uptrend))
    const lastChannel = result[result.length - 1]

    const middleVal = Number(lastChannel.middle[0]) / 10 ** lastChannel.middle[1]
    expect(middleVal).toBeGreaterThan(15) // Should have moved up with price
  })

  it('should work with stateful processor via .create()', () => {
    const process = keltnerChannels.create({ period: 10, multiplier: 2.0, atrPeriod: 5 })

    const results = []
    for (const candle of candles) {
      results.push(process(candle))
    }

    expect(results).toHaveLength(candles.length)

    for (const channel of results) {
      const middleVal = Number(channel.middle[0]) / 10 ** channel.middle[1]
      const upperVal = Number(channel.upper[0]) / 10 ** channel.upper[1]
      const lowerVal = Number(channel.lower[0]) / 10 ** channel.lower[1]

      expect(upperVal).toBeGreaterThanOrEqual(middleVal)
      expect(middleVal).toBeGreaterThanOrEqual(lowerVal)
    }
  })

  it('should work with kc alias', () => {
    const result1 = collect(keltnerChannels(candles))
    const result2 = collect(kc(candles))

    expect(result1).toEqual(result2)
  })

  it('should throw for invalid parameters', () => {
    expect(() => collect(keltnerChannels(candles, { period: 0 }))).toThrow(RangeError)
    expect(() => collect(keltnerChannels(candles, { period: -1 }))).toThrow(RangeError)
    expect(() => collect(keltnerChannels(candles, { multiplier: 0 }))).toThrow(RangeError)
    expect(() => collect(keltnerChannels(candles, { multiplier: -1 }))).toThrow(RangeError)
    expect(() => collect(keltnerChannels(candles, { atrPeriod: 0 }))).toThrow(RangeError)
    expect(() => collect(keltnerChannels(candles, { atrPeriod: -1 }))).toThrow(RangeError)
  })
})
