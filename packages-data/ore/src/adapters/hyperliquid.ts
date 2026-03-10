import type { CandleData } from '@vulcan-js/core'
import { BaseAdapter } from './base.ts'
import { ExchangeError } from '../types.ts'
import type {
  FetchCandlesOptions,
  MarketType,
  OrderBookData,
  OrderBookEntry,
  SubscribeOptions,
  TickerData,
  Timeframe,
  TradeData,
} from '../types.ts'

/**
 * Hyperliquid timeframe mapping
 * Note: Hyperliquid only supports specific timeframes
 */
const HYPERLIQUID_TIMEFRAMES: Record<Timeframe, string | null> = {
  '1s': null,   // Not supported
  '5s': null,
  '15s': null,
  '30s': null,
  '1m': '1m',
  '3m': null,
  '5m': '5m',
  '15m': '15m',
  '30m': null,
  '1h': '1h',
  '2h': null,
  '4h': '4h',
  '6h': null,
  '8h': null,
  '12h': null,
  '1d': '1d',
  '3d': null,
  '1w': null,
  '1M': null,
}

/**
 * Hyperliquid exchange adapter
 * 
 * Hyperliquid is a decentralized perpetual futures exchange.
 * 
 * REST API: https://api.hyperliquid.xyz
 * WebSocket: wss://api.hyperliquid.xyz/ws
 */
export class HyperliquidAdapter extends BaseAdapter {
  readonly name = 'hyperliquid'

  protected getRestUrl(): string {
    return this.config.baseUrl ?? 'https://api.hyperliquid.xyz'
  }

  protected getWsUrl(): string {
    return this.config.wsUrl ?? 'wss://api.hyperliquid.xyz/ws'
  }

  protected parseTimeframe(timeframe: Timeframe): string {
    const tf = HYPERLIQUID_TIMEFRAMES[timeframe]
    if (!tf) {
      throw new ExchangeError(
        `Timeframe ${timeframe} not supported by Hyperliquid. Supported: 1m, 5m, 15m, 1h, 4h, 1d`,
        'UNSUPPORTED_TIMEFRAME',
        this.name
      )
    }
    return tf
  }

  protected normalizeCandle(data: unknown): CandleData {
    const c = data as {
      t: number      // Open time (ms)
      T: number      // Close time (ms)
      o: string      // Open
      h: string      // High
      l: string      // Low
      c: string      // Close
      v: string      // Volume
      n: number      // Number of trades
    }

    return {
      o: this.normalizePrice(c.o),
      h: this.normalizePrice(c.h),
      l: this.normalizePrice(c.l),
      c: this.normalizePrice(c.c),
      v: this.normalizeAmount(c.v),
      timestamp: c.t,
    }
  }

  protected normalizeTicker(data: unknown, symbol: string): TickerData {
    const t = data as {
      coin: string
      markPrice?: string
      lastPrice?: string
      fundingRate?: string
      openInterest?: string
      volume24h?: string
      high24h?: string
      low24h?: string
    }

    const lastPrice = Number.parseFloat(t.lastPrice ?? t.markPrice ?? '0')

    return {
      symbol: t.coin ?? symbol,
      lastPrice,
      volume24h: t.volume24h ? Number.parseFloat(t.volume24h) : undefined,
      high24h: t.high24h ? Number.parseFloat(t.high24h) : undefined,
      low24h: t.low24h ? Number.parseFloat(t.low24h) : undefined,
      timestamp: Date.now(),
    }
  }

  protected normalizeTrade(data: unknown): TradeData {
    const t = data as {
      coin: string
      side: string
      px: string
      sz: string
      time: number
      tid: number
    }

    return {
      id: String(t.tid),
      symbol: t.coin,
      price: Number.parseFloat(t.px),
      amount: Number.parseFloat(t.sz),
      side: t.side as 'buy' | 'sell',
      timestamp: t.time,
    }
  }

