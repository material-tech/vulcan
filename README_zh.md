# indicator-x

`indicator-x` 是一个提供各种库存技术分析指标，策略和交易的回测框架的 JavaScript 库。

## 优势

- 完全的 TypeScript 支持
- 不限制 decimals 库的使用，内部使用 [`dnum`](https://github.com/bpierre/dnum) 库通过 `[value: bigint, decimals: number]` 的元组形式表示带精度的数值，无需引入额外的库即可快速接入如 `big.js`,`bignumber.js`等。

### 使用

```ts
import { rsi } from 'indicator-x'

const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
const result = rsi(data, { period: 4, decimals: 18 })
```

### 支持的指标

大多数常见的技术指标都在支持目标中，部分仍在实现中

<details>
<summary> 已经支持的技术指标 </summary>

- [x] RSI
- [x] Stochastic Oscillator
- [ ] MACD
- [ ] KDJ
- [ ] BOLL
- [ ] MA

</details>

