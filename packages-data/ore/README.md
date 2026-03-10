# @vulcan-js/ore

Unified exchange data infrastructure for the [Vulcan](https://github.com/material-tech/vulcan) technical analysis library.

In the Vulcan metallurgy theme, **ore** represents the raw material — the market data that feeds into the analytical pipeline.

## Features

- 🔄 **Unified Exchange Adapter Interface** — Abstract adapter for exchange-specific implementations
- 📊 **REST Data Fetching** — Retrieve historical candlestick (OHLCV) data with pagination
- ⚡ **WebSocket Real-Time Streaming** — Subscribe to live candlestick and ticker updates
- 🎯 **Data Normalization** — Transform exchange-specific responses into standard `CandleData` format
- 💾 **Caching Layer** — In-memory LRU caching for historical data
- ⏱️ **Rate Limiting** — Built-in rate limiter per exchange to respect API limits

## Supported Exchanges

| Exchange | REST API | WebSocket | Notes |
|----------|----------|-----------|-------|
| Binance | ✅ | ✅ | Spot market, testnet support |
| OKX | ✅ | ✅ | Spot and perpetual markets |
| Hyperliquid | ✅ | ✅ | Perpetual futures only |
| Alpaca | ✅ | ✅ | Crypto (US only) |

## Installation

\`\`\`bash
pnpm add @vulcan-js/ore
# or
npm install @vulcan-js/ore
\`\`\`

## Quick Start

### Fetch Historical Candles

\`\`\`typescript
import { BinanceAdapter } from '@vulcan-js/ore'

const binance = new BinanceAdapter()

const candles = await binance.fetchCandles({
  symbol: 'BTCUSDT',
  timeframe: '1h',
  limit: 100,
})

console.log(candles)
// [
//   { o: [123450000000000000000n, 18], h: [...], l: [...], c: [...], v: [...], timestamp: 1704067200000 },
//   ...
// ]
\`\`\`

### Real-Time WebSocket Data

\`\`\`typescript
import { OKXAdapter } from '@vulcan-js/ore'

const okx = new OKXAdapter()

// Connect to WebSocket
await okx.connect()

// Subscribe to candle updates
const unsubscribe = await okx.subscribeCandles(
  { symbol: 'BTC-USDT', timeframe: '5m' },
  (candle) => {
    console.log('New candle:', candle)
  }
)

// Later, unsubscribe
unsubscribe()

// Disconnect when done
await okx.disconnect()
\`\`\`

### Using with Indicators

\`\`\`typescript
import { BinanceAdapter } from '@vulcan-js/ore'
import { sma } from '@vulcan-js/indicators'
import { collect } from '@vulcan-js/core'

const binance = new BinanceAdapter()

// Fetch data
const candles = await binance.fetchCandles({
  symbol: 'ETHUSDT',
  timeframe: '1h',
  limit: 50,
})

// Extract close prices and calculate SMA
const closes = candles.map(c => c.c)
const smaValues = collect(sma(closes, { period: 20 }))

console.log('SMA:', smaValues)
\`\`\`

## Exchange Adapters

### Binance

\`\`\`typescript
import { BinanceAdapter } from '@vulcan-js/ore'

const binance = new BinanceAdapter({
  apiKey: 'your-api-key',      // Optional
  apiSecret: 'your-secret',    // Optional
  testnet: false,              // Use testnet
  timeout: 30000,              // Request timeout
  rateLimitPerSecond: 10,      // Custom rate limit
})
\`\`\`

### OKX

\`\`\`typescript
import { OKXAdapter } from '@vulcan-js/ore'

const okx = new OKXAdapter({
  apiKey: 'your-api-key',
  apiSecret: 'your-secret',
  passphrase: 'your-passphrase',  // Required for OKX
  testnet: false,
})
\`\`\`

### Hyperliquid

\`\`\`typescript
import { HyperliquidAdapter } from '@vulcan-js/ore'

const hyperliquid = new HyperliquidAdapter()

// Note: Hyperliquid only supports specific timeframes
// Supported: 1m, 5m, 15m, 1h, 4h, 1d
\`\`\`

### Alpaca

\`\`\`typescript
import { AlpacaAdapter } from '@vulcan-js/ore'

const alpaca = new AlpacaAdapter({
  apiKey: 'your-api-key',
  apiSecret: 'your-secret',
})

// Note: Alpaca crypto is only available in the US
\`\`\`

## Caching

The adapters include an in-memory LRU cache to reduce API calls:

\`\`\`typescript
import { BinanceAdapter, getGlobalCache } from '@vulcan-js/ore'

const binance = new BinanceAdapter()

// Cache is used automatically for fetchCandles()
const candles1 = await binance.fetchCandles({ symbol: 'BTCUSDT', timeframe: '1h' })

// Second call returns cached data (if not expired)
const candles2 = await binance.fetchCandles({ symbol: 'BTCUSDT', timeframe: '1h' })

// Configure cache globally
const cache = getGlobalCache({
  enabled: true,
  maxSize: 10000,      // Max candles in memory
  ttl: 5 * 60 * 1000,  // 5 minutes
})

// Or per-adapter
const binanceWithCache = new BinanceAdapter()
binanceWithCache.cache.set('BTCUSDT', '1h', candles)
\`\`\`

## Rate Limiting

Each adapter includes built-in rate limiting appropriate for the exchange:

\`\`\`typescript
import { BinanceAdapter, createExchangeRateLimiter } from '@vulcan-js/ore'

// Default rate limits are applied automatically
const binance = new BinanceAdapter()

// Custom rate limiter
const limiter = createExchangeRateLimiter('binance', {
  maxRequests: 600,
  intervalMs: 60 * 1000,
})

await limiter.acquire() // Wait for rate limit token
\`\`\`

## Error Handling

\`\`\`typescript
import { BinanceAdapter, ExchangeError, RateLimitError } from '@vulcan-js/ore'

const binance = new BinanceAdapter()

try {
  const candles = await binance.fetchCandles({
    symbol: 'INVALID',
    timeframe: '1h',
  })
} catch (error) {
  if (error instanceof RateLimitError) {
    console.log(`Rate limited, retry after ${error.retryAfter}ms`)
  } else if (error instanceof ExchangeError) {
    console.log(`Exchange error: ${error.message} (${error.code})`)
  }
}
\`\`\`

## Timeframes

Supported timeframes vary by exchange:

| Timeframe | Binance | OKX | Hyperliquid | Alpaca |
|-----------|---------|-----|-------------|--------|
| 1m | ✅ | ✅ | ✅ | ✅ |
| 5m | ✅ | ✅ | ✅ | ✅ |
| 15m | ✅ | ✅ | ✅ | ✅ |
| 1h | ✅ | ✅ | ✅ | ✅ |
| 4h | ✅ | ✅ | ✅ | ❌ |
| 1d | ✅ | ✅ | ✅ | ✅ |

## License

MIT
