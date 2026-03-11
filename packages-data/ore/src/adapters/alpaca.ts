import type { CandleData } from '@vulcan-js/core'
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
import { ExchangeError, WebSocketError } from '../types.ts'
import { BaseAdapter } from './base.ts'

/**
 * Alpaca timeframe mapping
 * Note: Alpaca has different timeframe limitations for crypto vs stocks
 */
const ALPACA_TIMEFRAMES: Record<Timeframe, { supported: boolean, apiFormat: string }> = {
  '1s': { supported: false, apiFormat: '' },
  '5s': { supported: false, apiFormat: '' },
  '15s': { supported: false, apiFormat: '' },
  '30s': { supported: false, apiFormat: '' },
  '1m': { supported: true, apiFormat: '1Min' },
  '3m': { supported: false, apiFormat: '' },
  '5m': { supported: true, apiFormat: '5Min' },
  '15m': { supported: true, apiFormat: '15Min' },
  '30m': { supported: true, apiFormat: '30Min' },
  '1h': { supported: true, apiFormat: '1Hour' },
  '2h': { supported: false, apiFormat: '' },
  '4h': { supported: false, apiFormat: '' },
  '6h': { supported: false, apiFormat: '' },
  '8h': { supported: false, apiFormat: '' },
  '12h': { supported: false, apiFormat: '' },
  '1d': { supported: true, apiFormat: '1Day' },
  '3d': { supported: false, apiFormat: '' },
  '1w': { supported: true, apiFormat: '1Week' },
  '1M': { supported: true, apiFormat: '1Month' },
}

/**
 * Alpaca Markets adapter
 *
 * Supports both stock and crypto markets.
 * Note: This adapter focuses on crypto functionality.
 *
 * REST API: https://data.alpaca.markets/v1beta3/crypto
 * WebSocket: wss://stream.data.alpaca.markets/v1beta3/crypto
 */
export class AlpacaAdapter extends BaseAdapter {
  readonly name = 'alpaca'

  protected getRestUrl(): string {
    return this.config.baseUrl ?? 'https://data.alpaca.markets/v1beta3/crypto'
  }

  protected getWsUrl(): string {
    return this.config.wsUrl ?? 'wss://stream.data.alpaca.markets/v1beta3/crypto/us'
  }

  protected parseTimeframe(timeframe: Timeframe): string {
    const tf = ALPACA_TIMEFRAMES[timeframe]
    if (!tf.supported) {
      throw new ExchangeError(
        `Timeframe ${timeframe} not supported by Alpaca. Supported: 1m, 5m, 15m, 30m, 1h, 1d, 1w, 1M`,
        'UNSUPPORTED_TIMEFRAME',
        this.name,
      )
    }
    return tf.apiFormat
  }

  protected normalizeCandle(data: unknown): CandleData {
    const c = data as {
      t: string // ISO timestamp
      o: number // Open
      h: number // High
      l: number // Low
      c: number // Close
      v: number // Volume
      n: number // Number of trades
      vw: number // VWAP
    }

    return {
      o: this.normalizePrice(c.o),
      h: this.normalizePrice(c.h),
      l: this.normalizePrice(c.l),
      c: this.normalizePrice(c.c),
      v: this.normalizeAmount(c.v),
      timestamp: new Date(c.t).getTime(),
    }
  }

  protected normalizeTicker(data: unknown, symbol: string): TickerData {
    const t = data as {
      symbol: string
      bp: number // Bid price
      ap: number // Ask price
      lp?: number // Last price
      as: number // Ask size
      bs: number // Bid size
    }

    return {
      symbol: t.symbol ?? symbol,
      lastPrice: t.lp ?? (t.bp + t.ap) / 2,
      bidPrice: t.bp,
      askPrice: t.ap,
      timestamp: Date.now(),
    }
  }

  protected normalizeTrade(data: unknown): TradeData {
    const t = data as {
      symbol: string
      p: number // Price
      s: number // Size
      t: string // Timestamp (RFC-3339)
      tks: string // Taker side: 'B' (buy) or 'S' (sell)
      i: number // Trade ID
    }

    return {
      id: String(t.i),
      symbol: t.symbol,
      price: t.p,
      amount: t.s,
      side: t.tks === 'B' ? 'buy' : 'sell',
      timestamp: new Date(t.t).getTime(),
    }
  }

