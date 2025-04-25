# indicator-x

`indicator-x` is a JavaScript library that provides various technical analysis indicators, strategies, and a backtesting framework for trading.

## Advantages

- Full TypeScript support
- No limitation on decimal libraries; internally uses [`dnum`](https://github.com/bpierre/dnum) library to represent precise numbers as tuples in the form of `[value: bigint, decimals: number]`, allowing quick integration with libraries like `big.js`, `bignumber.js`, etc. without additional dependencies.

### Usage

```ts
import { rsi } from 'indicator-x'

const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
const result = rsi(data, { period: 4, decimals: 18 })
```

### Supported Indicators

Most common technical indicators are targeted for support, some are still being implemented.

<details>
<summary>Currently Supported Technical Indicators</summary>

- [x] RSI
- [x] Stochastic Oscillator
- [ ] MACD
- [ ] KDJ
- [ ] BOLL
- [ ] MA

</details>


