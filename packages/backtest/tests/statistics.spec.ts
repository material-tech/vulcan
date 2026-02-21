import type { Trade } from '@material-tech/vulcan-backtest'
import type { Dnum } from 'dnum'
import { from } from 'dnum'
import { describe, expect, it } from 'vitest'
import { computeStatistics } from '../src/statistics'

function d(value: number): Dnum {
  return from(value, 18)
}

function makeTrade(pnl: number, overrides: Partial<Trade> = {}): Trade {
  return {
    side: 'long',
    entryPrice: d(100),
    exitPrice: d(100 + pnl),
    size: 1,
    quantity: d(1),
    pnl: d(pnl),
    returnRate: d(pnl / 100),
    entryIndex: 0,
    exitIndex: 1,
    exitReason: 'signal',
    ...overrides,
  }
}

describe('computeStatistics — empty trades', () => {
  it('returns zeroed statistics for no trades', () => {
    const stats = computeStatistics([], [d(10000), d(10000), d(10000)], d(10000))

    expect(stats.totalBars).toBe(3)
    expect(stats.totalTrades).toBe(0)
    expect(stats.winRate).toBe(0)
    expect(stats.netPnl).toBe(0)
    expect(stats.maxDrawdown).toBe(0)
    expect(stats.sharpeRatio).toBe(0)
  })
})

describe('computeStatistics — single trade', () => {
  it('computes stats for a single winning trade', () => {
    const trades = [makeTrade(500)]
    const stats = computeStatistics(trades, [d(10000), d(10500)], d(10000))

    expect(stats.totalTrades).toBe(1)
    expect(stats.winningTrades).toBe(1)
    expect(stats.losingTrades).toBe(0)
    expect(stats.winRate).toBe(1)
    expect(stats.netPnl).toBe(500)
    expect(stats.netReturn).toBeCloseTo(0.05)
    expect(stats.grossProfit).toBe(500)
    expect(stats.grossLoss).toBe(0)
    expect(stats.profitFactor).toBe(Infinity)
    expect(stats.averageWin).toBe(500)
    expect(stats.averageLoss).toBe(0)
    expect(stats.maxConsecutiveWins).toBe(1)
    expect(stats.maxConsecutiveLosses).toBe(0)
  })

  it('computes stats for a single losing trade', () => {
    const trades = [makeTrade(-300)]
    const stats = computeStatistics(trades, [d(10000), d(9700)], d(10000))

    expect(stats.totalTrades).toBe(1)
    expect(stats.winningTrades).toBe(0)
    expect(stats.losingTrades).toBe(1)
    expect(stats.winRate).toBe(0)
    expect(stats.netPnl).toBe(-300)
    expect(stats.grossProfit).toBe(0)
    expect(stats.grossLoss).toBe(300)
    expect(stats.profitFactor).toBe(0)
  })
})

describe('computeStatistics — mixed trades', () => {
  it('computes correct win rate and averages', () => {
    const trades = [
      makeTrade(200),
      makeTrade(-100),
      makeTrade(300),
      makeTrade(-50),
    ]
    const equityCurve = [d(10000), d(10200), d(10100), d(10400), d(10350)]
    const stats = computeStatistics(trades, equityCurve, d(10000))

    expect(stats.totalTrades).toBe(4)
    expect(stats.winningTrades).toBe(2)
    expect(stats.losingTrades).toBe(2)
    expect(stats.winRate).toBeCloseTo(0.5)
    expect(stats.netPnl).toBeCloseTo(350)
    expect(stats.grossProfit).toBeCloseTo(500)
    expect(stats.grossLoss).toBeCloseTo(150)
    expect(stats.profitFactor).toBeCloseTo(500 / 150)
    expect(stats.averageWin).toBeCloseTo(250)
    expect(stats.averageLoss).toBeCloseTo(75)
    expect(stats.payoffRatio).toBeCloseTo(250 / 75)
  })
})

describe('computeStatistics — max drawdown', () => {
  it('computes max drawdown from equity curve', () => {
    // Peak at 10500, trough at 10000 → drawdown = 500 (4.76%)
    const equityCurve = [d(10000), d(10500), d(10200), d(10000), d(10300)]
    const trades = [makeTrade(300)]
    const stats = computeStatistics(trades, equityCurve, d(10000))

    expect(stats.maxDrawdownAmount).toBeCloseTo(500)
    expect(stats.maxDrawdown).toBeCloseTo(500 / 10500)
  })

  it('returns 0 drawdown for monotonically increasing curve', () => {
    const equityCurve = [d(10000), d(10100), d(10200), d(10300)]
    const trades = [makeTrade(300)]
    const stats = computeStatistics(trades, equityCurve, d(10000))

    expect(stats.maxDrawdown).toBe(0)
    expect(stats.maxDrawdownAmount).toBe(0)
  })
})

describe('computeStatistics — streaks', () => {
  it('counts consecutive wins and losses', () => {
    const trades = [
      makeTrade(100),
      makeTrade(200),
      makeTrade(50),
      makeTrade(-100),
      makeTrade(-200),
      makeTrade(300),
    ]
    const equityCurve = [d(10000), d(10100), d(10300), d(10350), d(10250), d(10050), d(10350)]
    const stats = computeStatistics(trades, equityCurve, d(10000))

    expect(stats.maxConsecutiveWins).toBe(3)
    expect(stats.maxConsecutiveLosses).toBe(2)
  })
})

describe('computeStatistics — risk metrics', () => {
  it('computes non-zero Sharpe and Sortino for varied returns', () => {
    const equityCurve = [d(10000), d(10100), d(10050), d(10200), d(10150), d(10300)]
    const trades = [makeTrade(300)]
    const stats = computeStatistics(trades, equityCurve, d(10000))

    expect(stats.sharpeRatio).not.toBe(0)
    expect(stats.sortinoRatio).not.toBe(0)
  })

  it('returns 0 for flat equity curve', () => {
    const equityCurve = [d(10000), d(10000), d(10000)]
    const stats = computeStatistics([], equityCurve, d(10000))

    expect(stats.sharpeRatio).toBe(0)
    expect(stats.sortinoRatio).toBe(0)
  })
})
