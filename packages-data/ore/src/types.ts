import type { CandleData } from '@vulcan-js/core'

/**
 * Timeframe intervals supported by exchanges
 */
export type Timeframe =
  | '1s' | '5s' | '15s' | '30s'
  | '1m' | '3m' | '5m' | '15m' | '30m'
  | '1h' | '2h' | '4h' | '6h' | '8h' | '12h'
  | '1d' | '3d' | '1w' | '1M'

/**
 * Market type for exchanges that support different market types
 */
export type MarketType = 'spot' | 'perp' | 'futures' | 'margin'

/**
 * Ticker data for real-time price updates
 */
export interface TickerData {
  /** Symbol/trading pair */
  symbol: string
  /** Last traded price */
  lastPrice: number
  /** 24h change percentage */
  changePercent24h?: number
  /** 24h volume in base asset */
  volume24h?: number
  /** 24h volume in quote asset */
  quoteVolume24h?: number
  /** Highest price in 24h */
  high24h?: number
  /** Lowest price in 24h */
  low24h?: number
  /** Best bid price */
  bidPrice?: number
  /** Best ask price */
  askPrice?: number
  /** Timestamp */
  timestamp: number
}

/**
 * Trade data for individual trades
 */
export interface TradeData {
  /** Trade ID */
  id: string
  /** Symbol/trading pair */
  symbol: string
  /** Trade price */
  price: number
  /** Trade amount */
  amount: number
  /** Trade side */
  side: 'buy' | 'sell'
  /** Timestamp */
  timestamp: number
}

/**
 * Order book entry (bid or ask)
 */
export interface OrderBookEntry {
  /** Price level */
  price: number
  /** Amount at this price level */
  amount: number
}

/**
 * Order book (L2) data
 */
export interface OrderBookData {
  /** Symbol/trading pair */
  symbol: string
  /** Bid levels (sorted by price descending) */
  bids: OrderBookEntry[]
  /** Ask levels (sorted by price ascending) */
  asks: OrderBookEntry[]
  /** Timestamp */
  timestamp: number
  /** Sequence number for synchronization */
  sequence?: number
}

/**
 * Options for fetching historical candle data
 */
export interface FetchCandlesOptions {
  /** Trading pair symbol (e.g., 'BTC-USD', 'ETH/USDC') */
  symbol: string
  /** Candle timeframe */
  timeframe: Timeframe
  /** Start time (timestamp in ms) */
  startTime?: number
  /** End time (timestamp in ms) */
  endTime?: number
  /** Maximum number of candles to fetch */
  limit?: number
  /** Market type (for exchanges with multiple markets) */
  marketType?: MarketType
}

/**
 * Options for subscribing to real-time data
 */
export interface SubscribeOptions {
  /** Trading pair symbol */
  symbol: string
  /** Market type */
  marketType?: MarketType
}

/**
 * Exchange adapter configuration
 */
export interface ExchangeAdapterConfig {
  /** API key for authenticated requests */
  apiKey?: string
  /** API secret for authenticated requests */
  apiSecret?: string
  /** Passphrase (required for some exchanges like OKX) */
  passphrase?: string
  /** Testnet/sandbox mode */
  testnet?: boolean
  /** Base URL override (for custom endpoints) */
  baseUrl?: string
  /** WebSocket URL override */
  wsUrl?: string
  /** Request timeout in milliseconds */
  timeout?: number
  /** Rate limit requests per second */
  rateLimitPerSecond?: number
}

/**
 * Exchange adapter interface
 * 
 * Implement this interface to add support for a new exchange.
 */
export interface ExchangeAdapter {
  /** Exchange identifier */
  readonly name: string
  
  /** Adapter configuration */
  readonly config: ExchangeAdapterConfig
  
  /**
   * Check if the adapter is connected (WebSocket)
   */
  readonly isConnected: boolean
  
  /**
   * Fetch historical candlestick (OHLCV) data
   * 
   * @param options - Fetch options
   * @returns Promise resolving to array of CandleData
   */
  fetchCandles(options: FetchCandlesOptions): Promise<CandleData[]>
  
  /**
   * Fetch available trading pairs/symbols
   * 
   * @param marketType - Optional market type filter
   * @returns Promise resolving to array of symbols
   */
  fetchSymbols(marketType?: MarketType): Promise<string[]>
  
  /**
   * Fetch current ticker data for a symbol
   * 
   * @param symbol - Trading pair symbol
   * @param marketType - Optional market type
   * @returns Promise resolving to TickerData
   */
  fetchTicker(symbol: string, marketType?: MarketType): Promise<TickerData>
  
  /**
   * Connect to WebSocket for real-time data
   * 
   * @returns Promise that resolves when connected
   */
  connect(): Promise<void>
  
  /**
   * Disconnect from WebSocket
   * 
   * @returns Promise that resolves when disconnected
   */
  disconnect(): Promise<void>
  
  /**
   * Subscribe to real-time candle updates
   * 
   * @param options - Subscribe options
   * @param callback - Callback function for new candles
   * @returns Unsubscribe function
   */
  subscribeCandles(
    options: SubscribeOptions & { timeframe: Timeframe },
    callback: (candle: CandleData) => void
  ): Promise<() => void>
  
  /**
   * Subscribe to real-time ticker updates
   * 
   * @param options - Subscribe options
   * @param callback - Callback function for ticker updates
   * @returns Unsubscribe function
   */
  subscribeTicker(
    options: SubscribeOptions,
    callback: (ticker: TickerData) => void
  ): Promise<() => void>
  
  /**
   * Subscribe to real-time trade updates
   * 
   * @param options - Subscribe options
   * @param callback - Callback function for trade updates
   * @returns Unsubscribe function
   */
  subscribeTrades(
    options: SubscribeOptions,
    callback: (trade: TradeData) => void
  ): Promise<() => void>
  
  /**
   * Subscribe to real-time order book updates
   * 
   * @param options - Subscribe options
   * @param callback - Callback function for order book updates
   * @param depth - Order book depth (number of levels)
   * @returns Unsubscribe function
   */
  subscribeOrderBook(
    options: SubscribeOptions,
    callback: (orderBook: OrderBookData) => void,
    depth?: number
  ): Promise<() => void>
}

/**
 * Cache configuration options
 */
export interface CacheConfig {
  /** Enable in-memory caching */
  enabled: boolean
  /** Maximum number of candles to keep in memory per symbol/timeframe */
  maxSize: number
  /** Time-to-live in milliseconds */
  ttl: number
  /** Enable persistent storage (implementation-specific) */
  persistent?: boolean
}

/**
 * Normalized exchange error
 */
export class ExchangeError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly exchange?: string
  ) {
    super(message)
    this.name = 'ExchangeError'
  }
}

/**
 * Rate limit error
 */
export class RateLimitError extends ExchangeError {
  constructor(
    message: string,
    public readonly retryAfter: number,
    exchange?: string
  ) {
    super(message, 'RATE_LIMIT', exchange)
    this.name = 'RateLimitError'
  }
}

/**
 * WebSocket error
 */
export class WebSocketError extends ExchangeError {
  constructor(message: string, exchange?: string) {
    super(message, 'WEBSOCKET_ERROR', exchange)
    this.name = 'WebSocketError'
  }
}
