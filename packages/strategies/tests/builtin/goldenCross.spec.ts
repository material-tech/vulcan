import { collect } from '@material-tech/alloy-core'
import { goldenCross } from '@material-tech/alloy-strategies'
import { describe, expect, it } from 'vitest'

function bar(c: number) {
  return { h: c, l: c, o: c, c, v: 100 }
}

describe('goldenCross', () => {
  it('should have correct default options', () => {
    expect(goldenCross.defaultOptions).toEqual({
      windowSize: 2,
      fastPeriod: 50,
      slowPeriod: 200,
      stopLossPercent: 0.02,
    })
  })

  it('should emit hold when no crossover occurs', () => {
    // With period 2, both SMAs see the same data — no cross
    const bars = [bar(10), bar(10), bar(10)]
    const result = collect(goldenCross(bars, {
      fastPeriod: 2,
      slowPeriod: 2,
      windowSize: 2,
    }))

    expect(result.every(s => s.action === 'hold')).toBe(true)
  })

  it('should detect golden cross (fast crosses above slow)', () => {
    // Construct a scenario where fast SMA (period 2) crosses above slow SMA (period 4)
    // Start with declining prices so slow > fast, then prices jump up
    const bars = [
      bar(10),
      bar(9),
      bar(8),
      bar(7), // declining: slow SMA lags, fast follows
      bar(20),
      bar(25), // sharp rise: fast SMA jumps above slow
    ]

    const result = collect(goldenCross(bars, {
      fastPeriod: 2,
      slowPeriod: 4,
      windowSize: 2,
      stopLossPercent: 0.05,
    }))

    const longSignals = result.filter(s => s.action === 'long')
    expect(longSignals.length).toBeGreaterThanOrEqual(1)
    expect(longSignals[0].reason).toContain('Golden cross')
    expect(longSignals[0].stopLoss).toBeDefined()
  })

  it('should detect death cross (fast crosses below slow)', () => {
    // Start with rising prices, then sharp drop
    const bars = [
      bar(20),
      bar(22),
      bar(24),
      bar(26), // rising
      bar(10),
      bar(5), // sharp drop
    ]

    const result = collect(goldenCross(bars, {
      fastPeriod: 2,
      slowPeriod: 4,
      windowSize: 2,
      stopLossPercent: 0.03,
    }))

    const shortSignals = result.filter(s => s.action === 'short')
    expect(shortSignals.length).toBeGreaterThanOrEqual(1)
    expect(shortSignals[0].reason).toContain('Death cross')
    expect(shortSignals[0].stopLoss).toBeDefined()
  })

  it('should set correct stop-loss based on percentage', () => {
    const bars = [
      bar(10),
      bar(9),
      bar(8),
      bar(7),
      bar(20),
      bar(25),
    ]

    const result = collect(goldenCross(bars, {
      fastPeriod: 2,
      slowPeriod: 4,
      windowSize: 2,
      stopLossPercent: 0.05,
    }))

    const longSignal = result.find(s => s.action === 'long')
    if (longSignal && longSignal.stopLoss !== undefined) {
      // Stop loss should be entry price * (1 - 0.05)
      const entryPrice = Number(bars[result.indexOf(longSignal)].c)
      expect(longSignal.stopLoss).toBeCloseTo(entryPrice * 0.95, 2)
    }
  })

  it('should create independent processors via .create()', () => {
    const p1 = goldenCross.create({ fastPeriod: 2, slowPeriod: 3, windowSize: 2 })
    const p2 = goldenCross.create({ fastPeriod: 2, slowPeriod: 3, windowSize: 2 })

    const s1 = p1(bar(10))
    const s2 = p2(bar(10))

    expect(s1.action).toBe(s2.action)
  })
})
