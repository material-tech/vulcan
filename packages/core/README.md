# @material-tech/vulcan-core

Core types and utilities for the [Vulcan](../../README.md) technical analysis library.

## Installation

```bash
pnpm add @material-tech/vulcan-core
```

> **Note:** You typically don't need to install this package directly — it's included as a dependency of `@material-tech/vulcan-indicators`.

## API

### `createSignal(factory, defaultOptions?)`

Creates a generator-based indicator from a processor factory function.

Returns a `SignalGenerator` with:
- **Generator iteration** — `indicator(source, options?)` yields results one by one
- **`.create(options?)`** — returns a stateful `Processor` for point-by-point feeding
- **`.defaultOptions`** — the default options for the indicator

```ts
import { createSignal } from '@material-tech/vulcan-core'

const myIndicator = createSignal(
  (options) => {
    // Initialize state
    let sum = 0
    return (value: number) => {
      sum += value
      return sum
    }
  },
  { period: 14 },
)

// Use as generator
for (const result of myIndicator([1, 2, 3])) {
  console.log(result)
}

// Use as stateful processor
const process = myIndicator.create({ period: 10 })
process(1) // => 1
process(2) // => 3
```

### `collect(iterable)`

Collects all values from an iterable into an array.

```ts
import { collect } from '@material-tech/vulcan-core'
import { sma } from '@material-tech/vulcan-indicators'

const results = collect(sma([10, 11, 12, 13, 14], { period: 3 }))
```

### Types

| Type | Description |
| --- | --- |
| `Processor<Input, Output>` | Stateful function `(value: Input) => Output` |
| `SignalGenerator<Input, Output, Options>` | Generator function with `.create()` factory and `.defaultOptions` |
| `CandleData` | OHLCV candle data: `{ h, l, o, c, v, timestamp? }` |
| `RequiredProperties<T, K>` | Makes specified properties of `T` required |

## License

MIT
