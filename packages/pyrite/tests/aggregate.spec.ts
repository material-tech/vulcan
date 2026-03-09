import type { TickData, TimeFrame } from '../src/types'
import { describe, expect, it } from 'vitest'
import { aggregateToOHLCV, generateTimestamps } from '../src/aggregate'
import { TIMEFRAME_MS } from '../src/types'

describe('aggregateToOHLCV', () => {
  it('should return empty array for empty ticks', () => {
    const candles = aggregateToOHLCV([], '1h', Date.now())
    expect(candles).toEqual([])
  })

  it('should aggregate single tick into one candle', () => {
    const startTime = 1000000000000
    const ticks: TickData[] = [
      { price: 100, volume: 1000, timestamp: startTime + 1000 },
    ]

    const candles = aggregateToOHLCV(ticks, '1h', startTime)

    expect(candles.length).toBe(1)
    expect(candles[0]!.o[0]).toBe(BigInt(100) * BigInt(10) ** BigInt(18))
    expect(candles[0]!.h[0]).toBe(BigInt(100) * BigInt(10) ** BigInt(18))
    expect(candles[0]!.l[0]).toBe(BigInt(100) * BigInt(10) ** BigInt(18))
    expect(candles[0]!.c[0]).toBe(BigInt(100) * BigInt(10) ** BigInt(18))
  })

  it('should correctly aggregate OHLC values', () => {
    const startTime = 1000000000000
    const ticks: TickData[] = [
      { price: 100, volume: 100, timestamp: startTime + 1000 },
      { price: 110, volume: 200, timestamp: startTime + 2000 },
      { price: 90, volume: 150, timestamp: startTime + 3000 },
      { price: 105, volume: 100, timestamp: startTime + 4000 },
    ]

    const candles = aggregateToOHLCV(ticks, '1h', startTime)

    expect(candles.length).toBe(1)
    expect(candles[0]!.o[0]).toBe(BigInt(100) * BigInt(10) ** BigInt(18))
    expect(candles[0]!.h[0]).toBe(BigInt(110) * BigInt(10) ** BigInt(18))
    expect(candles[0]!.l[0]).toBe(BigInt(90) * BigInt(10) ** BigInt(18))
    expect(candles[0]!.c[0]).toBe(BigInt(105) * BigInt(10) ** BigInt(18))
  })

  it('should aggregate volume correctly', () => {
    const startTime = 1000000000000
    const ticks: TickData[] = [
      { price: 100, volume: 100, timestamp: startTime + 1000 },
      { price: 101, volume: 200, timestamp: startTime + 2000 },
      { price: 102, volume: 300, timestamp: startTime + 3000 },
    ]

    const candles = aggregateToOHLCV(ticks, '1h', startTime)

    expect(candles.length).toBe(1)
    expect(candles[0]!.v[0]).toBe(BigInt(600) * BigInt(10) ** BigInt(18))
  })

  it('should create multiple candles for different time buckets', () => {
    const startTime = 1000000000000
    const hourMs = TIMEFRAME_MS['1h']
    const ticks: TickData[] = [
      { price: 100, volume: 100, timestamp: startTime + 1000 },
      { price: 101, volume: 100, timestamp: startTime + hourMs + 1000 },
      { price: 102, volume: 100, timestamp: startTime + 2 * hourMs + 1000 },
    ]

    const candles = aggregateToOHLCV(ticks, '1h', startTime)

    expect(candles.length).toBe(3)
  })

  it('should set correct timestamps on candles', () => {
    const startTime = 1000000000000
    const hourMs = TIMEFRAME_MS['1h']
    const ticks: TickData[] = [
      { price: 100, volume: 100, timestamp: startTime + 1000 },
      { price: 101, volume: 100, timestamp: startTime + hourMs + 1000 },
    ]

    const candles = aggregateToOHLCV(ticks, '1h', startTime)

    expect(candles[0]!.timestamp).toBe(startTime)
    expect(candles[1]!.timestamp).toBe(startTime + hourMs)
  })
})

describe('generateTimestamps', () => {
  it('should generate correct number of timestamps', () => {
    const startTime = 1000000000000
    const timestamps = generateTimestamps(10, '1h', startTime)

    expect(timestamps.length).toBe(10)
  })

  it('should generate timestamps in ascending order', () => {
    const startTime = 1000000000000
    const timestamps = generateTimestamps(10, '1h', startTime)

    for (let i = 1; i < timestamps.length; i++) {
      expect(timestamps[i]).toBeGreaterThan(timestamps[i - 1]!)
    }
  })

  it('should respect timeframe interval', () => {
    const startTime = 1000000000000
    const count = 5
    const timeFrame: TimeFrame = '1h'
    const interval = TIMEFRAME_MS[timeFrame]

    const timestamps = generateTimestamps(count, timeFrame, startTime)

    const firstTimestamp = timestamps[0]!
    const lastTimestamp = timestamps[timestamps.length - 1]!
    const span = lastTimestamp - firstTimestamp

    expect(span).toBeGreaterThanOrEqual((count - 1) * interval * 0.5)
    expect(span).toBeLessThan(count * interval)
  })
})
