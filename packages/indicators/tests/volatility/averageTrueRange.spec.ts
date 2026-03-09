import { collect } from '@vulcan-js/core'
import { atr } from '@vulcan-js/indicators'
import { describe, expect, it } from 'vitest'

describe('atr / Average True Range', () => {
  // Sample OHLC data
  const candles = [
    { o: 10, h: 12, l: 9, c: 11 }, // TR = 12-9 = 3
    { o: 11, h: 14, l: 10, c: 13 }, // TR = max(4, 3, 1) = 4
    { o: 13, h: 15, l: 12, c: 14 }, // TR = max(3, 2, 1) = 3
    { o: 14, h: 14, l: 11, c: 12 }, // TR = max(3, 0, 1) = 3
    { o: 12, h: 13, l: 10, c: 11 }, // TR = max(3, 1, 2) = 3
    { o: 11, h: 16, l: 11, c: 15 }, // TR = max(5, 5, 0) = 5
    { o: 15, h: 15, l: 12, c: 13 }, // TR = max(3, 0, 3) = 3
  ]

  it('should calculate ATR with period=3', () => {
    const result = collect(atr(candles, { period: 3 }))

    expect(result).toHaveLength(7)
    // First bar: TR = high - low = 3
    expect(result[0]).toMatchNumber(3)
    // Second bar: TR = max(4, |14-11|, |10-11|) = max(4, 3, 1) = 4
    // SMA warmup: (3+4)/2 = 3.5
    expect(result[1]).toMatchNumber(3.5)
  })

  it('should calculate ATR with period=2', () => {
    const result = collect(atr(candles.slice(0, 5), { period: 2 }))

    expect(result).toHaveLength(5)
    expect(result[0]).toMatchNumber(3) // TR = 3
    expect(result[1]).toMatchNumber(3.5) // (3+4)/2
  })

  it('should work with .create() for stateful processing', () => {
    const process = atr.create({ period: 3 })

    const r1 = process({ o: 10, h: 12, l: 9, c: 11 })
    expect(r1).toMatchNumber(3)

    const r2 = process({ o: 11, h: 14, l: 10, c: 13 })
    expect(r2).toMatchNumber(3.5)

    const r3 = process({ o: 13, h: 15, l: 12, c: 14 })
    // SMA warmup: (3+4+3)/3 = 3.333...
    expect(r3).toMatchNumber(3.33)
  })

  it('should handle gap up scenario', () => {
    // Gap up: current low > previous close
    const gapUpCandles = [
      { o: 10, h: 12, l: 9, c: 11 },
      { o: 15, h: 16, l: 14, c: 15 }, // gap up, TR = max(2, 5, 5) = 5
    ]
    const result = collect(atr(gapUpCandles, { period: 2 }))
    expect(result[0]).toMatchNumber(3) // 12-9
    expect(result[1]).toMatchNumber(4) // (3+5)/2
  })

  it('should handle gap down scenario', () => {
    // Gap down: current high < previous close
    const gapDownCandles = [
      { o: 20, h: 22, l: 19, c: 21 },
      { o: 15, h: 16, l: 14, c: 15 }, // gap down, TR = max(2, 6, 7) = 7
    ]
    const result = collect(atr(gapDownCandles, { period: 2 }))
    expect(result[0]).toMatchNumber(3) // 22-19
    expect(result[1]).toMatchNumber(5) // (3+7)/2
  })

  it('should throw RangeError for invalid period', () => {
    expect(() => atr.create({ period: 0 })).toThrow(RangeError)
    expect(() => atr.create({ period: -1 })).toThrow(RangeError)
    expect(() => atr.create({ period: 1.5 })).toThrow(RangeError)
  })

  it('should handle single candle input', () => {
    const result = collect(atr([{ o: 10, h: 12, l: 9, c: 11 }]))
    expect(result).toHaveLength(1)
    expect(result[0]).toMatchNumber(3)
  })

  it('should return empty array for empty input', () => {
    const result = collect(atr([]))
    expect(result).toEqual([])
  })

  it('should use default period of 14', () => {
    expect(atr.defaultOptions.period).toBe(14)
  })

  it('should calculate ATR with inside bar', () => {
    // Inside bar: current high <= prev high AND current low >= prev low
    const insideBarCandles = [
      { o: 10, h: 20, l: 5, c: 15 }, // TR = 15
      { o: 14, h: 18, l: 12, c: 16 }, // inside bar, TR = max(6, 3, 3) = 6
    ]
    const result = collect(atr(insideBarCandles, { period: 2 }))
    expect(result[0]).toMatchNumber(15)
    expect(result[1]).toMatchNumber(10.5) // (15+6)/2
  })

  it('should export as averageTrueRange alias', async () => {
    const mod = await import('@vulcan-js/indicators')
    expect(mod.averageTrueRange).toBe(mod.atr)
  })

  it('should converge to stable values with constant true range', () => {
    // With constant TR = 10, ATR should converge to 10
    const constantCandles = Array.from({ length: 20 }, () => ({
      o: 50,
      h: 60,
      l: 50,
      c: 55, // TR = 10 each time
    }))
    const result = collect(atr(constantCandles, { period: 5 }))
    // After warmup, ATR should be close to 10
    expect(result[result.length - 1]).toMatchNumber(10)
  })
})
