# @vulcan-js/forge

All-in-one package that re-exports every [Vulcan](https://github.com/material-tech/vulcan) module — install once, import everything.

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
| [`@vulcan-js/core`](https://github.com/material-tech/vulcan/tree/main/packages/core) | Core types and utilities |
| [`@vulcan-js/indicators`](https://github.com/material-tech/vulcan/tree/main/packages/indicators) | Technical analysis indicators |
| [`@vulcan-js/strategies`](https://github.com/material-tech/vulcan/tree/main/packages/strategies) | Trading strategies |
| [`@vulcan-js/backtest`](https://github.com/material-tech/vulcan/tree/main/packages/backtest) | Backtesting engine |

## License

MIT
