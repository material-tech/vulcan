import type { Trade } from '@material-tech/vulcan-backtest'
import { describe, expect, it } from 'vitest'
import { computeStatistics } from '../src/statistics'

function makeTrade(pnl: number, overrides: Partial<Trade> = {}): Trade {
  return {
    side: 'long',
    entryPrice: 100,
    exitPrice: pnl >= 0 ? 100 + pnl : 100 + pnl,
    size: 1,
    quantity: 1,
    pnl,
    returnRate: pnl / 100,
    entryIndex: 0,
    exitIndex: 1,
    exitReason: 'signal',
    ...overrides,
  }
}

describe('computeStatistics — empty trades', () => {
  it('returns zeroed statistics for no trades', () => {
    const stats = computeStatistics([], [10000, 10000, 10000], 10000)

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
    const stats = computeStatistics(trades, [10000, 10500], 10000)

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
    const stats = computeStatistics(trades, [10000, 9700], 10000)

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
    const equityCurve = [10000, 10200, 10100, 10400, 10350]
    const stats = computeStatistics(trades, equityCurve, 10000)

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
    const equityCurve = [10000, 10500, 10200, 10000, 10300]
    const trades = [makeTrade(300)]
    const stats = computeStatistics(trades, equityCurve, 10000)

    expect(stats.maxDrawdownAmount).toBeCloseTo(500)
    expect(stats.maxDrawdown).toBeCloseTo(500 / 10500)
  })

  it('returns 0 drawdown for monotonically increasing curve', () => {
    const equityCurve = [10000, 10100, 10200, 10300]
    const trades = [makeTrade(300)]
    const stats = computeStatistics(trades, equityCurve, 10000)

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
    const equityCurve = [10000, 10100, 10300, 10350, 10250, 10050, 10350]
    const stats = computeStatistics(trades, equityCurve, 10000)

    expect(stats.maxConsecutiveWins).toBe(3)
    expect(stats.maxConsecutiveLosses).toBe(2)
  })
})

describe('computeStatistics — risk metrics', () => {
  it('computes non-zero Sharpe and Sortino for varied returns', () => {
    const equityCurve = [10000, 10100, 10050, 10200, 10150, 10300]
    const trades = [makeTrade(300)]
    const stats = computeStatistics(trades, equityCurve, 10000)

    expect(stats.sharpeRatio).not.toBe(0)
    expect(stats.sortinoRatio).not.toBe(0)
  })

  it('returns 0 for flat equity curve', () => {
    const equityCurve = [10000, 10000, 10000]
    const stats = computeStatistics([], equityCurve, 10000)

    expect(stats.sharpeRatio).toBe(0)
    expect(stats.sortinoRatio).toBe(0)
  })
})
