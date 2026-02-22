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
| Double Exponential Moving Average | `dema` | `doubleExponentialMovingAverage` |
| Exponential Moving Average | `ema` | `exponentialMovingAverage` |
| Ichimoku Cloud | `ichimokuCloud` | — |
| MACD | `macd` | `movingAverageConvergenceDivergence` |
| Moving Max | `mmax` | `movingMax` |
| Moving Min | `mmin` | `movingMin` |
| Moving Sum | `msum` | — |
| Parabolic SAR | `psar` | `parabolicSar` |
| Qstick | `qstick` | `qstickIndicator` |
| Rolling Moving Average | `rma` | `rollingMovingAverage` |
| Simple Moving Average | `sma` | `simpleMovingAverage` |
| Since Change | `since` | `sinceChange` |
| Triple Exponential Average | `trix` | `tripleExponentialAverage` |
| Triple Exponential Moving Average | `tema` | `tripleExponentialMovingAverage` |
| Triangular Moving Average | `trima` | `triangularMovingAverage` |
| Typical Price | `typicalPrice` | `typicalPriceIndicator` |
| Volume Weighted Moving Average | `vwma` | `volumeWeightedMovingAverage` |
| Vortex Indicator | `vortex` | `vortexIndicator` |
| ADX/DMI | `adx` | `averageDirectionalIndex` |
| SuperTrend | `superTrend` | `superTrendIndicator` |
| ALMA | — | _TODO_ |
| ZigZag | — | _TODO_ |

### Momentum

| Indicator | Function | Alias |
| --- | --- | --- |
| Absolute Price Oscillator | `apo` | `absolutePriceOscillator` |
| Awesome Oscillator | `ao` | `awesomeOscillator` |
| Chaikin Oscillator | `cmo` | `chaikinOscillator` |
| Commodity Channel Index | `cci` | `commodityChannelIndex` |
| Percentage Price Oscillator | `ppo` | `percentagePriceOscillator` |
| Percentage Volume Oscillator | `pvo` | `percentageVolumeOscillator` |
| Price Rate of Change | `roc` | `priceRateOfChange` |
| Random Index (KDJ) | `kdj` | `randomIndex` |
| Relative Strength Index | `rsi` | `relativeStrengthIndex` |
| Stochastic Oscillator | `stoch` | `stochasticOscillator` |
| Williams %R | `willr` | `williamsR` |
| Money Flow Index | — | _TODO_ |
| Ultimate Oscillator | — | _TODO_ |
| True Strength Index | — | _TODO_ |

### Volatility

| Indicator | Function | Alias |
| --- | --- | --- |
| Mass Index | `mi` | `massIndex` |
| Average True Range | — | _TODO_ |
| Bollinger Bands | — | _TODO_ |
| Keltner Channels | — | _TODO_ |
| Donchian Channels | — | _TODO_ |
| Standard Deviation | — | _TODO_ |

### Volume

| Indicator | Function | Alias |
| --- | --- | --- |
| Accumulation/Distribution | `ad` | `accumulationDistribution` |
| On-Balance Volume | — | _TODO_ |
| VWAP | — | _TODO_ |
| Force Index | — | _TODO_ |
| Ease of Movement | — | _TODO_ |

## License

MIT
