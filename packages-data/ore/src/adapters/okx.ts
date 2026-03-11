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
import { ExchangeError } from '../types.ts'
import { BaseAdapter } from './base.ts'

/**
 * OKX timeframe mapping
 */
const OKX_TIMEFRAMES: Record<Timeframe, string> = {
  '1s': '1S',
  '5s': '5S',
  '15s': '15S',
  '30s': '30S',
  '1m': '1m',
  '3m': '3m',
  '5m': '5m',
  '15m': '15m',
  '30m': '30m',
  '1h': '1H',
  '2h': '2H',
  '4h': '4H',
  '6h': '6H',
  '8h': '8H',
  '12h': '12H',
  '1d': '1D',
  '3d': '3D',
  '1w': '1W',
  '1M': '1M',
}

/**
 * OKX exchange adapter
 *
 * Supports:
 * - REST API: https://www.okx.com
 * - WebSocket: wss://ws.okx.com:8443/ws/v5/public
 * - Testnet: https://www.okx.com (demo trading)
 */
export class OKXAdapter extends BaseAdapter {
  readonly name = 'okx'

  protected getRestUrl(): string {
    return this.config.baseUrl ?? 'https://www.okx.com'
  }

  protected getWsUrl(): string {
    return this.config.wsUrl ?? 'wss://ws.okx.com:8443/ws/v5/public'
  }

  protected parseTimeframe(timeframe: Timeframe): string {
    return OKX_TIMEFRAMES[timeframe] ?? '1H'
  }

  protected normalizeCandle(data: unknown): CandleData {
    const c = data as [
      string, // Timestamp
      string, // Open
      string, // High
      string, // Low
      string, // Close
      string, // Volume
      string, // VolCcy (quote volume)
      string, // VolCcyQuote
      string, // Confirm
    ]

    return {
      o: this.normalizePrice(c[1]),
      h: this.normalizePrice(c[2]),
      l: this.normalizePrice(c[3]),
      c: this.normalizePrice(c[4]),
      v: this.normalizeAmount(c[5]),
      timestamp: Date.parse(c[0]),
    }
  }

  protected normalizeTicker(data: unknown, _symbol: string): TickerData {
    const t = data as {
      instId: string
      last: string
      open24h: string
      high24h: string
      low24h: string
      volCcy24h: string
      vol24h: string
      bidPx: string
      askPx: string
      ts: string
    }

    const lastPrice = Number.parseFloat(t.last)
    const openPrice = Number.parseFloat(t.open24h)
    const changePercent24h = openPrice > 0
      ? ((lastPrice - openPrice) / openPrice) * 100
      : 0

    return {
      symbol: t.instId,
      lastPrice,
      changePercent24h,
      volume24h: Number.parseFloat(t.vol24h),
      quoteVolume24h: Number.parseFloat(t.volCcy24h),
      high24h: Number.parseFloat(t.high24h),
      low24h: Number.parseFloat(t.low24h),
      bidPrice: Number.parseFloat(t.bidPx),
      askPrice: Number.parseFloat(t.askPx),
      timestamp: Number.parseInt(t.ts, 10),
    }
  }

  protected normalizeTrade(data: unknown): TradeData {
    const t = data as {
      instId: string
      tradeId: string
      px: string
      sz: string
      side: string
      ts: string
    }

    return {
      id: t.tradeId,
      symbol: t.instId,
      price: Number.parseFloat(t.px),
      amount: Number.parseFloat(t.sz),
      side: t.side as 'buy' | 'sell',
      timestamp: Number.parseInt(t.ts, 10),
    }
  }

  protected normalizeOrderBook(data: unknown, symbol: string): OrderBookData {
    const ob = data as {
      bids: Array<[string, string, string, string]>
      asks: Array<[string, string, string, string]>
      ts: string
      seqId?: number
    }

    const parseEntry = (entry: [string, string, string, string]): OrderBookEntry => ({
      price: Number.parseFloat(entry[0]),
      amount: Number.parseFloat(entry[1]),
    })

    return {
      symbol,
      bids: ob.bids.map(parseEntry),
      asks: ob.asks.map(parseEntry),
      timestamp: Number.parseInt(ob.ts, 10),
      sequence: ob.seqId,
    }
  }

  protected buildCandlesEndpoint(options: FetchCandlesOptions): string {
    const interval = this.parseTimeframe(options.timeframe)
    const symbol = options.symbol.replace('/', '-')

    let url = `/api/v5/market/history-candles?instId=${symbol}&bar=${interval}`

    if (options.limit) {
      url += `&limit=${options.limit}`
    }
    if (options.startTime) {
      url += `&before=${options.startTime}`
    }
    if (options.endTime) {
      url += `&after=${options.endTime}`
    }

    return url
  }

  protected buildSymbolsEndpoint(marketType?: MarketType): string {
    const instType = this.mapMarketType(marketType)
    return `/api/v5/public/instruments?instType=${instType}`
  }

  protected buildTickerEndpoint(symbol: string, _marketType?: MarketType): string {
    const formattedSymbol = symbol.replace('/', '-')
    return `/api/v5/public/ticker?instId=${formattedSymbol}`
  }

