import type { CandleData } from '@material-tech/alloy-core'
import { createStrategy, goldenCross } from '@material-tech/alloy-strategies'
import { describe, expect, it } from 'vitest'
import { backtest, backtestStream } from '../src/backtest'

/**
 * Deterministic "always long" strategy for testing.
 */
const alwaysLong = createStrategy(
  () => () => ({ action: 'long' as const }),
  { windowSize: 1 },
)

/**
 * Deterministic strategy: long on bar 0, close on bar 1, repeat.
 */
const alternating = createStrategy(
  () => (ctx) => {
    if (ctx.index % 2 === 0)
      return { action: 'long' as const }
    return { action: 'close' as const }
  },
  { windowSize: 1 },
)

function makeKline(c: number, o?: number, h?: number, l?: number): CandleData {
  return {
    o: o ?? c,
    h: h ?? c + 2,
    l: l ?? c - 2,
    c,
    v: 1000,
  }
}

describe('backtest — basic integration', () => {
  it('returns empty result for empty data', () => {
    const result = backtest(alwaysLong, [])

    expect(result.trades).toHaveLength(0)
    expect(result.equityCurve).toHaveLength(0)
    expect(result.finalEquity).toBe(10000)
    expect(result.statistics.totalBars).toBe(0)
    expect(result.statistics.totalTrades).toBe(0)
  })

  it('opens and auto-closes at end of data', () => {
    const data = [makeKline(100), makeKline(105), makeKline(110)]
    const result = backtest(alwaysLong, data)

    // alwaysLong opens on bar 0, holds through bars 1-2, auto-closes at end
    expect(result.trades).toHaveLength(1)
    expect(result.trades[0].exitReason).toBe('end_of_data')
    expect(result.trades[0].pnl).toBeCloseTo((110 - 100) * (10000 / 100))
    expect(result.finalEquity).toBeCloseTo(10000 + (110 - 100) * (10000 / 100))
  })

  it('handles alternating long/close strategy', () => {
    const data = [
      makeKline(100), // bar 0: long signal → open at 100
      makeKline(110), // bar 1: close signal → close at 110 (+10 per share)
      makeKline(105), // bar 2: long signal → open at 105
      makeKline(115), // bar 3: close signal → close at 115 (+10 per share)
    ]
    const result = backtest(alternating, data)

    expect(result.trades).toHaveLength(2)
    expect(result.trades[0].entryPrice).toBe(100)
    expect(result.trades[0].exitPrice).toBe(110)
    expect(result.trades[1].entryPrice).toBe(105)
    expect(result.trades[1].exitPrice).toBe(115)

    // All trades profitable
    expect(result.trades.every(t => t.pnl > 0)).toBe(true)
    expect(result.finalEquity).toBeGreaterThan(10000)
    expect(result.statistics.winRate).toBe(1)
  })

  it('respects commission rate', () => {
    const data = [makeKline(100), makeKline(110)]
    const noFee = backtest(alternating, data)
    const withFee = backtest(alternating, data, { commissionRate: 0.001 })

    expect(withFee.finalEquity).toBeLessThan(noFee.finalEquity)
  })

  it('respects slippage rate', () => {
    const data = [makeKline(100), makeKline(110)]
    const noSlip = backtest(alternating, data)
    const withSlip = backtest(alternating, data, { slippageRate: 0.01 })

    expect(withSlip.finalEquity).toBeLessThan(noSlip.finalEquity)
  })

  it('equity curve has same length as data', () => {
    const data = [makeKline(100), makeKline(105), makeKline(110), makeKline(108)]
    const result = backtest(alwaysLong, data)

    expect(result.equityCurve).toHaveLength(4)
  })
})

describe('backtest — no short allowed', () => {
  const alwaysShort = createStrategy(
    () => () => ({ action: 'short' as const }),
    { windowSize: 1 },
  )

  it('ignores short signals when allowShort is false', () => {
    const data = [makeKline(100), makeKline(90)]
    const result = backtest(alwaysShort, data, { allowShort: false })

    expect(result.trades).toHaveLength(0)
    expect(result.finalEquity).toBe(10000)
  })
})

describe('backtestStream', () => {
  it('yields correct number of snapshots', () => {
    const data = [makeKline(100), makeKline(105), makeKline(110)]
    const snapshots = [...backtestStream(alwaysLong, data)]

    expect(snapshots).toHaveLength(3)
  })

  it('tracks unrealized PnL correctly', () => {
    const data = [makeKline(100), makeKline(110)]
    const snapshots = [...backtestStream(alwaysLong, data)]

    // Bar 0: just opened, close = entry price → unrealizedPnl ≈ 0
    expect(snapshots[0].unrealizedPnl).toBeCloseTo(0)

    // Bar 1: price went up 10 → unrealizedPnl > 0
    expect(snapshots[1].unrealizedPnl).toBeGreaterThan(0)
    expect(snapshots[1].totalEquity).toBeCloseTo(snapshots[1].equity + snapshots[1].unrealizedPnl)
  })

  it('yields closedTrade when a trade closes', () => {
    const data = [makeKline(100), makeKline(110)]
    const snapshots = [...backtestStream(alternating, data)]

    expect(snapshots[0].closedTrade).toBeNull()
    expect(snapshots[1].closedTrade).not.toBeNull()
    expect(snapshots[1].closedTrade!.pnl).toBeGreaterThan(0)
  })

  it('does not auto-close at end of data', () => {
    const data = [makeKline(100), makeKline(110)]
    const snapshots = [...backtestStream(alwaysLong, data)]

    // Position should still be open at last snapshot
    expect(snapshots[1].position).not.toBeNull()
    // No closed trade on last bar (no auto-close)
    expect(snapshots[1].closedTrade).toBeNull()
  })
})

describe('backtest — smoke test with built-in strategy', () => {
  it('runs goldenCross strategy without errors', () => {
    // Generate enough data for SMA periods to warm up
    const data: CandleData[] = Array.from({ length: 250 }, (_, i) => ({
      o: 100 + Math.sin(i * 0.1) * 10,
      h: 105 + Math.sin(i * 0.1) * 10,
      l: 95 + Math.sin(i * 0.1) * 10,
      c: 102 + Math.sin(i * 0.1) * 10,
      v: 1000,
    }))

    const result = backtest(goldenCross, data)

    expect(result.equityCurve).toHaveLength(250)
    expect(result.finalEquity).toBeGreaterThan(0)
    expect(result.statistics.totalBars).toBe(250)
  })
})
