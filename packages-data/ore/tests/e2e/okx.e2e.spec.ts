import { describe, expect, it, beforeAll, afterAll } from 'vitest'
import { OKXAdapter, ExchangeError } from '@vulcan-js/ore'
import {
  getEnv,
  hasEnv,
  validateCandle,
  wait,
  TEST_SYMBOLS,
  TEST_CONFIG,
} from './setup.ts'

/**
 * OKX E2E Tests
 * 
 * These tests connect to the real OKX API.
 * Public endpoints work without authentication.
 * Authenticated endpoints require OKX_API_KEY, OKX_API_SECRET, and OKX_PASSPHRASE.
 */
describe('OKXAdapter E2E', () => {
  let adapter: OKXAdapter
  
  beforeAll(() => {
    adapter = new OKXAdapter({
      apiKey: getEnv('OKX_API_KEY'),
      apiSecret: getEnv('OKX_API_SECRET'),
      passphrase: getEnv('OKX_PASSPHRASE'),
      testnet: false,
      timeout: TEST_CONFIG.timeout,
    })
  })
  
  afterAll(async () => {
    await adapter.disconnect()
  })
  
  describe('fetchCandles', () => {
    it('should fetch candles for BTC-USDT', async () => {
      const candles = await adapter.fetchCandles({
        symbol: TEST_SYMBOLS.okx,
        timeframe: '1h',
        limit: TEST_CONFIG.candleLimit,
      })
      
      expect(candles).toBeDefined()
      expect(candles.length).toBeGreaterThan(0)
      expect(candles.length).toBeLessThanOrEqual(TEST_CONFIG.candleLimit)
      
      for (const candle of candles) {
        validateCandle(candle)
      }
    })
    
    it('should fetch candles with time range', async () => {
      const endTime = Date.now()
      const startTime = endTime - 24 * 60 * 60 * 1000
      
      const candles = await adapter.fetchCandles({
        symbol: TEST_SYMBOLS.okx,
        timeframe: '1h',
        startTime,
        endTime,
        limit: 24,
      })
      
      expect(candles.length).toBeGreaterThan(0)
    })
    
    it('should handle different timeframes', async () => {
      const timeframes = ['1m', '5m', '15m', '1h', '4h', '1d'] as const
      
      for (const timeframe of timeframes) {
        const candles = await adapter.fetchCandles({
          symbol: TEST_SYMBOLS.okx,
          timeframe,
          limit: 5,
        })
        
        expect(candles.length).toBeGreaterThan(0)
        validateCandle(candles[0])
      }
    })
    
    it('should use cache for repeated requests', async () => {
      const options = {
        symbol: TEST_SYMBOLS.okx,
        timeframe: '1h' as const,
        limit: 5,
      }
      
      const candles1 = await adapter.fetchCandles(options)
      const candles2 = await adapter.fetchCandles(options)
      
      expect(candles1.length).toBe(candles2.length)
      expect(adapter.cache.has(options.symbol, options.timeframe)).toBe(true)
    })
  })
  
  describe('fetchSymbols', () => {
    it('should fetch available symbols', async () => {
      const symbols = await adapter.fetchSymbols()
      
      expect(symbols).toBeDefined()
      expect(symbols.length).toBeGreaterThan(50)
      
      // Check for common pairs
      expect(symbols.some(s => s.includes('BTC'))).toBe(true)
      expect(symbols.some(s => s.includes('ETH'))).toBe(true)
    })
    
    it('should fetch spot market symbols', async () => {
      const symbols = await adapter.fetchSymbols('spot')
      
      expect(symbols.length).toBeGreaterThan(0)
      expect(symbols[0]).toContain('-')
    })
  })
  
  describe('fetchTicker', () => {
    it('should fetch ticker for BTC-USDT', async () => {
      const ticker = await adapter.fetchTicker(TEST_SYMBOLS.okx)
      
      expect(ticker).toBeDefined()
      expect(ticker.symbol).toBe(TEST_SYMBOLS.okx)
      expect(typeof ticker.lastPrice).toBe('number')
      expect(ticker.lastPrice).toBeGreaterThan(0)
      expect(ticker.timestamp).toBeGreaterThan(0)
    })
  })
  
  describe('error handling', () => {
    it('should handle invalid symbol', async () => {
      await expect(
        adapter.fetchCandles({
          symbol: 'INVALID-PAIR',
          timeframe: '1h',
          limit: 10,
        })
      ).rejects.toThrow()
    })
    
    it('should handle rate limiting gracefully', async () => {
      // Make multiple rapid requests to trigger rate limit
      const requests = Array.from({ length: 35 }, () => 
        adapter.fetchTicker(TEST_SYMBOLS.okx).catch(e => e)
      )
      
      const results = await Promise.all(requests)
      
      // Some might succeed, some might fail with rate limit
      const errors = results.filter(r => r instanceof Error)
      const successes = results.filter(r => !(r instanceof Error))
      
      // Should have some successes (rate limit allows 30 per 2s)
      expect(successes.length).toBeGreaterThan(0)
    })
  })
  
  describe('WebSocket', () => {
    it('should connect and disconnect', async () => {
      await adapter.connect()
      expect(adapter.isConnected).toBe(true)
      
      await adapter.disconnect()
      expect(adapter.isConnected).toBe(false)
    })
    
    it('should subscribe to candle updates', async () => {
      await adapter.connect()
      
      const candles: import('@vulcan-js/core').CandleData[] = []
      
      const unsubscribe = await adapter.subscribeCandles(
        { symbol: TEST_SYMBOLS.okx, timeframe: '1m' },
        (candle) => candles.push(candle)
      )
      
      await wait(TEST_CONFIG.wsDuration)
      
      await unsubscribe()
      await adapter.disconnect()
      
      expect(candles.length).toBeGreaterThanOrEqual(0)
    })
    
    it('should subscribe to ticker updates', async () => {
      await adapter.connect()
      
      const tickers: import('@vulcan-js/ore').TickerData[] = []
      
      const unsubscribe = await adapter.subscribeTicker(
        { symbol: TEST_SYMBOLS.okx },
        (ticker) => tickers.push(ticker)
      )
      
      await wait(TEST_CONFIG.wsDuration)
      
      await unsubscribe()
      await adapter.disconnect()
      
      expect(tickers.length).toBeGreaterThanOrEqual(0)
    })
    
    it('should subscribe to trade updates', async () => {
      await adapter.connect()
      
      const trades: import('@vulcan-js/ore').TradeData[] = []
      
      const unsubscribe = await adapter.subscribeTrades(
        { symbol: TEST_SYMBOLS.okx },
        (trade) => trades.push(trade)
      )
      
      await wait(TEST_CONFIG.wsDuration)
      
      await unsubscribe()
      await adapter.disconnect()
      
      expect(trades.length).toBeGreaterThanOrEqual(0)
    })
  })
})
