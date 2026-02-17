# Alloy

一个基于生成器流式架构的 TypeScript 技术分析指标库，使用高精度十进制运算。

## 特性

- **基于生成器的流式处理** — 通过标准迭代器逐点处理数据，天然支持 for-of 循环、管道和适配器的组合
- **高精度运算** — 基于 [`dnum`](https://github.com/bpierre/dnum)，以 `[value: bigint, decimals: number]` 元组表示数值 — 无浮点舍入误差
- **完整的 TypeScript 支持** — 所有指标、选项和输出均有严格类型定义
- **模块化包** — 按需选用：核心原语、指标或流式适配器

## 包结构

| 包名 | 说明 |
| --- | --- |
| [`@material-tech/alloy-core`](./packages/core/) | 核心类型（`CandleData`、`Processor`、`SignalGenerator`）及工具函数（`createSignal`、`collect`） |
| [`@material-tech/alloy-indicators`](./packages/indicators/) | 全部技术指标（趋势、动量、成交量） |
| [`@material-tech/alloy-strategies`](./packages/strategies/) | 可组合的交易策略，输出结构化信号 |
| [`@material-tech/alloy-backtest`](./packages/backtest/) | 回测引擎，含仓位管理和统计分析 |
| [`@material-tech/alloy-adapters`](./packages/adapters/) | 批处理、Node.js 流和 Web 流的适配器 |

## 安装

```bash
# 指标包（自动包含 core 依赖）
pnpm add @material-tech/alloy-indicators

# 适配器（可选）
pnpm add @material-tech/alloy-adapters
```

## 使用方式

### 基础用法 — 生成器迭代

每个指标都是生成器函数。传入可迭代数据源，遍历结果即可：

```ts
import { collect } from '@material-tech/alloy-core'
import { sma } from '@material-tech/alloy-indicators'

const prices = [10, 11, 12, 13, 14, 15]

// 收集所有结果为数组
const results = collect(sma(prices, { period: 3 }))

// 或惰性迭代
for (const value of sma(prices, { period: 3 })) {
  console.log(value) // Dnum 元组: [bigint, number]
}
```

### 有状态处理器 — 实时 / 流式场景

使用 `.create()` 获取有状态处理器，逐条喂入数据：

```ts
import { rsi } from '@material-tech/alloy-indicators'

const process = rsi.create({ period: 14 })

// 逐条喂入新价格
const result1 = process(100)
const result2 = process(102)
const result3 = process(98)
```

### 批处理适配器

```ts
import { batch } from '@material-tech/alloy-adapters/batch'
import { ema } from '@material-tech/alloy-indicators'

const batchEma = batch(ema)
const results = batchEma([10, 11, 12, 13, 14], { period: 3 })
// results: Dnum[]
```

### Node.js 流

```ts
import { toNodeStream } from '@material-tech/alloy-adapters/node-stream'
import { sma } from '@material-tech/alloy-indicators'

const transform = toNodeStream(sma, { period: 5 })
readable.pipe(transform).pipe(writable)
```

### Web 流

```ts
import { toWebStream } from '@material-tech/alloy-adapters/web-stream'
import { rsi } from '@material-tech/alloy-indicators'

const transform = toWebStream(rsi, { period: 14 })
readable.pipeThrough(transform).pipeTo(writable)
```

## 支持的指标

### 趋势指标

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

### 动量指标

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

### 成交量指标

- [x] Accumulation/Distribution (AD)

## License

MIT
