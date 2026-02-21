# @vulcan-js/indicators

Technical analysis indicators for the [Vulcan](https://github.com/material-tech/vulcan) library, built on generator-based streaming with high-precision decimal arithmetic ([`dnum`](https://github.com/bpierre/dnum)).

## Installation

```bash
pnpm add @vulcan-js/indicators
```

## Usage

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

Use `.create()` to get a stateful processor for real-time / streaming scenarios:

```ts
import { rsi } from '@vulcan-js/indicators'

const process = rsi.create({ period: 14 })

process(100) // feed prices one by one
process(102)
process(98)
```

## Supported Indicators

### Trend

| Indicator | Function | Alias |
| --- | --- | --- |
| Aroon Indicator | `aroon` | — |
| Balance of Power | `bop` | `balanceOfPower` |
| Chande Forecast Oscillator | `cfo` | `chandeForecastOscillator` |
| Commodity Channel Index | `cci` | `commodityChannelIndex` |
| Double Exponential Moving Average | `dema` | `doubleExponentialMovingAverage` |
| Exponential Moving Average | `ema` | `exponentialMovingAverage` |
| Mass Index | `mi` | `massIndex` |
| MACD | `macd` | `movingAverageConvergenceDivergence` |
| Moving Max | `mmax` | `movingMax` |
| Moving Min | `mmin` | `movingMin` |
| Moving Sum | `msum` | — |
| Parabolic SAR | `psar` | `parabolicSar` |
| Qstick | `qstick` | `qstickIndicator` |
| Random Index (KDJ) | `kdj` | `randomIndex` |
| Rolling Moving Average | `rma` | `rollingMovingAverage` |
| Simple Moving Average | `sma` | `simpleMovingAverage` |
| Since Change | `since` | `sinceChange` |
| Triple Exponential Average | `trix` | `tripleExponentialAverage` |
| Triple Exponential Moving Average | `tema` | `tripleExponentialMovingAverage` |
| Triangular Moving Average | `trima` | `triangularMovingAverage` |
| Typical Price | `typicalPrice` | `typicalPriceIndicator` |

### Momentum

| Indicator | Function | Alias |
| --- | --- | --- |
| Absolute Price Oscillator | `apo` | `absolutePriceOscillator` |
| Awesome Oscillator | `ao` | `awesomeOscillator` |
| Chaikin Oscillator | `cmo` | `chaikinOscillator` |
| Ichimoku Cloud | `ichimokuCloud` | — |
| Percentage Price Oscillator | `ppo` | `percentagePriceOscillator` |
| Relative Strength Index | `rsi` | `relativeStrengthIndex` |
| Stochastic Oscillator | `stoch` | `stochasticOscillator` |

### Volume

| Indicator | Function | Alias |
| --- | --- | --- |
| Accumulation/Distribution | `ad` | `accumulationDistribution` |

## License

MIT