  protected normalizeOrderBook(data: unknown, symbol: string): OrderBookData {
    const ob = data as {
      coin: string
      levels: [
        Array<{ px: string; sz: string }>,  // Bids
        Array<{ px: string; sz: string }>,  // Asks
      ]
      time: number
    }

    const parseEntry = (entry: { px: string; sz: string }): OrderBookEntry => ({
      price: Number.parseFloat(entry.px),
      amount: Number.parseFloat(entry.sz),
    })

    return {
      symbol: ob.coin ?? symbol,
      bids: ob.levels[0].map(parseEntry),
      asks: ob.levels[1].map(parseEntry),
      timestamp: ob.time,
    }
  }

  protected buildCandlesEndpoint(): string {
    // Hyperliquid uses POST requests for most data queries
    return '/info'
  }

  protected buildSymbolsEndpoint(): string {
    return '/info'
  }

  protected buildTickerEndpoint(): string {
    return '/info'
  }

  async fetchCandles(options: FetchCandlesOptions): Promise<CandleData[]> {
    // Check cache first
    const cached = this.cache.get(options.symbol, options.timeframe, options.startTime, options.endTime)
    if (cached && cached.length > 0) {
      return cached
    }

    await this.rateLimiter.acquire()

    try {
      const timeframe = this.parseTimeframe(options.timeframe)
      
      const response = await fetch(`${this.getRestUrl()}/info`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          type: 'candleSnapshot',
          req: {
            coin: options.symbol,
            interval: timeframe,
            // Hyperliquid uses startTime/endTime in seconds
            startTime: options.startTime ? Math.floor(options.startTime / 1000) : undefined,
            endTime: options.endTime ? Math.floor(options.endTime / 1000) : undefined,
          },
        }),
        signal: AbortSignal.timeout(this.config.timeout ?? 30000),
      })

      if (!response.ok) {
        throw await this.handleError(response)
      }

      const data = await response.json() as unknown[]
      const candles = data.map(c => this.normalizeCandle(c))
      
      this.cache.set(options.symbol, options.timeframe, candles)
      return candles
    } catch (error) {
      throw this.wrapError(error)
    }
  }

  async fetchSymbols(_marketType?: MarketType): Promise<string[]> {
    await this.rateLimiter.acquire()

    try {
      const response = await fetch(`${this.getRestUrl()}/info`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          type: 'meta',
        }),
        signal: AbortSignal.timeout(this.config.timeout ?? 30000),
      })

      if (!response.ok) {
        throw await this.handleError(response)
      }

      const data = await response.json() as { universe: Array<{ name: string }> }
      return data.universe.map(u => u.name)
    } catch (error) {
      throw this.wrapError(error)
    }
  }

  async fetchTicker(symbol: string, _marketType?: MarketType): Promise<TickerData> {
    await this.rateLimiter.acquire()

    try {
      const response = await fetch(`${this.getRestUrl()}/info`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          type: 'allMids',
        }),
        signal: AbortSignal.timeout(this.config.timeout ?? 30000),
      })

      if (!response.ok) {
        throw await this.handleError(response)
      }

      const data = await response.json() as Record<string, string>
      const markPrice = data[symbol]

      if (!markPrice) {
        throw new ExchangeError(`Symbol ${symbol} not found`, 'SYMBOL_NOT_FOUND', this.name)
      }

      return {
        symbol,
        lastPrice: Number.parseFloat(markPrice),
        timestamp: Date.now(),
      }
    } catch (error) {
      throw this.wrapError(error)
    }
  }

  protected parseCandlesResponse(data: unknown): unknown[] {
    return data as unknown[]
  }

  protected parseSymbolsResponse(data: unknown, _marketType?: MarketType): string[] {
    const meta = data as { universe: Array<{ name: string }> }
    return meta.universe.map(u => u.name)
  }

  protected handleWsMessage(data: unknown): void {
    const msg = data as { channel?: string; data?: unknown; coin?: string }
    
    if (!msg.channel) return

    switch (msg.channel) {
      case 'candle':
        this.handleCandleMessage(msg.data as { coin: string; interval: string; t: number; o: string; h: string; l: string; c: string; v: string })
        break
      case 'allMids':
        // Ticker updates for all markets
        break
      case 'trades':
        this.handleTradeMessage(msg.data as { coin: string; trades: unknown[] })
        break
      case 'l2Book':
        this.handleOrderBookMessage(msg.data as { coin: string; levels: [Array<{ px: string; sz: string }>, Array<{ px: string; sz: string }>]; time: number })
        break
    }
  }

  private handleCandleMessage(data: { coin: string; interval: string; t: number; o: string; h: string; l: string; c: string; v: string }): void {
    const candle: CandleData = {
      o: this.normalizePrice(data.o),
      h: this.normalizePrice(data.h),
      l: this.normalizePrice(data.l),
      c: this.normalizePrice(data.c),
      v: this.normalizeAmount(data.v),
      timestamp: data.t,
    }

    this.emit('candle', data.coin, data.interval, candle)
  }

  private handleTradeMessage(data: { coin: string; trades: unknown[] }): void {
    for (const trade of data.trades) {
      const normalized = this.normalizeTrade(trade)
      this.emit('trade', data.coin, normalized)
    }
  }

  private handleOrderBookMessage(data: { coin: string; levels: [Array<{ px: string; sz: string }>, Array<{ px: string; sz: string }>]; time: number }): void {
    const orderBook = this.normalizeOrderBook(data, data.coin)
    this.emit('orderbook', data.coin, orderBook)
  }

  protected sendSubscribe(channel: string, options: SubscribeOptions, _depth?: number): void {
    if (!this.ws) return

    const coin = options.symbol
    let subscription: Record<string, unknown>

    switch (channel) {
      case 'candles':
        // @ts-expect-error - timeframe is part of options for candles
        subscription = { method: 'subscribe', subscription: { type: 'candle', coin, interval: this.parseTimeframe(options.timeframe as Timeframe) } }
        break
      case 'ticker':
        subscription = { method: 'subscribe', subscription: { type: 'allMids' } }
        break
      case 'trades':
        subscription = { method: 'subscribe', subscription: { type: 'trades', coin } }
        break
      case 'orderbook':
        subscription = { method: 'subscribe', subscription: { type: 'l2Book', coin } }
        break
      default:
        return
    }

    this.ws.send(JSON.stringify(subscription))
  }

  protected sendUnsubscribe(channel: string, options: SubscribeOptions, _depth?: number): void {
    if (!this.ws) return

    const coin = options.symbol
    let subscription: Record<string, unknown>

    switch (channel) {
      case 'candles':
        // @ts-expect-error - timeframe is part of options for candles
        subscription = { method: 'unsubscribe', subscription: { type: 'candle', coin, interval: this.parseTimeframe(options.timeframe as Timeframe) } }
        break
      case 'ticker':
        subscription = { method: 'unsubscribe', subscription: { type: 'allMids' } }
        break
      case 'trades':
        subscription = { method: 'unsubscribe', subscription: { type: 'trades', coin } }
        break
      case 'orderbook':
        subscription = { method: 'unsubscribe', subscription: { type: 'l2Book', coin } }
        break
      default:
        return
    }

    this.ws.send(JSON.stringify(subscription))
  }

  private emit(event: string, symbol: string, ...args: unknown[]): void {
    const subscriptionId = this.generateSubscriptionId(event, symbol)
    const unsubscribe = this.subscriptions.get(subscriptionId)
    if (unsubscribe) {
      // Callback would be invoked here with the data
    }
  }

  protected async handleError(response: Response): Promise<ExchangeError> {
    const text = await response.text()
    return new ExchangeError(text, String(response.status), this.name)
  }
}
