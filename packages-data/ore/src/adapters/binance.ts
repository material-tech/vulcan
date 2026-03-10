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
 * Binance timeframe mapping
 */
const BINANCE_TIMEFRAMES: Record<Timeframe, string> = {
  '1s': '1s',
  '5s': '5s',
  '15s': '15s',
  '30s': '30s',
  '1m': '1m',
  '3m': '3m',
  '5m': '5m',
  '15m': '15m',
  '30m': '30m',
  '1h': '1h',
  '2h': '2h',
  '4h': '4h',
  '6h': '6h',
  '8h': '8h',
  '12h': '12h',
  '1d': '1d',
  '3d': '3d',
  '1w': '1w',
  '1M': '1M',
}

/**
 * Binance exchange adapter
 * 
 * Supports:
 * - Spot market: https://api.binance.com
 * - Futures: https://fapi.binance.com
 * - Testnet: https://testnet.binance.vision
 */
export class BinanceAdapter extends BaseAdapter {
  readonly name = 'binance'

  protected getRestUrl(): string {
    if (this.config.testnet) {
      return 'https://testnet.binance.vision'
    }
    return 'https://api.binance.com'
  }

  protected getWsUrl(): string {
    if (this.config.testnet) {
      return 'wss://testnet.binance.vision/ws'
    }
    return 'wss://stream.binance.com:9443/ws'
  }

  protected parseTimeframe(timeframe: Timeframe): string {
    return BINANCE_TIMEFRAMES[timeframe] ?? '1h'
  }

  protected normalizeCandle(data: unknown): CandleData {
    const c = data as [
      number,      // Open time
      string,      // Open
      string,      // High
      string,      // Low
      string,      // Close
      string,      // Volume
      number,      // Close time
      string,      // Quote volume
      number,      // Number of trades
      string,      // Taker buy base volume
      string,      // Taker buy quote volume
      string,      // Ignore
    ]

    return {
      o: this.normalizePrice(c[1]),
      h: this.normalizePrice(c[2]),
      l: this.normalizePrice(c[3]),
      c: this.normalizePrice(c[4]),
      v: this.normalizeAmount(c[5]),
      timestamp: c[0],
    }
  }

  protected normalizeTicker(data: unknown, symbol: string): TickerData {
    const t = data as {
      symbol: string
      lastPrice: string
      priceChangePercent: string
      volume: string
      quoteVolume: string
      highPrice: string
      lowPrice: string
      bidPrice: string
      askPrice: string
      openTime: number
      closeTime: number
    }

    return {
      symbol: t.symbol ?? symbol,
      lastPrice: Number.parseFloat(t.lastPrice),
      changePercent24h: Number.parseFloat(t.priceChangePercent),
      volume24h: Number.parseFloat(t.volume),
      quoteVolume24h: Number.parseFloat(t.quoteVolume),
      high24h: Number.parseFloat(t.highPrice),
      low24h: Number.parseFloat(t.lowPrice),
      bidPrice: Number.parseFloat(t.bidPrice),
      askPrice: Number.parseFloat(t.askPrice),
      timestamp: t.closeTime,
    }
  }

  protected normalizeTrade(data: unknown): TradeData {
    const t = data as {
      t: number      // Trade ID
      s: string      // Symbol
      p: string      // Price
      q: string      // Quantity
      T: number      // Trade time
      m: boolean     // Is buyer maker
    }

    return {
      id: String(t.t),
      symbol: t.s,
      price: Number.parseFloat(t.p),
      amount: Number.parseFloat(t.q),
      side: t.m ? 'sell' : 'buy',
      timestamp: t.T,
    }
  }

  protected normalizeOrderBook(data: unknown, symbol: string): OrderBookData {
    const ob = data as {
      lastUpdateId: number
      bids: [string, string][]
      asks: [string, string][]
    }

    const parseEntry = (entry: [string, string]): OrderBookEntry => ({
      price: Number.parseFloat(entry[0]),
      amount: Number.parseFloat(entry[1]),
    })

    return {
      symbol,
      bids: ob.bids.map(parseEntry),
      asks: ob.asks.map(parseEntry),
      timestamp: Date.now(),
      sequence: ob.lastUpdateId,
    }
  }

  protected buildCandlesEndpoint(options: FetchCandlesOptions): string {
    const interval = this.parseTimeframe(options.timeframe)
    const symbol = options.symbol.replace('-', '').replace('/', '')
    
    let url = `/api/v3/klines?symbol=${symbol}&interval=${interval}`
    
    if (options.limit) {
      url += `&limit=${options.limit}`
    }
    if (options.startTime) {
      url += `&startTime=${options.startTime}`
    }
    if (options.endTime) {
      url += `&endTime=${options.endTime}`
    }
    
    return url
  }

  protected buildSymbolsEndpoint(_marketType?: MarketType): string {
    return '/api/v3/exchangeInfo'
  }

  protected buildTickerEndpoint(symbol: string, _marketType?: MarketType): string {
    const formattedSymbol = symbol.replace('-', '').replace('/', '')
    return `/api/v3/ticker/24hr?symbol=${formattedSymbol}`
  }

  protected parseCandlesResponse(data: unknown): unknown[] {
    return data as unknown[]
  }

  protected parseSymbolsResponse(data: unknown, _marketType?: MarketType): string[] {
    const info = data as { symbols: Array<{ symbol: string, status: string }> }
    return info.symbols
      .filter(s => s.status === 'TRADING')
      .map(s => s.symbol)
  }

