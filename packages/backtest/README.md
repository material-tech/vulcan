# @vulcan-js/backtest

Backtesting engine for the [Vulcan](../../README.md) library, with position management, commission/slippage modeling, and comprehensive statistics.

## Installation

```bash
pnpm add @vulcan-js/backtest
```

## Usage

### Batch backtest

Run a complete backtest over historical data and get the final result:

```ts
import { backtest } from '@vulcan-js/backtest'
import { smaCross } from '@vulcan-js/strategies'

const candles = [
  { o: 100, h: 105, l: 99, c: 103, v: 1000 },
  { o: 103, h: 108, l: 102, c: 107, v: 1200 },
  // ...
]

const result = backtest(smaCross, candles, {
  initialCapital: 10_000,
  commissionRate: 0.001,
})

console.log(result.statistics.winRate)
console.log(result.finalEquity)
```

### Streaming backtest

Use `backtestStream()` for real-time or incremental processing — it yields a snapshot for each bar:

```ts
import { backtestStream } from '@vulcan-js/backtest'
import { smaCross } from '@vulcan-js/strategies'

for (const snapshot of backtestStream(smaCross, candles)) {
  console.log(snapshot.index, snapshot.totalEquity, snapshot.signal.action)
}
```

### Computing statistics separately

If you already have trades and an equity curve, compute statistics directly:

```ts
import { computeStatistics } from '@vulcan-js/backtest'

const stats = computeStatistics(trades, equityCurve, 10_000)
console.log(stats.sharpeRatio)
```

## API

### `backtest(strategy, data, options?, strategyOptions?)`

Runs a full backtest over the provided data. Automatically closes any open position at the end.

| Parameter | Type | Description |
| --- | --- | --- |
| `strategy` | `Strategy` | A strategy created with `createStrategy` |
| `data` | `Iterable<CandleData>` | Historical OHLCV candle data |
| `options` | `BacktestOptions` | Backtest configuration (optional) |
| `strategyOptions` | `Opts` | Strategy-specific options (optional) |

**Returns:** `BacktestResult`

### `backtestStream(strategy, data, options?, strategyOptions?)`

Generator that yields a `BacktestSnapshot` for each bar. Does not auto-close positions at the end.

**Returns:** `Generator<BacktestSnapshot>`

### `computeStatistics(trades, equityCurve, initialCapital)`

Computes statistics from closed trades and an equity curve.

| Parameter | Type | Description |
| --- | --- | --- |
| `trades` | `Trade[]` | Array of closed trades |
| `equityCurve` | `Dnum[]` | Equity value at each bar |
| `initialCapital` | `Numberish` | Starting capital |

**Returns:** `BacktestStatistics`

## Types

### `BacktestOptions`

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `initialCapital` | `Numberish` | `10000` | Starting capital |
| `commissionRate` | `number` | `0` | Commission rate (0–1) |
| `slippageRate` | `number` | `0` | Slippage rate (0–1) |
| `allowShort` | `boolean` | `true` | Whether short selling is allowed |

### `BacktestResult`

| Field | Type | Description |
| --- | --- | --- |
| `trades` | `Trade[]` | All closed trades |
| `statistics` | `BacktestStatistics` | Computed statistics |
| `equityCurve` | `Dnum[]` | Equity at each bar |
| `finalEquity` | `Dnum` | Final portfolio equity |

### `BacktestSnapshot`

Yielded by `backtestStream()` for each bar.

| Field | Type | Description |
| --- | --- | --- |
| `index` | `number` | Bar index |
| `bar` | `NormalizedBar` | Current OHLCV bar |
| `signal` | `StrategySignal` | Strategy signal for this bar |
| `position` | `Position \| null` | Current open position |
| `equity` | `Dnum` | Realized equity |
| `unrealizedPnl` | `Dnum` | Unrealized profit/loss |
| `totalEquity` | `Dnum` | Equity + unrealized P&L |
| `closedTrade` | `Trade \| null` | Trade closed on this bar, if any |

### `Trade`

| Field | Type | Description |
| --- | --- | --- |
| `side` | `'long' \| 'short'` | Trade direction |
| `entryPrice` | `Dnum` | Entry price |
| `exitPrice` | `Dnum` | Exit price (after slippage) |
| `size` | `number` | Position size fraction (0–1) |
| `quantity` | `Dnum` | Number of units traded |
| `pnl` | `Dnum` | Profit/loss (after commission) |
| `returnRate` | `Dnum` | Return rate |
| `entryIndex` | `number` | Entry bar index |
| `exitIndex` | `number` | Exit bar index |
| `exitReason` | `string` | `'signal'` \| `'stop_loss'` \| `'take_profit'` \| `'end_of_data'` |

### `Position`

| Field | Type | Description |
| --- | --- | --- |
| `side` | `'long' \| 'short'` | Position direction |
| `entryPrice` | `Dnum` | Entry price |
| `quantity` | `Dnum` | Number of units |
| `size` | `number` | Position size fraction (0–1) |
| `entryIndex` | `number` | Entry bar index |
| `stopLoss` | `Dnum?` | Stop-loss price (optional) |
| `takeProfit` | `Dnum?` | Take-profit price (optional) |

### `BacktestStatistics`

| Field | Type | Description |
| --- | --- | --- |
| `totalBars` | `number` | Total number of bars |
| `totalTrades` | `number` | Total closed trades |
| `winningTrades` | `number` | Number of winning trades |
| `losingTrades` | `number` | Number of losing trades |
| `winRate` | `number` | Win rate (0–1) |
| `netPnl` | `number` | Net profit/loss |
| `netReturn` | `number` | Net return rate |
| `grossProfit` | `number` | Total profit from winning trades |
| `grossLoss` | `number` | Total loss from losing trades |
| `profitFactor` | `number` | Gross profit / gross loss |
| `averageWin` | `number` | Average profit per winning trade |
| `averageLoss` | `number` | Average loss per losing trade |
| `payoffRatio` | `number` | Average win / average loss |
| `maxDrawdown` | `number` | Maximum drawdown rate |
| `maxDrawdownAmount` | `number` | Maximum drawdown amount |
| `sharpeRatio` | `number` | Annualized Sharpe ratio |
| `sortinoRatio` | `number` | Annualized Sortino ratio |
| `maxConsecutiveWins` | `number` | Longest winning streak |
| `maxConsecutiveLosses` | `number` | Longest losing streak |

## License

MIT
