import type { CandleData } from '@vulcan-js/core'
import type { CacheConfig, Timeframe } from './types.ts'
import { defu } from 'defu'

/**
 * Default cache configuration
 */
export const defaultCacheConfig: CacheConfig = {
  enabled: true,
  maxSize: 10000,
  ttl: 5 * 60 * 1000, // 5 minutes
  persistent: false,
}

/**
 * Cache key for candle data
 */
function getCacheKey(symbol: string, timeframe: Timeframe): string {
  return `${symbol}:${timeframe}`
}

/**
 * Cached candle entry with metadata
 */
interface CacheEntry {
  candles: CandleData[]
  timestamp: number
  symbol: string
  timeframe: Timeframe
}

/**
 * In-memory cache for candle data
 *
 * Provides a simple LRU (Least Recently Used) cache for historical
 * candle data to reduce API calls and improve performance.
 */
export class CandleCache {
  private cache: Map<string, CacheEntry> = new Map()
  private config: CacheConfig
  private accessOrder: string[] = []

  constructor(config?: Partial<CacheConfig>) {
    this.config = defu(config, defaultCacheConfig)
  }

  /**
   * Get cached candles for a symbol/timeframe
   *
   * @param symbol - Trading pair symbol
   * @param timeframe - Candle timeframe
   * @param startTime - Optional start time filter (timestamp in ms)
   * @param endTime - Optional end time filter (timestamp in ms)
   * @returns Array of cached candles or null if not found/expired
   */
  get(
    symbol: string,
    timeframe: Timeframe,
    startTime?: number,
    endTime?: number,
  ): CandleData[] | null {
    if (!this.config.enabled)
      return null

    const key = getCacheKey(symbol, timeframe)
    const entry = this.cache.get(key)

    if (!entry)
      return null

    // Check TTL
    const now = Date.now()
    if (now - entry.timestamp > this.config.ttl) {
      this.delete(key)
      return null
    }

    // Update access order for LRU
    this.updateAccessOrder(key)

    // Filter by time range if specified
    let candles = entry.candles
    if (startTime || endTime) {
      candles = candles.filter((candle) => {
        const ts = typeof candle.timestamp === 'number'
          ? candle.timestamp
          : new Date(candle.timestamp!).getTime()
        if (startTime && ts < startTime)
          return false
        if (endTime && ts > endTime)
          return false
        return true
      })
    }

    return candles
  }

  /**
   * Store candles in cache
   *
   * @param symbol - Trading pair symbol
   * @param timeframe - Candle timeframe
   * @param candles - Array of candle data to cache
   */
  set(symbol: string, timeframe: Timeframe, candles: CandleData[]): void {
    if (!this.config.enabled || candles.length === 0)
      return

    const key = getCacheKey(symbol, timeframe)

    // Enforce max size with LRU eviction
    while (this.cache.size >= this.config.maxSize && !this.cache.has(key)) {
      this.evictLRU()
    }

    const entry: CacheEntry = {
      candles: [...candles], // Clone to prevent external mutation
      timestamp: Date.now(),
      symbol,
      timeframe,
    }

    this.cache.set(key, entry)
    this.updateAccessOrder(key)
  }

  /**
   * Merge new candles with existing cached data
   *
   * This is useful when incrementally fetching new candles
   * to avoid duplicates and maintain sorted order.
   *
   * @param symbol - Trading pair symbol
   * @param timeframe - Candle timeframe
   * @param newCandles - New candles to merge
   */
  merge(symbol: string, timeframe: Timeframe, newCandles: CandleData[]): void {
    if (!this.config.enabled || newCandles.length === 0)
      return

    const key = getCacheKey(symbol, timeframe)
    const existing = this.cache.get(key)

    if (!existing) {
      this.set(symbol, timeframe, newCandles)
      return
    }

    // Create a map for deduplication by timestamp
    const candleMap = new Map<number | string, CandleData>()

    // Add existing candles
    for (const candle of existing.candles) {
      const ts = typeof candle.timestamp === 'number'
        ? candle.timestamp
        : new Date(candle.timestamp!).getTime()
      candleMap.set(ts, candle)
    }

    // Add/overwrite with new candles
    for (const candle of newCandles) {
      const ts = typeof candle.timestamp === 'number'
        ? candle.timestamp
        : new Date(candle.timestamp!).getTime()
      candleMap.set(ts, candle)
    }

    // Convert back to sorted array
    const merged = Array.from(candleMap.values()).sort((a, b) => {
      const tsA = typeof a.timestamp === 'number' ? a.timestamp : new Date(a.timestamp!).getTime()
      const tsB = typeof b.timestamp === 'number' ? b.timestamp : new Date(b.timestamp!).getTime()
      return tsA - tsB
    })

    this.set(symbol, timeframe, merged)
  }

  /**
   * Clear all cached data or filter by symbol/timeframe
   *
   * @param symbol - Optional symbol to clear
   * @param timeframe - Optional timeframe to clear
   */
  clear(symbol?: string, timeframe?: Timeframe): void {
    if (!symbol) {
      this.cache.clear()
      this.accessOrder = []
      return
    }

    if (!timeframe) {
      // Clear all timeframes for symbol
      for (const key of this.cache.keys()) {
        if (key.startsWith(`${symbol}:`)) {
          this.delete(key)
        }
      }
      return
    }

    // Clear specific symbol/timeframe
    const key = getCacheKey(symbol, timeframe)
    this.delete(key)
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number, maxSize: number, keys: string[] } {
    return {
      size: this.cache.size,
      maxSize: this.config.maxSize,
      keys: Array.from(this.cache.keys()),
    }
  }

  /**
   * Check if data exists in cache (and not expired)
   */
  has(symbol: string, timeframe: Timeframe): boolean {
    if (!this.config.enabled)
      return false

    const key = getCacheKey(symbol, timeframe)
    const entry = this.cache.get(key)

    if (!entry)
      return false

    // Check TTL
    const now = Date.now()
    if (now - entry.timestamp > this.config.ttl) {
      this.delete(key)
      return false
    }

    return true
  }

  private delete(key: string): void {
    this.cache.delete(key)
    const index = this.accessOrder.indexOf(key)
    if (index > -1) {
      this.accessOrder.splice(index, 1)
    }
  }

  private updateAccessOrder(key: string): void {
    const index = this.accessOrder.indexOf(key)
    if (index > -1) {
      this.accessOrder.splice(index, 1)
    }
    this.accessOrder.push(key)
  }

  private evictLRU(): void {
    if (this.accessOrder.length === 0)
      return
    const oldestKey = this.accessOrder.shift()
    if (oldestKey) {
      this.cache.delete(oldestKey)
    }
  }
}

/**
 * Global cache instance (singleton)
 */
let globalCache: CandleCache | null = null

/**
 * Get or create the global cache instance
 */
export function getGlobalCache(config?: Partial<CacheConfig>): CandleCache {
  if (!globalCache) {
    globalCache = new CandleCache(config)
  }
  return globalCache
}

/**
 * Reset the global cache instance
 */
export function resetGlobalCache(): void {
  globalCache?.clear()
  globalCache = null
}
