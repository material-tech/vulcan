/**
 * Backtest example — batch backtest with statistics and streaming backtest.
 *
 * Run:  pnpm --filter @vulcan-js/example run backtest
 */

import { backtest, backtestStream, goldenCross, rsiOversoldOverbought } from '@vulcan-js/forge'
import { toNumber } from 'dnum'
import { generateCandles, sampleCandles } from './data'

// ---------------------------------------------------------------------------
// 1. Batch backtest — Golden Cross on sample data
// ---------------------------------------------------------------------------

console.log('=== Batch Backtest: Golden Cross ===')

const gcResult = backtest(
  goldenCross,
  sampleCandles,
  { initialCapital: 10_000, commissionRate: 0.001 },
  { fastPeriod: 5, slowPeriod: 15, stopLossPercent: 0.03 },
)

console.log(`Final equity : ${toNumber(gcResult.finalEquity, 2)}`)
console.log(`Total trades : ${gcResult.statistics.totalTrades}`)
console.log(`Win rate     : ${(gcResult.statistics.winRate * 100).toFixed(1)}%`)
console.log(`Net P&L      : ${gcResult.statistics.netPnl.toFixed(2)}`)
console.log(`Max drawdown : ${(gcResult.statistics.maxDrawdown * 100).toFixed(2)}%`)
console.log(`Sharpe ratio : ${gcResult.statistics.sharpeRatio.toFixed(2)}`)

if (gcResult.trades.length > 0) {
  console.log('\nTrades:')
  for (const trade of gcResult.trades) {
    console.log(
      `  ${trade.side.padEnd(5)} | `
      + `entry ${toNumber(trade.entryPrice, 2)} → exit ${toNumber(trade.exitPrice, 2)} | `
      + `P&L ${toNumber(trade.pnl, 2)} | `
      + `${trade.exitReason}`,
    )
  }
}

console.log()

// ---------------------------------------------------------------------------
// 2. Batch backtest — RSI strategy on larger random data
// ---------------------------------------------------------------------------

console.log('=== Batch Backtest: RSI Oversold/Overbought ===')

const randomCandles = generateCandles(500, 100)

const rsiResult = backtest(
  rsiOversoldOverbought,
  randomCandles,
  { initialCapital: 10_000, commissionRate: 0.001, slippageRate: 0.0005 },
  { period: 14, overboughtLevel: 70, oversoldLevel: 30 },
)

console.log(`Final equity       : ${toNumber(rsiResult.finalEquity, 2)}`)
console.log(`Total trades       : ${rsiResult.statistics.totalTrades}`)
console.log(`Win rate           : ${(rsiResult.statistics.winRate * 100).toFixed(1)}%`)
console.log(`Net return         : ${(rsiResult.statistics.netReturn * 100).toFixed(2)}%`)
console.log(`Profit factor      : ${rsiResult.statistics.profitFactor.toFixed(2)}`)
console.log(`Max drawdown       : ${(rsiResult.statistics.maxDrawdown * 100).toFixed(2)}%`)
console.log(`Sharpe ratio       : ${rsiResult.statistics.sharpeRatio.toFixed(2)}`)
console.log(`Sortino ratio      : ${rsiResult.statistics.sortinoRatio.toFixed(2)}`)
console.log(`Max consec. wins   : ${rsiResult.statistics.maxConsecutiveWins}`)
console.log(`Max consec. losses : ${rsiResult.statistics.maxConsecutiveLosses}`)

console.log()

// ---------------------------------------------------------------------------
// 3. Streaming backtest — process bars one by one
// ---------------------------------------------------------------------------

console.log('=== Streaming Backtest ===')

async function runStreamBacktest() {
  let lastSnapshot = null

  for await (const snapshot of backtestStream(goldenCross, sampleCandles, {
    initialCapital: 10_000,
  }, {
    fastPeriod: 5,
    slowPeriod: 15,
  })) {
    if (snapshot.signal.action !== 'hold') {
      console.log(
        `Bar ${snapshot.index}: ${snapshot.signal.action.toUpperCase()} | `
        + `Equity: ${toNumber(snapshot.totalEquity, 2)}`,
      )
    }
    if (snapshot.closedTrade) {
      console.log(
        `  Trade closed: P&L ${toNumber(snapshot.closedTrade.pnl, 2)} `
        + `(${snapshot.closedTrade.exitReason})`,
      )
    }
    lastSnapshot = snapshot
  }

  if (lastSnapshot) {
    console.log(`\nFinal equity: ${toNumber(lastSnapshot.totalEquity, 2)}`)
  }
}

await runStreamBacktest()
