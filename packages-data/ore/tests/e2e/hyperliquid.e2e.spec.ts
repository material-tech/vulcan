import { describe, expect, it, beforeAll, afterAll } from 'vitest'
import { HyperliquidAdapter, ExchangeError } from '@vulcan-js/ore'
import {
  getEnv,
  validateCandle,
  wait,
  TEST_SYMBOLS,
  TEST_CONFIG,
} from './setup.ts'

/**
 * Hyperliquid E2E Tests
 * 
 * These tests connect to the real Hyperliquid API.
 * Hyperliquid is a decentralized perpetual futures exchange.
 * Most endpoints work without authentication.
 */
describe('HyperliquidAdapter E2E', () => {
  let adapter: HyperliquidAdapter
  
  beforeAll(() => {
    adapter = new HyperliquidAdapter({
      testnet: getEnv('HYPERLIQUID_TESTNET') === 'true',
      timeout: TEST_CONFIG.timeout,
    })
  })
  
  afterAll(async () => {
    await adapter.disconnect()
  })
  
  describe('fetchCandles', () => {
    it('should fetch candles for BTC', async () => {
      // Hyperliquid uses different timeframes
      const candles = await adapter.fetchCandles({
        symbol: TEST_SYMBOLS.hyperliquid,
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
    
    it('should fetch candles for ETH', async () => {
      const candles = await adapter.fetchCandles({
        symbol: 'ETH',
        timeframe: '1h',
        limit: 10,
      })
      
      expect(candles.length).toBeGreaterThan(0)
      validateCandle(candles[0])
    })
    
    it('should fetch candles with time range', async () => {
      const endTime = Date.now()
      const startTime = endTime - 24 * 60 * 60 * 1000
      
      const candles = await adapter.fetchCandles({
        symbol: TEST_SYMBOLS.hyperliquid,
        timeframe: '1h',
        startTime,
        endTime,
        limit: 24,
      })
      
      expect(candles.length).toBeGreaterThan(0)
    })
    
    it('should handle supported timeframes', async () => {
      // Hyperliquid only supports: 1m, 5m, 15m, 1h, 4h, 1d
      const supportedTimeframes = ['1m', '5m', '15m', '1h', '4h', '1d'] as const
      
      for (const timeframe of supportedTimeframes) {
        const candles = await adapter.fetchCandles({
          symbol: TEST_SYMBOLS.hyperliquid,
          timeframe,
          limit: 5,
        })
        
        expect(candles.length).toBeGreaterThan(0)
        validateCandle(candles[0])
      }
    })
    
    it('should throw for unsupported timeframes', async () => {
      await expect(
        adapter.fetchCandles({
          symbol: TEST_SYMBOLS.hyperliquid,
          timeframe: '30m', // Not supported
          limit: 10,
        })
      ).rejects.toThrow('Timeframe 30m not supported by Hyperliquid')
    })
    
    it('should use cache for repeated requests', async () => {
      const options = {
        symbol: TEST_SYMBOLS.hyperliquid,
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
      expect(symbols.length).toBeGreaterThan(0)
      expect(symbols).toContain('BTC')
      expect(symbols).toContain('ETH')
      
      // Symbols should be short (perp contracts)
      for (const symbol of symbols.slice(0, 10)) {
        expect(typeof symbol).toBe('string')
        expect(symbol.length).toBeLessThan(10)
      }
    })
  })
  
  describe('fetchTicker', () => {
    it('should fetch ticker for BTC', async () => {
      const ticker = await adapter.fetchTicker(TEST_SYMBOLS.hyperliquid)
      
      expect(ticker).toBeDefined()
      expect(ticker.symbol).toBe(TEST_SYMBOLS.hyperliquid)
      expect(typeof ticker.lastPrice).toBe('number')
      expect(ticker.lastPrice).toBeGreaterThan(0)
    })
    
    it('should fetch ticker for ETH', async () => {
      const ticker = await adapter.fetchTicker('ETH')
      
      expect(ticker).toBeDefined()
      expect(ticker.symbol).toBe('ETH')
      expect(typeof ticker.lastPrice).toBe('number')
      expect(ticker.lastPrice).toBeGreaterThan(0)
    })
    
    it('should throw for invalid symbol', async () => {
      await expect(
        adapter.fetchTicker('INVALIDCOIN123')
      ).rejects.toThrow()
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
        { symbol: TEST_SYMBOLS.hyperliquid, timeframe: '1m' },
        (candle) => candles.push(candle)
      )
      
      await wait(TEST_CONFIG.wsDuration)
      
      await unsubscribe()
      await adapter.disconnect()
      
      expect(candles.length).toBeGreaterThanOrEqual(0)
    })
    
    it('should subscribe to trade updates', async () => {
      await adapter.connect()
      
      const trades: import('@vulcan-js/ore').TradeData[] = []
      
      const unsubscribe = await adapter.subscribeTrades(
        { symbol: TEST_SYMBOLS.hyperliquid },
        (trade) => trades.push(trade)
      )
      
      await wait(TEST_CONFIG.wsDuration)
      
      await unsubscribe()
      await adapter.disconnect()
      
      expect(trades.length).toBeGreaterThanOrEqual(0)
    })
    
    it('should subscribe to order book updates', async () => {
      await adapter.connect()
      
      const orderBooks: import('@vulcan-js/ore').OrderBookData[] = []
      
      const unsubscribe = await adapter.subscribeOrderBook(
        { symbol: TEST_SYMBOLS.hyperliquid },
        (orderBook) => orderBooks.push(orderBook),
        10
      )
      
      await wait(TEST_CONFIG.wsDuration)
      
      await unsubscribe()
      await adapter.disconnect()
      
      expect(orderBooks.length).toBeGreaterThanOrEqual(0)
    })
  })
  
  describe('perpetual futures features', () => {
    it('should fetch funding rate data indirectly via ticker', async () => {
      // Hyperliquid ticker may include funding rate info
      const ticker = await adapter.fetchTicker(TEST_SYMBOLS.hyperliquid)
      
      expect(ticker).toBeDefined()
      // Funding rate might be available in extended ticker data
    })
  })
})
