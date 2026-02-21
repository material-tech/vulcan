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
| [`@material-tech/vulcan-core`](./packages/core/) | Core types (`CandleData`, `Processor`, `SignalGenerator`) and utilities (`createSignal`, `collect`) |
| [`@material-tech/vulcan-indicators`](./packages/indicators/) | All technical indicators (trend, momentum, volume) |
| [`@material-tech/vulcan-strategies`](./packages/strategies/) | Composable trading strategies with structured signal output |
| [`@material-tech/vulcan-backtest`](./packages/backtest/) | Backtesting engine with position management and statistics |

## Installation

```bash
# Indicators (includes core as dependency)
pnpm add @material-tech/vulcan-indicators
```

## Usage

### Basic — Generator iteration

Every indicator is a generator function. Pass an iterable source and iterate over the results:

```ts
import { collect } from '@material-tech/vulcan-core'
import { sma } from '@material-tech/vulcan-indicators'

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
import { rsi } from '@material-tech/vulcan-indicators'

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
- [ ] Parabolic SAR (PSAR)
- [ ] Qstick
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
