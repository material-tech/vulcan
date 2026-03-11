import { fp18 } from '@vulcan-js/core'
import { CandleCache, defaultCacheConfig, getGlobalCache, resetGlobalCache } from '@vulcan-js/ore'
import { beforeEach, describe, expect, it } from 'vitest'

// Helper to create a test candle
function createCandle(timestamp: number) {
  return {
    o: fp18.toDnum(fp18.toFp18('100')),
    h: fp18.toDnum(fp18.toFp18('110')),
    l: fp18.toDnum(fp18.toFp18('90')),
    c: fp18.toDnum(fp18.toFp18('105')),
    v: fp18.toDnum(fp18.toFp18('1000')),
    timestamp,
  }
}

describe('candleCache', () => {
  beforeEach(() => {
    resetGlobalCache()
  })

  it('should store and retrieve candles', () => {
    const cache = new CandleCache()
    const candles = [createCandle(1000), createCandle(2000)]

    cache.set('BTC-USD', '1h', candles)
    const retrieved = cache.get('BTC-USD', '1h')

    expect(retrieved).toHaveLength(2)
    expect(retrieved?.[0].timestamp).toBe(1000)
  })

  it('should return null for non-existent cache entries', () => {
    const cache = new CandleCache()
    const result = cache.get('BTC-USD', '1h')
    expect(result).toBeNull()
  })

  it('should return null when caching is disabled', () => {
    const cache = new CandleCache({ enabled: false })
    const candles = [createCandle(1000)]

    cache.set('BTC-USD', '1h', candles)
    const retrieved = cache.get('BTC-USD', '1h')

    expect(retrieved).toBeNull()
  })

  it('should merge new candles with existing ones', () => {
    const cache = new CandleCache()
    const candles1 = [createCandle(1000), createCandle(2000)]
    const candles2 = [createCandle(2000), createCandle(3000)]

    cache.set('BTC-USD', '1h', candles1)
    cache.merge('BTC-USD', '1h', candles2)

    const retrieved = cache.get('BTC-USD', '1h')
    expect(retrieved).toHaveLength(3)
    expect(retrieved?.[0].timestamp).toBe(1000)
    expect(retrieved?.[2].timestamp).toBe(3000)
  })

  it('should filter candles by time range', () => {
    const cache = new CandleCache()
    const candles = [
      createCandle(1000),
      createCandle(2000),
      createCandle(3000),
      createCandle(4000),
    ]

    cache.set('BTC-USD', '1h', candles)
    const filtered = cache.get('BTC-USD', '1h', 1500, 3500)

    expect(filtered).toHaveLength(2)
    expect(filtered?.[0].timestamp).toBe(2000)
    expect(filtered?.[1].timestamp).toBe(3000)
  })

  it('should clear specific entries', () => {
    const cache = new CandleCache()
    cache.set('BTC-USD', '1h', [createCandle(1000)])
    cache.set('ETH-USD', '1h', [createCandle(1000)])

    cache.clear('BTC-USD', '1h')

    expect(cache.get('BTC-USD', '1h')).toBeNull()
    expect(cache.get('ETH-USD', '1h')).not.toBeNull()
  })

  it('should clear all entries for a symbol', () => {
    const cache = new CandleCache()
    cache.set('BTC-USD', '1h', [createCandle(1000)])
    cache.set('BTC-USD', '4h', [createCandle(1000)])
    cache.set('ETH-USD', '1h', [createCandle(1000)])

    cache.clear('BTC-USD')

    expect(cache.get('BTC-USD', '1h')).toBeNull()
    expect(cache.get('BTC-USD', '4h')).toBeNull()
    expect(cache.get('ETH-USD', '1h')).not.toBeNull()
  })

  it('should clear all entries', () => {
    const cache = new CandleCache()
    cache.set('BTC-USD', '1h', [createCandle(1000)])
    cache.set('ETH-USD', '1h', [createCandle(1000)])

    cache.clear()

    expect(cache.get('BTC-USD', '1h')).toBeNull()
    expect(cache.get('ETH-USD', '1h')).toBeNull()
  })

  it('should return cache statistics', () => {
    const cache = new CandleCache()
    cache.set('BTC-USD', '1h', [createCandle(1000)])
    cache.set('ETH-USD', '1h', [createCandle(1000)])

    const stats = cache.getStats()

    expect(stats.size).toBe(2)
    expect(stats.maxSize).toBe(defaultCacheConfig.maxSize)
    expect(stats.keys).toContain('BTC-USD:1h')
    expect(stats.keys).toContain('ETH-USD:1h')
  })

  it('should check if data exists in cache', () => {
    const cache = new CandleCache()
    cache.set('BTC-USD', '1h', [createCandle(1000)])

    expect(cache.has('BTC-USD', '1h')).toBe(true)
    expect(cache.has('ETH-USD', '1h')).toBe(false)
  })

  it('should return global cache singleton', () => {
    const cache1 = getGlobalCache()
    const cache2 = getGlobalCache()

    expect(cache1).toBe(cache2)
  })

  it('should reset global cache', () => {
    const cache = getGlobalCache()
    cache.set('BTC-USD', '1h', [createCandle(1000)])

    resetGlobalCache()
    const newCache = getGlobalCache()

    expect(newCache.get('BTC-USD', '1h')).toBeNull()
  })
})
