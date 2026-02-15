# alloy

`alloy` 是一个提供各种技术分析指标的 JavaScript 库。

## 优势

- 完全的 TypeScript 支持
- 不限制 decimals 库的使用，内部使用 [`dnum`](https://github.com/bpierre/dnum) 库通过 `[value: bigint, decimals: number]` 的元组形式表示带精度的数值，无需引入额外的库即可快速接入如 `big.js`,`bignumber.js`等。

### 使用

```ts
import { rsi } from 'alloy'

const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
const result = rsi(data, { period: 4, decimals: 18 })
```

### 支持的指标

大多数常见的技术指标都在支持目标中，部分仍在实现中

<details>
<summary> 当前支持的技术指标 </summary>

#### 趋势指标

- [x] Aroon Indicator
- [ ] Balance of Power (BOP)
- [ ] Chande Forecast Oscillator (CFO)
- [ ] Community Channel Index (CCI)
- [ ] Double Exponential Moving Average (DEMA)
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

#### 动量指标

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