  protected normalizeOrderBook(data: unknown, symbol: string): OrderBookData {
    const ob = data as {
      symbol: string
      b: Array<{ p: number, s: number }> // Bids
      a: Array<{ p: number, s: number }> // Asks
      t: string // Timestamp
    }

    const parseEntry = (entry: { p: number, s: number }): OrderBookEntry => ({
      price: entry.p,
      amount: entry.s,
    })

    return {
      symbol: ob.symbol ?? symbol,
      bids: ob.b.map(parseEntry),
      asks: ob.a.map(parseEntry),
      timestamp: new Date(ob.t).getTime(),
    }
  }

  protected buildCandlesEndpoint(options: FetchCandlesOptions): string {
    const timeframe = this.parseTimeframe(options.timeframe)
    const symbol = options.symbol.replace('-', '/')

    // Build query parameters
    const params = new URLSearchParams()
    params.append('symbols', symbol)
    params.append('timeframe', timeframe)

    if (options.startTime) {
      params.append('start', new Date(options.startTime).toISOString())
    }
    if (options.endTime) {
      params.append('end', new Date(options.endTime).toISOString())
    }
    if (options.limit) {
      params.append('limit', String(options.limit))
    }

    return `/us/bars?${params.toString()}`
  }

  protected buildSymbolsEndpoint(): string {
    // Alpaca doesn't have a direct symbol listing endpoint for crypto
    // Return empty - symbols should be known beforehand
    return '/us/snapshots'
  }

  protected buildTickerEndpoint(symbol: string): string {
    const formattedSymbol = symbol.replace('-', '/')
    return `/us/latest/trades?symbols=${formattedSymbol}`
  }

  async fetchCandles(options: FetchCandlesOptions): Promise<CandleData[]> {
    // Check cache first
    const cached = this.cache.get(options.symbol, options.timeframe, options.startTime, options.endTime)
    if (cached && cached.length > 0) {
      return cached
    }

    await this.rateLimiter.acquire()

    try {
      const endpoint = this.buildCandlesEndpoint(options)
      const url = `${this.getRestUrl()}${endpoint}`

      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(),
        signal: AbortSignal.timeout(this.config.timeout ?? 30000),
      })

      if (!response.ok) {
        throw await this.handleError(response)
      }

      const data = await response.json() as { bars: Record<string, unknown[]> }
      const symbol = options.symbol.replace('-', '/')
      const candles = (data.bars[symbol] ?? []).map(c => this.normalizeCandle(c))

