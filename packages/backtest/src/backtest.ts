import type { BaseStrategyOptions, StrategyGenerator } from '@material-tech/vulcan-strategies'
import type { Dnum } from 'dnum'
import type { BacktestOptions, BacktestResult, BacktestSnapshot, CandleData, Position, Trade } from './types'
import { defu } from 'defu'
import { add, from, multiply, subtract } from 'dnum'
import { normalizeBar } from './convert'
import { closePositionAtEnd, updatePosition } from './position'
import { computeStatistics } from './statistics'

const ZERO: Dnum = from(0, 18)

const defaultBacktestOptions: BacktestOptions = {
  initialCapital: 10000,
  commissionRate: 0,
  slippageRate: 0,
  allowShort: true,
}

function computeUnrealizedPnl(position: Position | null, closePrice: Dnum): Dnum {
  if (!position)
    return ZERO
  const priceDiff = position.side === 'long'
    ? subtract(closePrice, position.entryPrice)
    : subtract(position.entryPrice, closePrice)
  return multiply(priceDiff, position.quantity, 18)
}

/**
 * Stream-based backtest — yields a snapshot for each bar.
 *
 * Accepts both sync and async iterables, enabling real-time data sources
 * such as WebSocket streams or async generators.
 *
 * Does NOT auto-close positions at end of data (caller decides).
 */
export async function* backtestStream<Opts extends BaseStrategyOptions>(
  strategy: StrategyGenerator<Opts>,
  data: AsyncIterable<CandleData> | Iterable<CandleData>,
  options?: Partial<BacktestOptions>,
  strategyOptions?: Partial<Opts>,
): AsyncGenerator<BacktestSnapshot, void, unknown> {
  const opts = defu(options, defaultBacktestOptions) as BacktestOptions
  const process = strategy.create(strategyOptions)

  let equity = from(opts.initialCapital, 18)
  let position: Position | null = null
  let index = 0

  for await (const kline of data) {
    const bar = normalizeBar(kline)
    const signal = process(kline)

    const update = updatePosition(position, signal, bar, index, equity, opts)

    if (update.closedTrade) {
      equity = add(equity, update.closedTrade.pnl)
    }
    position = update.position

    const unrealizedPnl = computeUnrealizedPnl(position, bar.c)

    yield {
      index,
      bar,
      signal,
      position,
      equity,
      unrealizedPnl,
      totalEquity: add(equity, unrealizedPnl),
      closedTrade: update.closedTrade,
    }

    index++
  }
}

/**
 * Batch backtest — processes all bars and returns the complete result.
 *
 * Auto-closes any open position at end of data (exitReason: 'end_of_data').
 */
export function backtest<Opts extends BaseStrategyOptions>(
  strategy: StrategyGenerator<Opts>,
  data: CandleData[],
  options?: Partial<BacktestOptions>,
  strategyOptions?: Partial<Opts>,
): BacktestResult {
  const opts = defu(options, defaultBacktestOptions) as BacktestOptions
  const process = strategy.create(strategyOptions)

  let equity = from(opts.initialCapital, 18)
  let position: Position | null = null
  const trades: Trade[] = []
  const equityCurve: Dnum[] = []

  for (let index = 0; index < data.length; index++) {
    const bar = normalizeBar(data[index])
    const signal = process(data[index])

    const update = updatePosition(position, signal, bar, index, equity, opts)

    if (update.closedTrade) {
      equity = add(equity, update.closedTrade.pnl)
      trades.push(update.closedTrade)
    }
    position = update.position

    const unrealizedPnl = computeUnrealizedPnl(position, bar.c)
    equityCurve.push(add(equity, unrealizedPnl))
  }

  // Auto-close open position at end of data
  if (position && data.length > 0) {
    const lastBar = normalizeBar(data[data.length - 1])
    const trade = closePositionAtEnd(position, lastBar, data.length - 1, opts)
    equity = add(equity, trade.pnl)
    trades.push(trade)
    equityCurve[equityCurve.length - 1] = equity
  }

  return {
    trades,
    statistics: computeStatistics(trades, equityCurve, from(opts.initialCapital, 18)),
    equityCurve,
    finalEquity: equity,
  }
}
