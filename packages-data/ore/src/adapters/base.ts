import type { CandleData } from '@vulcan-js/core'
import type { RateLimiter } from '../rate-limiter.ts'
import type {
  ExchangeAdapter,
  ExchangeAdapterConfig,
  ExchangeError,
  FetchCandlesOptions,
  MarketType,
  OrderBookData,
  SubscribeOptions,
  TickerData,
  Timeframe,
  TradeData,
} from '../types.ts'
import { fp18 } from '@vulcan-js/core'
import { defu } from 'defu'
import { CandleCache } from '../cache.ts'
import { createExchangeRateLimiter } from '../rate-limiter.ts'

/**
 * Default adapter configuration
 */
export const defaultAdapterConfig: ExchangeAdapterConfig = {
  testnet: false,
  timeout: 30000,
  rateLimitPerSecond: 10,
}

/**
 * Abstract base class for exchange adapters
 *
 * Provides common functionality for:
 * - Configuration management
 * - Rate limiting
 * - Caching
 * - Data normalization
 * - WebSocket connection management
 */
export abstract class BaseAdapter implements ExchangeAdapter {
  abstract readonly name: string

  readonly config: ExchangeAdapterConfig
  protected cache: CandleCache
  protected rateLimiter?: RateLimiter
  protected ws: WebSocket | null = null
  protected subscriptions: Map<string, { unsubscribe: () => void, callback: (data: unknown) => void, options?: SubscribeOptions & { depth?: number } }> = new Map()

  private _isConnected = false
  private reconnectAttempts = 0
  private readonly maxReconnectAttempts = 5
  private reconnectDelay = 1000
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null

  constructor(config?: Partial<ExchangeAdapterConfig>) {
    this.config = defu(config, defaultAdapterConfig)
    this.cache = new CandleCache()
  }

  /**
   * Get the rate limiter, creating it lazily on first use
   */
  protected getRateLimiter(): RateLimiter {
    if (!this.rateLimiter) {
      this.rateLimiter = createExchangeRateLimiter(this.name, {
        maxRequests: this.config.rateLimitPerSecond ?? 10,
        intervalMs: 1000,
      })
    }
    return this.rateLimiter
  }

  get isConnected(): boolean {
    return this._isConnected
  }

  /**
   * Get the base REST API URL
   */
  protected abstract getRestUrl(): string

  /**
   * Get the WebSocket URL
   */
  protected abstract getWsUrl(): string

  /**
   * Parse a timeframe string into exchange-specific format
   */
  protected abstract parseTimeframe(timeframe: Timeframe): string

  /**
   * Normalize exchange-specific candle data to CandleData format
   */
  protected abstract normalizeCandle(data: unknown): CandleData

  /**
   * Normalize exchange-specific ticker data to TickerData format
   */
  protected abstract normalizeTicker(data: unknown, symbol: string): TickerData

  /**
   * Normalize exchange-specific trade data to TradeData format
   */
  protected abstract normalizeTrade(data: unknown): TradeData

  /**
   * Normalize exchange-specific order book data to OrderBookData format
   */
  protected abstract normalizeOrderBook(data: unknown, symbol: string): OrderBookData

  /**
   * Build the REST API endpoint for fetching candles
   */
  protected abstract buildCandlesEndpoint(options: FetchCandlesOptions): string

  /**
   * Build the REST API endpoint for fetching symbols
   */
  protected abstract buildSymbolsEndpoint(marketType?: MarketType): string

  /**
   * Build the REST API endpoint for fetching ticker
   */
  protected abstract buildTickerEndpoint(symbol: string, marketType?: MarketType): string

  /**
   * Handle WebSocket messages
   */
  protected abstract handleWsMessage(data: unknown): void