      this.cache.set(options.symbol, options.timeframe, candles)
      return candles
    }
    catch (error) {
      throw this.wrapError(error)
    }
  }

  async fetchSymbols(_marketType?: MarketType): Promise<string[]> {
    // Alpaca doesn't provide a public endpoint for listing all crypto symbols
    // Return common crypto pairs
    return [
      'BTC/USD',
      'ETH/USD',
      'LTC/USD',
      'BCH/USD',
      'LINK/USD',
      'AAVE/USD',
      'UNI/USD',
      'MATIC/USD',
      'SOL/USD',
      'AVAX/USD',
    ]
  }

  async fetchTicker(symbol: string, _marketType?: MarketType): Promise<TickerData> {
    await this.rateLimiter.acquire()

    try {
      const endpoint = this.buildTickerEndpoint(symbol)
      const url = `${this.getRestUrl()}${endpoint}`

      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(),
        signal: AbortSignal.timeout(this.config.timeout ?? 30000),
      })

      if (!response.ok) {
        throw await this.handleError(response)
      }

      const data = await response.json() as { trades: Record<string, { p: number, t: string }> }
      const formattedSymbol = symbol.replace('-', '/')
      const trade = data.trades[formattedSymbol]

      if (!trade) {
        throw new ExchangeError(`Symbol ${symbol} not found`, 'SYMBOL_NOT_FOUND', this.name)
      }

      return {
        symbol,
        lastPrice: trade.p,
        timestamp: new Date(trade.t).getTime(),
      }
    }
    catch (error) {
      throw this.wrapError(error)
    }
  }

  protected parseCandlesResponse(data: unknown): unknown[] {
    const response = data as { bars: Record<string, unknown[]> }
    return Object.values(response.bars)[0] ?? []
  }

  protected parseSymbolsResponse(data: unknown, _marketType?: MarketType): string[] {
    // Alpaca returns snapshots, extract symbols
    const snapshots = data as Record<string, unknown>
    return Object.keys(snapshots)
  }

  protected handleWsMessage(data: unknown): void {
    const msg = data as { T?: string, S?: string, [key: string]: unknown }

    if (!msg.T)
      return

    switch (msg.T) {
      case 'b': // Bar (candle)
        this.handleBarMessage(data as { S: string, o: number, h: number, l: number, c: number, v: number, t: string })
        break
      case 't': // Trade
        this.handleTradeMessage(data as { S: string, p: number, s: number, t: string, i: number, tks: string })
        break
      case 'q': // Quote (ticker)
        this.handleQuoteMessage(data as { S: string, bp: number, ap: number, bs: number, as: number, t: string })
        break
      case 'error':
        this.handleErrorMessage(data as { code: number, msg: string })
        break
    }
  }

  private handleBarMessage(data: { S: string, o: number, h: number, l: number, c: number, v: number, t: string }): void {
    const candle: CandleData = {
      o: this.normalizePrice(data.o),
      h: this.normalizePrice(data.h),
      l: this.normalizePrice(data.l),
      c: this.normalizePrice(data.c),
      v: this.normalizeAmount(data.v),
      timestamp: new Date(data.t).getTime(),
    }

    this.emit('candle', data.S, '1m', candle) // Default to 1m for WebSocket bars
  }

  private handleTradeMessage(data: { S: string, p: number, s: number, t: string, i: number, tks: string }): void {
    const trade: TradeData = {
      id: String(data.i),
      symbol: data.S,
      price: data.p,
      amount: data.s,
      side: data.tks === 'B' ? 'buy' : 'sell',
      timestamp: new Date(data.t).getTime(),
    }

    this.emit('trade', data.S, trade)
  }

  private handleQuoteMessage(data: { S: string, bp: number, ap: number, bs: number, as: number, t: string }): void {
    const ticker: TickerData = {
      symbol: data.S,
      lastPrice: (data.bp + data.ap) / 2,
      bidPrice: data.bp,
      askPrice: data.ap,
      timestamp: new Date(data.t).getTime(),
    }

    this.emit('ticker', data.S, ticker)
  }

  private handleErrorMessage(data: { code: number, msg: string }): void {
    throw new WebSocketError(`Alpaca WebSocket error ${data.code}: ${data.msg}`, this.name)
  }

  protected sendSubscribe(channel: string, options: SubscribeOptions, _depth?: number): void {
    if (!this.ws)
      return

    const symbol = options.symbol.replace('-', '/')
    let action: string

    switch (channel) {
      case 'candles':
        action = 'bars'
        break
      case 'ticker':
        action = 'quotes'
        break
      case 'trades':
        action = 'trades'
        break
      default:
        return
    }

    const msg = {
      action: 'subscribe',
      [action]: [symbol],
    }

    this.ws.send(JSON.stringify(msg))
  }

  protected sendUnsubscribe(channel: string, options: SubscribeOptions, _depth?: number): void {
    if (!this.ws)
      return

    const symbol = options.symbol.replace('-', '/')
    let action: string

    switch (channel) {
      case 'candles':
        action = 'bars'
        break
      case 'ticker':
        action = 'quotes'
        break
      case 'trades':
        action = 'trades'
        break
      default:
        return
    }

    const msg = {
      action: 'unsubscribe',
      [action]: [symbol],
    }

    this.ws.send(JSON.stringify(msg))
  }

  private emit(event: string, symbol: string, ..._args: unknown[]): void {
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
      const error = JSON.parse(text) as { code?: number, message?: string }
      if (error.code)
        code = String(error.code)
      if (error.message)
        message = error.message
    }
    catch {
      // Use raw text if not JSON
    }

    return new ExchangeError(message, code, this.name)
  }

  protected getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    if (this.config.apiKey) {
      headers['APCA-API-KEY-ID'] = this.config.apiKey
    }
    if (this.config.apiSecret) {
      headers['APCA-API-SECRET-KEY'] = this.config.apiSecret
    }

    return headers
  }

  async connect(): Promise<void> {
    // First authenticate if credentials are provided
    if (this.config.apiKey && this.config.apiSecret) {
      await this.authenticate()
    }
    return super.connect()
  }

  private async authenticate(): Promise<void> {
    // Alpaca requires authentication via REST before WebSocket
    // The WebSocket uses the same credentials in headers
    // This is handled in getHeaders()
  }
}