  protected parseCandlesResponse(data: unknown): unknown[] {
    const response = data as { data: unknown[] }
    return response.data ?? []
  }

  protected parseSymbolsResponse(data: unknown, _marketType?: MarketType): string[] {
    const response = data as { data: Array<{ instId: string, state: string }> }
    return (response.data ?? [])
      .filter(s => s.state === 'live')
      .map(s => s.instId)
  }

  protected handleWsMessage(data: unknown): void {
    const msg = data as { event?: string, arg?: { channel: string, instId: string }, data?: unknown }

    // Handle connection events
    if (msg.event === 'subscribe' || msg.event === 'unsubscribe' || msg.event === 'error') {
      return
    }

    if (!msg.arg?.channel || !msg.data)
      return

    const channel = msg.arg.channel
    const instId = msg.arg.instId

    switch (channel) {
      case 'candle1m':
      case 'candle3m':
      case 'candle5m':
      case 'candle15m':
      case 'candle30m':
      case 'candle1H':
      case 'candle2H':
      case 'candle4H':
      case 'candle6H':
      case 'candle12H':
      case 'candle1D':
      case 'candle1W':
      case 'candle1M':
        this.handleCandleMessage(msg.data as unknown[], instId)
        break
      case 'tickers':
        this.handleTickerMessage(msg.data as unknown[], instId)
        break
      case 'trades':
        this.handleTradeMessage(msg.data as unknown[], instId)
        break
      case 'books':
      case 'books5':
      case 'books50':
      case 'books-l2-tbt':
        this.handleOrderBookMessage(msg.data as unknown[], instId)
        break
    }
  }

  private handleCandleMessage(data: unknown[], instId: string): void {
    if (data.length === 0)
      return

    const c = data[0] as string[]
    const candle: CandleData = {
      o: this.normalizePrice(c[1]),
      h: this.normalizePrice(c[2]),
      l: this.normalizePrice(c[3]),
      c: this.normalizePrice(c[4]),
      v: this.normalizeAmount(c[5]),
      timestamp: Date.parse(c[0]),
    }

    // Extract timeframe from the data or use a default
    this.emit('candle', instId, '1m', candle)
  }

  private handleTickerMessage(data: unknown[], instId: string): void {
    if (data.length === 0)
      return

    const ticker = this.normalizeTicker(data[0], instId)
    this.emit('ticker', instId, ticker)
  }

  private handleTradeMessage(data: unknown[], _instId: string): void {
    for (const trade of data) {
      const normalized = this.normalizeTrade(trade)
      this.emit('trade', normalized.symbol, normalized)
    }
  }

  private handleOrderBookMessage(data: unknown[], instId: string): void {
    if (data.length === 0)
      return

    const ob = this.normalizeOrderBook(data[0], instId)
    this.emit('orderbook', instId, ob)
  }

  protected sendSubscribe(channel: string, options: SubscribeOptions, depth?: number): void {
    if (!this.ws)
      return

    const instId = options.symbol.replace('/', '-')
    let channelName: string

    switch (channel) {
      case 'candles':
        // @ts-expect-error - timeframe is part of options for candles
        channelName = `candle${this.parseTimeframe(options.timeframe as Timeframe)}`
        break
      case 'ticker':
        channelName = 'tickers'
        break
      case 'trades':
        channelName = 'trades'
        break
      case 'orderbook':
        channelName = depth === 5 ? 'books5' : depth === 50 ? 'books50' : 'books'
        break
      default:
        return
    }

    const msg = {
      op: 'subscribe',
      args: [{
        channel: channelName,
        instId,
      }],
    }

    this.ws.send(JSON.stringify(msg))
  }

  protected sendUnsubscribe(channel: string, options: SubscribeOptions, depth?: number): void {
    if (!this.ws)
      return

    const instId = options.symbol.replace('/', '-')
    let channelName: string

    switch (channel) {
      case 'candles':
        // @ts-expect-error - timeframe is part of options for candles
        channelName = `candle${this.parseTimeframe(options.timeframe as Timeframe)}`
        break
      case 'ticker':
        channelName = 'tickers'
        break
      case 'trades':
        channelName = 'trades'
        break
      case 'orderbook':
        channelName = depth === 5 ? 'books5' : depth === 50 ? 'books50' : 'books'
        break
      default:
        return
    }

    const msg = {
      op: 'unsubscribe',
      args: [{
        channel: channelName,
        instId,
      }],
    }

    this.ws.send(JSON.stringify(msg))
  }

  private mapMarketType(marketType?: MarketType): string {
    switch (marketType) {
      case 'spot':
        return 'SPOT'
      case 'perp':
      case 'futures':
        return 'SWAP'
      case 'margin':
        return 'MARGIN'
      default:
        return 'SPOT'
    }
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
      const error = JSON.parse(text) as { code: string, msg: string, data?: unknown }
      code = error.code
      message = error.msg
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
      headers['OK-ACCESS-KEY'] = this.config.apiKey
      // Note: Full authentication requires signature generation with timestamp
      // This is a simplified version for public endpoints
    }

    return headers
  }
}
