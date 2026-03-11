// Adapters
export {
  AlpacaAdapter,
  BaseAdapter,
  BinanceAdapter,
  defaultAdapterConfig,
  HyperliquidAdapter,
  OKXAdapter,
} from './adapters/index.ts'

// Cache
export {
  CandleCache,
  defaultCacheConfig,
  getGlobalCache,
  resetGlobalCache,
} from './cache.ts'

// Rate limiter
export {
  createExchangeRateLimiter,
  ExchangeRateLimits,
  RateLimiter,
  type RateLimiterConfig,
  RateLimiterManager,
} from './rate-limiter.ts'

// Core types and errors
export {
  type CacheConfig,
  type ExchangeAdapter,
  type ExchangeAdapterConfig,
  // Error classes
  ExchangeError,
  type FetchCandlesOptions,
  type MarketType,
  type OrderBookData,
  type OrderBookEntry,
  RateLimitError,
  type SubscribeOptions,
  type TickerData,
  // Types
  type Timeframe,
  type TradeData,
  WebSocketError,
} from './types.ts'
