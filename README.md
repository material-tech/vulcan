# Vulcan

A TypeScript library for technical analysis indicators, built on generator-based streaming architecture with high-precision decimal arithmetic.

## Features

- **Generator-based streaming** — Process data point-by-point via standard iterators, naturally composable with for-of loops and pipelines
- **High-precision arithmetic** — Powered by [`dnum`](https://github.com/bpierre/dnum), representing numbers as `[value: bigint, decimals: number]` tuples — no floating-point rounding errors
- **Full TypeScript support** — Strict types for all indicators, options, and outputs
- **Modular packages** — Pick only what you need: core primitives, indicators, strategies, or backtesting

## Packages

| Package | Description |
| --- | --- |
| [`@vulcan-js/core`](./packages/core/) | Core types (`CandleData`, `Processor`, `SignalGenerator`) and utilities (`createSignal`, `collect`) |
| [`@vulcan-js/indicators`](./packages/indicators/) | All technical indicators (trend, momentum, volume) |
| [`@vulcan-js/strategies`](./packages/strategies/) | Composable trading strategies with structured signal output |
| [`@vulcan-js/backtest`](./packages/backtest/) | Backtesting engine with position management and statistics |
| [`@vulcan-js/forge`](./packages/forge/) | All-in-one package that re-exports all Vulcan modules |

## Installation

```bash
# All-in-one (includes all packages)
pnpm add @vulcan-js/forge

# Or install individual packages as needed
pnpm add @vulcan-js/indicators   # Indicators (includes core)
pnpm add @vulcan-js/strategies   # Strategies (includes core + indicators)
pnpm add @vulcan-js/backtest     # Backtesting (includes core + strategies)
```

## Usage

### Basic — Generator iteration

Every indicator is a generator function. Pass an iterable source and iterate over the results:

```ts
import { collect } from '@vulcan-js/core'
import { sma } from '@vulcan-js/indicators'

const prices = [10, 11, 12, 13, 14, 15]

// Collect all results into an array
const results = collect(sma(prices, { period: 3 }))

// Or iterate lazily
for (const value of sma(prices, { period: 3 })) {
  console.log(value) // Dnum tuple: [bigint, number]
}
```

### Stateful processor — Real-time / streaming

Use `.create()` to get a stateful processor for feeding data point-by-point:

```ts
import { rsi } from '@vulcan-js/indicators'

const process = rsi.create({ period: 14 })

// Feed new prices as they arrive
const result1 = process(100)
const result2 = process(102)
const result3 = process(98)
```

## Supported Indicators

### Trend

- [x] Aroon Indicator
- [x] Balance of Power (BOP)
- [x] Chande Forecast Oscillator (CFO)
- [x] Commodity Channel Index (CCI)
- [x] Double Exponential Moving Average (DEMA)
- [x] Exponential Moving Average (EMA)
- [x] Mass Index (MI)
- [x] Moving Average Convergence Divergence (MACD)
- [x] Moving Max (MMAX)
- [x] Moving Min (MMIN)
- [x] Moving Sum (MSUM)
- [x] Parabolic SAR (PSAR)
- [x] Qstick
- [ ] Random Index (KDJ)
- [x] Rolling Moving Average (RMA)
- [x] Simple Moving Average (SMA)
- [ ] Since Change
- [ ] Triple Exponential Moving Average (TEMA)
- [x] Triangular Moving Average (TRIMA)
- [ ] Triple Exponential Average (TRIX)
- [ ] Typical Price
- [ ] Volume Weighted Moving Average (VWMA)
- [ ] Vortex Indicator

### Momentum

- [x] Absolute Price Oscillator (APO)
- [x] Awesome Oscillator (AO)
- [x] Chaikin Oscillator (CMO)
- [x] Ichimoku Cloud
- [x] Percentage Price Oscillator (PPO)
- [ ] Percentage Volume Oscillator (PVO)
- [ ] Price Rate of Change (ROC)
- [x] Relative Strength Index (RSI)
- [x] Stochastic Oscillator (STOCH)
- [ ] Williams R (WILLR)

### Volume

- [x] Accumulation/Distribution (AD)

## License

MIT
