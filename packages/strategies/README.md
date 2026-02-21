# @vulcan/strategies

Composable trading strategies for the [Vulcan](../../README.md) library. Combines multiple indicators into structured signal output with position management.

## Installation

```bash
pnpm add @vulcan/strategies
```

## Usage

### Built-in strategies

Every strategy is a generator function (just like indicators). Pass OHLCV bars and iterate over signals:

```ts
import { collect } from '@vulcan/core'
import { goldenCross } from '@vulcan/strategies'

const bars = [
  { o: 10, h: 12, l: 9, c: 11, v: 1000 },
  { o: 11, h: 13, l: 10, c: 12, v: 1200 },
  // ...
]

// Collect all signals
const signals = collect(goldenCross(bars, { fastPeriod: 10, slowPeriod: 30 }))

// Or iterate lazily
for (const signal of goldenCross(bars)) {
  console.log(signal.action) // 'long' | 'short' | 'close' | 'hold'
  console.log(signal.reason) // human-readable explanation
}
```

Use `.create()` for real-time / streaming scenarios:

```ts
import { goldenCross } from '@vulcan/strategies'

const process = goldenCross.create({ fastPeriod: 10, slowPeriod: 30 })

// Feed bars one by one
const signal = process({ o: 10, h: 12, l: 9, c: 11, v: 1000 })
```

### Custom strategies

Use `createStrategy` to build your own strategy. It mirrors `createSignal` from core, but adds a rolling window of historical bars and structured signal output:

```ts
import { ema } from '@vulcan/indicators'
import { createStrategy } from '@vulcan/strategies'

const myStrategy = createStrategy(
  ({ emaPeriod, threshold }) => {
    const emaProc = ema.create({ period: emaPeriod })

    return (ctx) => {
      const price = ctx.bar.c
      const emaValue = emaProc(price)

      // Access historical bars via ctx.bars (oldest first)
      // Access current bar index via ctx.index

      return { action: 'hold' }
    }
  },
  { windowSize: 10, emaPeriod: 20, threshold: 0.05 },
)
```

## API

### `createStrategy(factory, defaultOptions)`

Creates a generator-based strategy from a factory function.

Returns a `StrategyGenerator` with:
- **Generator iteration** — `strategy(source, options?)` yields `StrategySignal` for each bar
- **`.create(options?)`** — returns a stateful `Processor<CandleData, StrategySignal>` for point-by-point feeding
- **`.defaultOptions`** — the default options for the strategy

The factory receives resolved options and returns a function `(ctx: StrategyContext) => StrategySignal`. The `StrategyContext` provides:

| Property | Type | Description |
| --- | --- | --- |
| `bar` | `CandleData` | The current OHLCV bar |
| `bars` | `readonly CandleData[]` | Rolling window of historical bars (oldest first, includes current bar) |
| `index` | `number` | Zero-based index of the current bar since the strategy started |

### `StrategySignal`

| Property | Type | Description |
| --- | --- | --- |
| `action` | `'long' \| 'short' \| 'close' \| 'hold'` | The recommended action |
| `size?` | `number` | Position size as a fraction (0–1) |
| `stopLoss?` | `number` | Stop-loss price level |
| `takeProfit?` | `number` | Take-profit price level |
| `reason?` | `string` | Human-readable reason for the signal |

### `BaseStrategyOptions`

All strategy options must extend `BaseStrategyOptions`:

| Property | Type | Description |
| --- | --- | --- |
| `windowSize` | `number` | Number of historical bars to keep in the rolling window |

## Built-in Strategies

| Strategy | Function | Alias | Description |
| --- | --- | --- | --- |
| Golden Cross / Death Cross | `goldenCross` | `goldenCrossStrategy` | Detects fast SMA crossing above/below slow SMA |
| RSI Oversold/Overbought | `rsiOversoldOverbought` | `rsiOversoldOverboughtStrategy` | Detects RSI crossing oversold/overbought levels |

### Golden Cross

Detects when a fast SMA crosses above (golden cross) or below (death cross) a slow SMA. Includes stop-loss based on a configurable percentage.

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `fastPeriod` | `number` | `50` | Fast SMA period |
| `slowPeriod` | `number` | `200` | Slow SMA period |
| `stopLossPercent` | `number` | `0.02` | Stop-loss percentage (0–1) |
| `windowSize` | `number` | `2` | Rolling window size |

### RSI Oversold/Overbought

Uses the Relative Strength Index to detect oversold and overbought reversal conditions.

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `period` | `number` | `14` | RSI calculation period |
| `overboughtLevel` | `number` | `70` | RSI level considered overbought |
| `oversoldLevel` | `number` | `30` | RSI level considered oversold |
| `windowSize` | `number` | `2` | Rolling window size |

## License

MIT