  /**
   * Fetch historical candlestick data with caching
   */
  async fetchCandles(options: FetchCandlesOptions): Promise<CandleData[]> {
    // Check cache first
    const cached = this.cache.get(options.symbol, options.timeframe, options.startTime, options.endTime)
    if (cached && cached.length > 0) {
      return cached
    }

    // Apply rate limiting
    await this.getRateLimiter().acquire()

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

      const data = await response.json()
      const candles = this.parseCandlesResponse(data)

      // Normalize and cache
      const normalized = candles.map(c => this.normalizeCandle(c))
      this.cache.set(options.symbol, options.timeframe, normalized)

      return normalized
    }
    catch (error) {
      throw this.wrapError(error)
    }
  }

  /**
   * Fetch available trading symbols
   */
  async fetchSymbols(marketType?: MarketType): Promise<string[]> {
    await this.getRateLimiter().acquire()

    try {
      const endpoint = this.buildSymbolsEndpoint(marketType)
      const url = `${this.getRestUrl()}${endpoint}`

      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(),
        signal: AbortSignal.timeout(this.config.timeout ?? 30000),
      })

      if (!response.ok) {
        throw await this.handleError(response)
      }

      const data = await response.json()
      return this.parseSymbolsResponse(data, marketType)
    }
    catch (error) {
      throw this.wrapError(error)
    }
  }

  /**
   * Fetch current ticker data
   */
  async fetchTicker(symbol: string, marketType?: MarketType): Promise<TickerData> {
    await this.getRateLimiter().acquire()

    try {
      const endpoint = this.buildTickerEndpoint(symbol, marketType)
      const url = `${this.getRestUrl()}${endpoint}`

      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(),
        signal: AbortSignal.timeout(this.config.timeout ?? 30000),
      })

      if (!response.ok) {
        throw await this.handleError(response)
      }

      const data = await response.json()
      return this.normalizeTicker(data, symbol)
    }
    catch (error) {
      throw this.wrapError(error)
    }
  }

  /**
   * Connect to WebSocket
   */
  async connect(): Promise<void> {
    if (this._isConnected)
      return

    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.getWsUrl())

        this.ws.onopen = () => {
          this._isConnected = true
          this.reconnectAttempts = 0
          this.onConnect()
          resolve()
        }

        this.ws.onclose = () => {
          this._isConnected = false
          this.onDisconnect()
          this.attemptReconnect()
        }

        this.ws.onerror = (error) => {
          reject(this.wrapError(error))
        }

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data)
            this.handleWsMessage(data)
          }
          catch {
            // Ignore non-JSON messages
          }
        }
      }
      catch (error) {
        reject(this.wrapError(error))
      }
    })
  }

  /**
   * Disconnect from WebSocket
   */
  async disconnect(): Promise<void> {
    this._isConnected = false

    // Cancel any pending reconnect
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }

    if (this.ws) {
      this.ws.close()
      this.ws = null
    }

    // Clear all subscriptions
    this.subscriptions.clear()
  }

  /**
   * Subscribe to real-time candle updates
   */
  async subscribeCandles(
    options: SubscribeOptions & { timeframe: Timeframe },
    callback: (candle: CandleData) => void,
  ): Promise<() => void> {
    await this.ensureConnected()

    const subscriptionId = this.generateSubscriptionId('candles', options.symbol, options.timeframe)

    const unsubscribe = () => {
      this.subscriptions.delete(subscriptionId)
      this.sendUnsubscribe('candles', options)
    }

    this.subscriptions.set(subscriptionId, { unsubscribe, callback })
    await this.sendSubscribe('candles', options)

    return unsubscribe
  }

  /**
   * Subscribe to real-time ticker updates
   */
  async subscribeTicker(
    options: SubscribeOptions,
    callback: (ticker: TickerData) => void,
  ): Promise<() => void> {
    await this.ensureConnected()

    const subscriptionId = this.generateSubscriptionId('ticker', options.symbol)

    const unsubscribe = () => {
      this.subscriptions.delete(subscriptionId)
      this.sendUnsubscribe('ticker', options)
    }

    this.subscriptions.set(subscriptionId, { unsubscribe, callback })
    await this.sendSubscribe('ticker', options)

    return unsubscribe
  }

  /**
   * Subscribe to real-time trade updates
   */
  async subscribeTrades(
    options: SubscribeOptions,
    callback: (trade: TradeData) => void,
  ): Promise<() => void> {
    await this.ensureConnected()

    const subscriptionId = this.generateSubscriptionId('trades', options.symbol)

    const unsubscribe = () => {
      this.subscriptions.delete(subscriptionId)
      this.sendUnsubscribe('trades', options)
    }

    this.subscriptions.set(subscriptionId, { unsubscribe, callback })
    await this.sendSubscribe('trades', options)

    return unsubscribe
  }

  /**
   * Subscribe to real-time order book updates
   */
  async subscribeOrderBook(
    options: SubscribeOptions,
    callback: (orderBook: OrderBookData) => void,
    depth?: number,
  ): Promise<() => void> {
    await this.ensureConnected()

    const subscriptionId = this.generateSubscriptionId('orderbook', options.symbol, String(depth ?? 10))

    const unsubscribe = () => {
      this.subscriptions.delete(subscriptionId)
      this.sendUnsubscribe('orderbook', options, depth)
    }

    this.subscriptions.set(subscriptionId, { unsubscribe, callback, options: { ...options, depth } })
    await this.sendSubscribe('orderbook', options, depth)

    return unsubscribe
  }

  /**
   * Parse candles from exchange response
   */
  protected abstract parseCandlesResponse(data: unknown): unknown[]

  /**
   * Parse symbols from exchange response
   */
  protected abstract parseSymbolsResponse(data: unknown, marketType?: MarketType): string[]

  /**
   * Send subscribe message via WebSocket
   */
  protected abstract sendSubscribe(
    channel: string,
    options: SubscribeOptions,
    depth?: number
  ): void

  /**
   * Send unsubscribe message via WebSocket
   */
  protected abstract sendUnsubscribe(
    channel: string,
    options: SubscribeOptions,
    depth?: number
  ): void

  /**
   * Get request headers
   */
  protected getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    if (this.config.apiKey) {
      headers['X-API-Key'] = this.config.apiKey
    }

    return headers
  }

  /**
   * Handle HTTP error response
   */
  protected async handleError(response: Response): Promise<ExchangeError> {
    const text = await response.text()
    return new Error(`HTTP ${response.status}: ${text}`) as ExchangeError
  }

  /**
   * Wrap error with exchange context
   */
  protected wrapError(error: unknown): ExchangeError {
    if (error instanceof Error) {
      return error as ExchangeError
    }
    return new Error(String(error)) as ExchangeError
  }

  /**
   * Ensure WebSocket is connected
   */
  protected async ensureConnected(): Promise<void> {
    if (!this._isConnected) {
      await this.connect()
    }
  }

  /**
   * Generate unique subscription ID
   */
  protected generateSubscriptionId(...parts: string[]): string {
    return parts.join(':')
  }

  /**
   * Emit data to subscription callbacks
   */
  protected emit(subscriptionId: string, data: unknown): void {
    const subscription = this.subscriptions.get(subscriptionId)
    if (subscription) {
      try {
        subscription.callback(data)
      }
      catch (error) {
        console.error(`Error in subscription callback for ${subscriptionId}:`, error)
      }
    }
  }

  /**
   * Emit candle data to all matching subscriptions
   */
  protected emitCandle(symbol: string, timeframe: Timeframe, candle: CandleData): void {
    const subscriptionId = this.generateSubscriptionId('candles', symbol, timeframe)
    this.emit(subscriptionId, candle)
  }

  /**
   * Emit ticker data to all matching subscriptions
   */
  protected emitTicker(symbol: string, ticker: TickerData): void {
    const subscriptionId = this.generateSubscriptionId('ticker', symbol)
    this.emit(subscriptionId, ticker)
  }

  /**
   * Emit trade data to all matching subscriptions
   */
  protected emitTrade(symbol: string, trade: TradeData): void {
    const subscriptionId = this.generateSubscriptionId('trades', symbol)
    this.emit(subscriptionId, trade)
  }

  /**
   * Emit order book data to all matching subscriptions
   */
  protected emitOrderBook(symbol: string, _depth: number, orderBook: OrderBookData): void {
    // Find all orderbook subscriptions for this symbol (may have different depths)
    for (const [subscriptionId, _subscription] of this.subscriptions) {
      if (subscriptionId.startsWith(`orderbook:${symbol}:`)) {
        this.emit(subscriptionId, orderBook)
      }
    }
  }

  /**
   * Called when WebSocket connects
   */
  protected onConnect(): void {
    // Override in subclass
  }

  /**
   * Called when WebSocket disconnects
   */
  protected onDisconnect(): void {
    // Override in subclass
  }

  /**
   * Attempt to reconnect WebSocket
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      return
    }

    this.reconnectAttempts++
    const delay = this.reconnectDelay * 2 ** (this.reconnectAttempts - 1)

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null
      this.connect().catch(() => {
        // Reconnection failed, will retry if under max attempts
      })
    }, delay)
  }

  /**
   * Get the cache instance
   */
  getCache(): CandleCache {
    return this.cache
  }

  /**
   * Normalize a price value to dnum format
   */
  protected normalizePrice(price: number | string): ReturnType<typeof fp18.toDnum> {
    return fp18.toDnum(fp18.toFp18(price))
  }

  /**
   * Normalize an amount/volume value to dnum format
   */
  protected normalizeAmount(amount: number | string): ReturnType<typeof fp18.toDnum> {
    return fp18.toDnum(fp18.toFp18(amount))
  }
}
