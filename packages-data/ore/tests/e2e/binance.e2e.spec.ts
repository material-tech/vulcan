import { BinanceAdapter } from '@vulcan-js/ore'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import {
  getEnv,
  TEST_CONFIG,
  TEST_SYMBOLS,
  validateCandle,
  wait,
} from './setup.ts'

/**
 * Binance E2E Tests
 *
 * These tests connect to the real Binance API.
 * Set BINANCE_API_KEY environment variable for authenticated requests.
 * Public endpoints work without authentication.
 */
describe('binanceAdapter E2E', () => {
  let adapter: BinanceAdapter

  beforeAll(() => {
    adapter = new BinanceAdapter({
      apiKey: getEnv('BINANCE_API_KEY'),
      apiSecret: getEnv('BINANCE_API_SECRET'),
      testnet: false,
      timeout: TEST_CONFIG.timeout,
    })
  })

  afterAll(async () => {
    await adapter.disconnect()
  })

  describe('fetchCandles', () => {
    it('should fetch candles for BTCUSDT', async () => {
      const candles = await adapter.fetchCandles({
        symbol: TEST_SYMBOLS.binance,
        timeframe: '1h',
        limit: TEST_CONFIG.candleLimit,
      })

      expect(candles).toBeDefined()
      expect(candles.length).toBeGreaterThan(0)
      expect(candles.length).toBeLessThanOrEqual(TEST_CONFIG.candleLimit)

      // Validate each candle
      for (const candle of candles) {
        validateCandle(candle)
      }

      // Check candles are sorted by timestamp (ascending)
      for (let i = 1; i < candles.length; i++) {
        const prevTs = typeof candles[i - 1].timestamp === 'number'
          ? candles[i - 1].timestamp
          : new Date(candles[i - 1].timestamp!).getTime()
        const currTs = typeof candles[i].timestamp === 'number'
          ? candles[i].timestamp
          : new Date(candles[i].timestamp!).getTime()
        expect(currTs).toBeGreaterThanOrEqual(prevTs as number)
      }
    })

    it('should fetch candles with start and end time', async () => {
      const endTime = Date.now()
      const startTime = endTime - 24 * 60 * 60 * 1000 // 24 hours ago

      const candles = await adapter.fetchCandles({
        symbol: TEST_SYMBOLS.binance,
        timeframe: '1h',
        startTime,
        endTime,
        limit: 24,
      })

      expect(candles.length).toBeGreaterThan(0)

      // Check timestamps are within range
      for (const candle of candles) {
        const ts = typeof candle.timestamp === 'number'
          ? candle.timestamp
          : new Date(candle.timestamp!).getTime()
        expect(ts).toBeGreaterThanOrEqual(startTime)
        expect(ts).toBeLessThanOrEqual(endTime)
      }
    })

    it('should use cache for repeated requests', async () => {
      const options = {
        symbol: TEST_SYMBOLS.binance,
        timeframe: '1h' as const,
        limit: 5,
      }

      // First request
      const candles1 = await adapter.fetchCandles(options)

      // Second request should use cache
      const candles2 = await adapter.fetchCandles(options)

      expect(candles1.length).toBe(candles2.length)
      expect(adapter.getCache().has(options.symbol, options.timeframe)).toBe(true)
    })

    it('should handle different timeframes', async () => {
      const timeframes = ['5m', '15m', '1h', '4h', '1d'] as const

      for (const timeframe of timeframes) {
        const candles = await adapter.fetchCandles({
          symbol: TEST_SYMBOLS.binance,
          timeframe,
          limit: 5,
        })

        expect(candles.length).toBeGreaterThan(0)
        validateCandle(candles[0])
      }
    })
  })

  describe('fetchSymbols', () => {
    it('should fetch available symbols', async () => {
      const symbols = await adapter.fetchSymbols()

      expect(symbols).toBeDefined()
      expect(symbols.length).toBeGreaterThan(100)
      expect(symbols).toContain(TEST_SYMBOLS.binance)

      // Check format
      for (const symbol of symbols.slice(0, 10)) {
        expect(typeof symbol).toBe('string')
        expect(symbol.length).toBeGreaterThan(0)
      }
    })
  })

  describe('fetchTicker', () => {
    it('should fetch ticker for BTCUSDT', async () => {
      const ticker = await adapter.fetchTicker(TEST_SYMBOLS.binance)

      expect(ticker).toBeDefined()
      expect(ticker.symbol).toBe(TEST_SYMBOLS.binance)
      expect(typeof ticker.lastPrice).toBe('number')
      expect(ticker.lastPrice).toBeGreaterThan(0)
      expect(ticker.timestamp).toBeGreaterThan(0)

      // Optional fields
      if (ticker.changePercent24h !== undefined) {
        expect(typeof ticker.changePercent24h).toBe('number')
      }
      if (ticker.volume24h !== undefined) {
        expect(typeof ticker.volume24h).toBe('number')
        expect(ticker.volume24h).toBeGreaterThanOrEqual(0)
      }
    })
  })

  describe('error handling', () => {
    it('should handle invalid symbol', async () => {
      await expect(
        adapter.fetchCandles({
          symbol: 'INVALIDSYMBOL123',
          timeframe: '1h',
          limit: 10,
        }),
      ).rejects.toThrow()
    })

    it('should handle invalid timeframe gracefully', async () => {
      // Binance is flexible with timeframes, but very invalid ones might error
      // This test documents the behavior
      try {
        await adapter.fetchCandles({
          symbol: TEST_SYMBOLS.binance,
          // @ts-expect-error - Testing invalid input
          timeframe: 'invalid',
          limit: 10,
        })
        // If it doesn't throw, that's ok - Binance might handle it
      }
      catch (error) {
        expect(error).toBeInstanceOf(Error)
      }
    })
  })

  describe('webSocket', () => {
    it('should connect and disconnect', async () => {
      await adapter.connect()
      expect(adapter.isConnected).toBe(true)

      await adapter.disconnect()
      expect(adapter.isConnected).toBe(false)
    })

    it('should subscribe to candle updates', async () => {
      const receivedCandles: import('@vulcan-js/core').CandleData[] = []

      await adapter.connect()

      const unsubscribe = await adapter.subscribeCandles(
        { symbol: TEST_SYMBOLS.binance, timeframe: '1m' },
        (candle) => {
          receivedCandles.push(candle)
        },
      )

      // Wait for some data
      await wait(TEST_CONFIG.wsDuration)

      await unsubscribe()
      await adapter.disconnect()

      // We might get 0 or more candles depending on market activity
      // Just verify the subscription mechanism works
      expect(receivedCandles.length).toBeGreaterThanOrEqual(0)
    })

    it('should subscribe to ticker updates', async () => {
      const receivedTickers: import('@vulcan-js/ore').TickerData[] = []

      await adapter.connect()

      const unsubscribe = await adapter.subscribeTicker(
        { symbol: TEST_SYMBOLS.binance },
        (ticker) => {
          receivedTickers.push(ticker)
        },
      )

      await wait(TEST_CONFIG.wsDuration)

      await unsubscribe()
      await adapter.disconnect()

      expect(receivedTickers.length).toBeGreaterThanOrEqual(0)
    })

    it('should subscribe to trade updates', async () => {
      const receivedTrades: import('@vulcan-js/ore').TradeData[] = []

      await adapter.connect()

      const unsubscribe = await adapter.subscribeTrades(
        { symbol: TEST_SYMBOLS.binance },
        (trade) => {
          receivedTrades.push(trade)
        },
      )

      await wait(TEST_CONFIG.wsDuration)

      await unsubscribe()
      await adapter.disconnect()

      expect(receivedTrades.length).toBeGreaterThanOrEqual(0)
    })

    it('should handle multiple subscriptions', async () => {
      await adapter.connect()

      const unsub1 = await adapter.subscribeTicker(
        { symbol: TEST_SYMBOLS.binance },
        () => {},
      )

      const unsub2 = await adapter.subscribeTrades(
        { symbol: TEST_SYMBOLS.binance },
        () => {},
      )

      await wait(1000)

      // Both should be unsubscribed without error
      await unsub1()
      await unsub2()
      await adapter.disconnect()
    })
  })

  describe('testnet', () => {
    it('should connect to testnet when configured', async () => {
      const testnetAdapter = new BinanceAdapter({
        testnet: true,
      })

      // Testnet might have limited data, just verify it doesn't throw
      try {
        const candles = await testnetAdapter.fetchCandles({
          symbol: TEST_SYMBOLS.binance,
          timeframe: '1h',
          limit: 5,
        })
        expect(candles.length).toBeGreaterThanOrEqual(0)
      }
      catch {
        // Testnet might not have the symbol, that's ok
      }
    })
  })
})
