# Vulcan

一个基于生成器流式架构的 TypeScript 技术分析指标库，使用高精度十进制运算。

## 特性

- **基于生成器的流式处理** — 通过标准迭代器逐点处理数据，天然支持 for-of 循环和管道的组合
- **高精度运算** — 基于 [`dnum`](https://github.com/bpierre/dnum)，以 `[value: bigint, decimals: number]` 元组表示数值 — 无浮点舍入误差
- **完整的 TypeScript 支持** — 所有指标、选项和输出均有严格类型定义
- **模块化包** — 按需选用：核心原语、指标、策略或回测引擎

## 包结构

| 包名 | 说明 |
| --- | --- |
| [`@vulcan-js/core`](./packages/core/) | 核心类型（`CandleData`、`Processor`、`SignalGenerator`）及工具函数（`createSignal`、`collect`） |
| [`@vulcan-js/indicators`](./packages/indicators/) | 全部技术指标（趋势、动量、成交量） |
| [`@vulcan-js/strategies`](./packages/strategies/) | 可组合的交易策略，输出结构化信号 |
| [`@vulcan-js/backtest`](./packages/backtest/) | 回测引擎，含仓位管理和统计分析 |

## 安装

```bash
# 指标包（自动包含 core 依赖）
pnpm add @vulcan-js/indicators
```

## 使用方式

### 基础用法 — 生成器迭代

每个指标都是生成器函数。传入可迭代数据源，遍历结果即可：

```ts
import { collect } from '@vulcan-js/core'
import { sma } from '@vulcan-js/indicators'

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
import { rsi } from '@vulcan-js/indicators'

const process = rsi.create({ period: 14 })

// 逐条喂入新价格
const result1 = process(100)
const result2 = process(102)
const result3 = process(98)
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
- [x] Parabolic SAR (PSAR)
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
