# @material-tech/alloy-adapters

Stream and batch adapters for the [Alloy](../../README.md) technical analysis library. Bridges Alloy's generator-based indicators to common I/O patterns.

## Installation

```bash
pnpm add @material-tech/alloy-adapters
```

## Subpath Exports

Each adapter is available as a separate subpath export for tree-shaking:

```ts
import { batch } from '@material-tech/alloy-adapters/batch'
import { toNodeStream } from '@material-tech/alloy-adapters/node-stream'
import { toWebStream } from '@material-tech/alloy-adapters/web-stream'
```

## API

### Batch

Array-in, array-out processing.

#### `batch(indicator)`

Wraps an `SignalGenerator` to accept an array and return an array.

```ts
import { batch } from '@material-tech/alloy-adapters/batch'
import { ema } from '@material-tech/alloy-indicators'

const batchEma = batch(ema)
const results = batchEma([10, 11, 12, 13, 14], { period: 3 })
// results: Dnum[]
```

#### `batchProcess(processor, source)`

Processes an array through a `Processor`, returning a result array.

```ts
import { batchProcess } from '@material-tech/alloy-adapters/batch'
import { sma } from '@material-tech/alloy-indicators'

const processor = sma.create({ period: 3 })
const results = batchProcess(processor, [10, 11, 12, 13, 14])
```

### Node.js Streams

Node.js `Transform` streams in object mode.

#### `toNodeStream(indicator, options?)`

Creates a Transform stream from an `SignalGenerator`.

```ts
import { toNodeStream } from '@material-tech/alloy-adapters/node-stream'
import { sma } from '@material-tech/alloy-indicators'

const transform = toNodeStream(sma, { period: 5 })
readable.pipe(transform).pipe(writable)
```

#### `processorToNodeStream(processor)`

Creates a Transform stream from an existing `Processor`.

```ts
import { processorToNodeStream } from '@material-tech/alloy-adapters/node-stream'
import { ema } from '@material-tech/alloy-indicators'

const processor = ema.create({ period: 10 })
const transform = processorToNodeStream(processor)
```

### Web Streams

Standard Web `TransformStream` adapters.

#### `toWebStream(indicator, options?)`

Creates a `TransformStream` from an `SignalGenerator`.

```ts
import { toWebStream } from '@material-tech/alloy-adapters/web-stream'
import { rsi } from '@material-tech/alloy-indicators'

const transform = toWebStream(rsi, { period: 14 })
readable.pipeThrough(transform).pipeTo(writable)
```

#### `processorToWebStream(processor)`

Creates a `TransformStream` from an existing `Processor`.

```ts
import { processorToWebStream } from '@material-tech/alloy-adapters/web-stream'
import { rsi } from '@material-tech/alloy-indicators'

const processor = rsi.create({ period: 14 })
const transform = processorToWebStream(processor)
```

## License

MIT
