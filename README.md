# alloy

`alloy` is a JavaScript library that provides various technical analysis indicators.

## Advantages

- Full TypeScript support
- No limitation on decimal libraries; internally uses [`dnum`](https://github.com/bpierre/dnum) library to represent precise numbers as tuples in the form of `[value: bigint, decimals: number]`, allowing quick integration with libraries like `big.js`, `bignumber.js`, etc. without additional dependencies.

### Usage

```ts
import { rsi } from 'alloy'

const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
const result = rsi(data, { period: 4, decimals: 18 })
```

### Supported Indicators

Most common technical indicators are targeted for support, some are still being implemented.

<details>
<summary>Currently Supported Technical Indicators</summary>

#### Trend Indicators

- [x] Aroon Indicator
- [x] Balance of Power (BOP)
- [x] Chande Forecast Oscillator (CFO)
- [x] Commodity Channel Index (CCI)
- [x] Double Exponential Moving Average (DEMA)
- [x] Exponential Moving Average (EMA)
- [ ] Mass Index (MI)
- [ ] Moving Average Convergence Divergence (MACD)
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

#### Momentum Indicators

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

</details>
