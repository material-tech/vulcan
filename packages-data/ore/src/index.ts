// Core types and errors
export {
  // Types
  type Timeframe,
  type MarketType,
  type TickerData,
  type TradeData,
  type OrderBookEntry,
  type OrderBookData,
  type FetchCandlesOptions,
  type SubscribeOptions,
  type ExchangeAdapterConfig,
  type ExchangeAdapter,
  type CacheConfig,
  // Error classes
  ExchangeError,
  RateLimitError,
  WebSocketError,
} from './types.ts'

// Cache
export {
  CandleCache,
  defaultCacheConfig,
  getGlobalCache,
  resetGlobalCache,
} from './cache.ts'

// Rate limiter
export {
  RateLimiter,
  RateLimiterManager,
  ExchangeRateLimits,
  createExchangeRateLimiter,
  type RateLimiterConfig,
} from './rate-limiter.ts'

// Adapters
export {
  BaseAdapter,
  defaultAdapterConfig,
  BinanceAdapter,
  OKXAdapter,
  HyperliquidAdapter,
  AlpacaAdapter,
} from './adapters/index.ts'