  protected handleWsMessage(data: unknown): void {
    const msg = data as { e?: string; s?: string }
    
    if (!msg.e) return

    // Route to appropriate handler based on event type
    switch (msg.e) {
      case 'kline':
        this.handleKlineMessage(data)
        break
      case '24hrTicker':
        this.handleTickerMessage(data)
        break
      case 'trade':
        this.handleTradeMessage(data)
        break
      case 'depthUpdate':
        this.handleDepthMessage(data)
        break
    }
  }

  private handleKlineMessage(data: unknown): void {
    // Kline/candlestick updates
    const k = data as {
      e: string
      s: string
      k: {
        t: number
        o: string
        h: string
        l: string
        c: string
        v: string
        i: string
      }
    }

    const candle: CandleData = {
      o: this.normalizePrice(k.k.o),
      h: this.normalizePrice(k.k.h),
      l: this.normalizePrice(k.k.l),
      c: this.normalizePrice(k.k.c),
      v: this.normalizeAmount(k.k.v),
      timestamp: k.k.t,
    }

    // Emit to subscribers
    this.emit('candle', k.s, k.k.i, candle)
  }

  private handleTickerMessage(data: unknown): void {
    const t = data as {
      s: string
      c: string      // Last price
      P: string      // Price change percent
      v: string      // Volume
      q: string      // Quote volume
      h: string      // High
      l: string      // Low
      b: string      // Bid
      a: string      // Ask
      E: number      // Event time
    }

    const ticker: TickerData = {
      symbol: t.s,
      lastPrice: Number.parseFloat(t.c),
      changePercent24h: Number.parseFloat(t.P),
      volume24h: Number.parseFloat(t.v),
      quoteVolume24h: Number.parseFloat(t.q),
      high24h: Number.parseFloat(t.h),
      low24h: Number.parseFloat(t.l),
      bidPrice: Number.parseFloat(t.b),
      askPrice: Number.parseFloat(t.a),
      timestamp: t.E,
    }

    this.emit('ticker', t.s, ticker)
  }

  private handleTradeMessage(data: unknown): void {
    const trade = this.normalizeTrade(data)
    this.emit('trade', trade.symbol, trade)
  }

  private handleDepthMessage(data: unknown): void {
    const d = data as {
      s: string
      b: [string, string][]
      a: [string, string][]
      u: number
      E: number
    }

    const parseEntry = (entry: [string, string]): OrderBookEntry => ({
      price: Number.parseFloat(entry[0]),
      amount: Number.parseFloat(entry[1]),
    })

    const orderBook: OrderBookData = {
      symbol: d.s,
      bids: d.b.map(parseEntry),
      asks: d.a.map(parseEntry),
      timestamp: d.E,
      sequence: d.u,
    }

    this.emit('orderbook', d.s, orderBook)
  }

  protected sendSubscribe(channel: string, options: SubscribeOptions, _depth?: number): void {
    if (!this.ws) return

    const symbol = options.symbol.toLowerCase().replace('-', '').replace('/', '')
    let streamName: string

    switch (channel) {
      case 'candles':
        // @ts-expect-error - timeframe is part of options for candles
        streamName = `${symbol}@kline_${this.parseTimeframe(options.timeframe as Timeframe)}`
        break
      case 'ticker':
        streamName = `${symbol}@ticker`
        break
      case 'trades':
        streamName = `${symbol}@trade`
        break
      case 'orderbook':
        streamName = `${symbol}@depth`
        break
      default:
        return
    }

    const msg = {
      method: 'SUBSCRIBE',
      params: [streamName],
      id: Date.now(),
    }

    this.ws.send(JSON.stringify(msg))
  }

  protected sendUnsubscribe(channel: string, options: SubscribeOptions, _depth?: number): void {
    if (!this.ws) return

    const symbol = options.symbol.toLowerCase().replace('-', '').replace('/', '')
    let streamName: string

    switch (channel) {
      case 'candles':
        // @ts-expect-error - timeframe is part of options for candles
        streamName = `${symbol}@kline_${this.parseTimeframe(options.timeframe as Timeframe)}`
        break
      case 'ticker':
        streamName = `${symbol}@ticker`
        break
      case 'trades':
        streamName = `${symbol}@trade`
        break
      case 'orderbook':
        streamName = `${symbol}@depth`
        break
      default:
        return
    }

    const msg = {
      method: 'UNSUBSCRIBE',
      params: [streamName],
      id: Date.now(),
    }

    this.ws.send(JSON.stringify(msg))
  }

  /**
   * Emit event to subscribers
   */
  private emit(event: string, symbol: string, ...args: unknown[]): void {
    // This would be connected to the subscription callbacks in a full implementation
    // For now, it's a placeholder for the event routing system
    const subscriptionId = this.generateSubscriptionId(event, symbol)
    const unsubscribe = this.subscriptions.get(subscriptionId)
    if (unsubscribe) {
      // Callback would be invoked here with the data
    }
  }

  protected async handleError(response: Response): Promise<ExchangeError> {
    const text = await response.text()
    let code: string | undefined
    let message = text

    try {
      const error = JSON.parse(text) as { code?: number; msg?: string }
      if (error.code) code = String(error.code)
      if (error.msg) message = error.msg
    } catch {
      // Use raw text if not JSON
    }

    return new ExchangeError(message, code, this.name)
  }
}
