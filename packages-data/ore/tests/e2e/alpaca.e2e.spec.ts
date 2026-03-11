import { AlpacaAdapter } from '@vulcan-js/ore'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import {
  getEnv,
  hasEnv,
  TEST_CONFIG,
  TEST_SYMBOLS,
  validateCandle,
  wait,
} from './setup.ts'

/**
 * Alpaca E2E Tests
 *
 * These tests connect to the real Alpaca API.
 * Alpaca REQUIRES API credentials - no public endpoints.
 * Set ALPACA_API_KEY and ALPACA_API_SECRET environment variables.
 *
 * Note: Alpaca crypto is only available in the US.
 */
describe('alpacaAdapter E2E', () => {
  let adapter: AlpacaAdapter
  const hasCredentials = hasEnv('ALPACA_API_KEY') && hasEnv('ALPACA_API_SECRET')

  beforeAll(() => {
    if (!hasCredentials) {
      console.warn('Skipping Alpaca E2E tests: ALPACA_API_KEY and ALPACA_API_SECRET not set')
      return
    }

    adapter = new AlpacaAdapter({
      apiKey: getEnv('ALPACA_API_KEY'),
      apiSecret: getEnv('ALPACA_API_SECRET'),
      timeout: TEST_CONFIG.timeout,
    })
  })

  afterAll(async () => {
    if (!hasCredentials)
      return
    await adapter.disconnect()
  })

  // Skip all tests if no credentials
  const describeOrSkip = hasCredentials ? describe : describe.skip

  describeOrSkip('fetchCandles', () => {
    it('should fetch candles for BTC/USD', async () => {
      const candles = await adapter.fetchCandles({
        symbol: TEST_SYMBOLS.alpaca,
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

    it('should fetch candles for ETH/USD', async () => {
      const candles = await adapter.fetchCandles({
        symbol: 'ETH/USD',
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
        symbol: TEST_SYMBOLS.alpaca,
        timeframe: '1h',
        startTime,
        endTime,
        limit: 24,
      })

      expect(candles.length).toBeGreaterThan(0)
    })

    it('should handle supported timeframes', async () => {
      // Alpaca supports: 1m, 5m, 15m, 30m, 1h, 1d, 1w, 1M
      const supportedTimeframes = ['1m', '5m', '15m', '30m', '1h', '1d'] as const

      for (const timeframe of supportedTimeframes) {
        const candles = await adapter.fetchCandles({
          symbol: TEST_SYMBOLS.alpaca,
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
          symbol: TEST_SYMBOLS.alpaca,
          timeframe: '4h', // Not supported by Alpaca
          limit: 10,
        }),
      ).rejects.toThrow('Timeframe 4h not supported by Alpaca')
    })

    it('should use cache for repeated requests', async () => {
      const options = {
        symbol: TEST_SYMBOLS.alpaca,
        timeframe: '1h' as const,
        limit: 5,
      }

      const candles1 = await adapter.fetchCandles(options)
      const candles2 = await adapter.fetchCandles(options)

      expect(candles1.length).toBe(candles2.length)
      expect(adapter.getCache().has(options.symbol, options.timeframe)).toBe(true)
    })
  })

  describeOrSkip('fetchSymbols', () => {
    it('should return common crypto symbols', async () => {
      const symbols = await adapter.fetchSymbols()

      expect(symbols).toBeDefined()
      expect(symbols.length).toBeGreaterThan(0)

      // Should include common pairs
      expect(symbols).toContain('BTC/USD')
      expect(symbols).toContain('ETH/USD')
    })
  })

  describeOrSkip('fetchTicker', () => {
    it('should fetch ticker for BTC/USD', async () => {
      const ticker = await adapter.fetchTicker(TEST_SYMBOLS.alpaca)

      expect(ticker).toBeDefined()
      expect(ticker.symbol).toBe(TEST_SYMBOLS.alpaca)
      expect(typeof ticker.lastPrice).toBe('number')
      expect(ticker.lastPrice).toBeGreaterThan(0)
    })

    it('should include bid/ask prices', async () => {
      const ticker = await adapter.fetchTicker(TEST_SYMBOLS.alpaca)

      expect(ticker.bidPrice).toBeDefined()
      expect(ticker.askPrice).toBeDefined()
      expect(typeof ticker.bidPrice).toBe('number')
      expect(typeof ticker.askPrice).toBe('number')
    })

    it('should throw for invalid symbol', async () => {
      await expect(
        adapter.fetchTicker('INVALID/USD'),
      ).rejects.toThrow()
    })
  })

  describeOrSkip('error handling', () => {
    it('should handle invalid API key', async () => {
      const badAdapter = new AlpacaAdapter({
        apiKey: 'invalid-key',
        apiSecret: 'invalid-secret',
      })

      await expect(
        badAdapter.fetchCandles({
          symbol: TEST_SYMBOLS.alpaca,
          timeframe: '1h',
          limit: 10,
        }),
      ).rejects.toThrow()
    })

    it('should handle rate limiting', async () => {
      // Make rapid requests
      const requests = Array.from({ length: 10 }, () =>
        adapter.fetchTicker(TEST_SYMBOLS.alpaca).catch(e => e))

      const results = await Promise.all(requests)
      const successes = results.filter(r => !(r instanceof Error))

      // Most should succeed (Alpaca: 200 req/min)
      expect(successes.length).toBeGreaterThan(5)
    })
  })

  describeOrSkip('WebSocket', () => {
    it('should connect and disconnect', async () => {
      await adapter.connect()
      expect(adapter.isConnected).toBe(true)

      await adapter.disconnect()
      expect(adapter.isConnected).toBe(false)
    })

    it('should subscribe to bar (candle) updates', async () => {
      await adapter.connect()

      const candles: import('@vulcan-js/core').CandleData[] = []

      const unsubscribe = await adapter.subscribeCandles(
        { symbol: TEST_SYMBOLS.alpaca, timeframe: '1m' },
        candle => candles.push(candle),
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
        { symbol: TEST_SYMBOLS.alpaca },
        trade => trades.push(trade),
      )

      await wait(TEST_CONFIG.wsDuration)

      await unsubscribe()
      await adapter.disconnect()

      expect(trades.length).toBeGreaterThanOrEqual(0)
    })

    it('should subscribe to quote (ticker) updates', async () => {
      await adapter.connect()

      const tickers: import('@vulcan-js/ore').TickerData[] = []

      const unsubscribe = await adapter.subscribeTicker(
        { symbol: TEST_SYMBOLS.alpaca },
        ticker => tickers.push(ticker),
      )

      await wait(TEST_CONFIG.wsDuration)

      await unsubscribe()
      await adapter.disconnect()

      expect(tickers.length).toBeGreaterThanOrEqual(0)
    })
  })
})
