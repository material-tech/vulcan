# @vulcan-js/forge

All-in-one package that re-exports every [Vulcan](../../README.md) module — install once, import everything.

## Installation

```bash
pnpm add @vulcan-js/forge
```

## Usage

```ts
// Everything available from a single import
import { backtest, collect, createStrategy, rsi, sma } from '@vulcan-js/forge'
```

## Included Packages

| Package | Description |
| --- | --- |
| [`@vulcan-js/core`](../core/) | Core types and utilities |
| [`@vulcan-js/indicators`](../indicators/) | Technical analysis indicators |
| [`@vulcan-js/strategies`](../strategies/) | Trading strategies |
| [`@vulcan-js/backtest`](../backtest/) | Backtesting engine |

## License

MIT
