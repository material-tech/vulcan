import { collect } from '@vulcan/core'
import { rsiOversoldOverbought } from '@vulcan/strategies'
import { describe, expect, it } from 'vitest'

function bar(c: number) {
  return { h: c, l: c, o: c, c, v: 100 }
}

describe('rsiOversoldOverbought', () => {
  it('should have correct default options', () => {
    expect(rsiOversoldOverbought.defaultOptions).toEqual({
      windowSize: 2,
      period: 14,
      overboughtLevel: 70,
      oversoldLevel: 30,
    })
  })

  it('should emit hold when RSI stays in neutral zone', () => {
    // Flat prices after warmup — RSI stays at 100 (no loss) and never crosses thresholds
    // First we warm up with rising prices to get RSI stable, then flat prices
    const warmup = Array.from({ length: 10 }, (_, i) => bar(100 + i))
    const flat = Array.from({ length: 10 }, () => bar(110))
    const bars = [...warmup, ...flat]

    const result = collect(rsiOversoldOverbought(bars, {
      period: 5,
      overboughtLevel: 90,
      oversoldLevel: 10,
      windowSize: 2,
    }))

    // After warmup, RSI stays at 100 (all gains, no losses) — no crossover signals
    // Check that flat-price portion produces only hold
    const flatResults = result.slice(warmup.length)
    expect(flatResults.every(s => s.action === 'hold')).toBe(true)
  })

  it('should detect oversold reversal (long signal)', () => {
    // Create a scenario: prices drop sharply (RSI < 30), then recover (RSI > 30)
    const bars = [
      bar(100),
      bar(90),
      bar(80),
      bar(70),
      bar(60),
      bar(50), // sharp drop → RSI very low
      bar(55),
      bar(60),
      bar(65),
      bar(70), // recovery → RSI crosses back above 30
    ]

    const result = collect(rsiOversoldOverbought(bars, {
      period: 3,
      oversoldLevel: 30,
      overboughtLevel: 70,
      windowSize: 2,
    }))

    const longSignals = result.filter(s => s.action === 'long')
    expect(longSignals.length).toBeGreaterThanOrEqual(1)
    expect(longSignals[0].reason).toContain('oversold')
  })

  it('should detect overbought reversal (short signal)', () => {
    // Prices rise sharply (RSI > 70), then pull back (RSI < 70)
    const bars = [
      bar(50),
      bar(60),
      bar(70),
      bar(80),
      bar(90),
      bar(100), // sharp rise → RSI very high
      bar(95),
      bar(90),
      bar(85),
      bar(80), // pullback → RSI crosses below 70
    ]

    const result = collect(rsiOversoldOverbought(bars, {
      period: 3,
      oversoldLevel: 30,
      overboughtLevel: 70,
      windowSize: 2,
    }))

    const shortSignals = result.filter(s => s.action === 'short')
    expect(shortSignals.length).toBeGreaterThanOrEqual(1)
    expect(shortSignals[0].reason).toContain('overbought')
  })

  it('should create independent processors via .create()', () => {
    const p1 = rsiOversoldOverbought.create({ period: 5, windowSize: 2 })
    const p2 = rsiOversoldOverbought.create({ period: 5, windowSize: 2 })

    const signal1 = p1(bar(100))
    const signal2 = p2(bar(100))

    expect(signal1.action).toBe(signal2.action)
  })

  it('should accept custom overbought/oversold levels', () => {
    // Very tight levels: overbought=60, oversold=40
    const bars = [
      bar(100),
      bar(90),
      bar(80),
      bar(75), // drop
      bar(80),
      bar(85),
      bar(90), // recovery
    ]

    const result = collect(rsiOversoldOverbought(bars, {
      period: 3,
      oversoldLevel: 40,
      overboughtLevel: 60,
      windowSize: 2,
    }))

    // With tight levels, we should see signals more easily
    const actions = result.map(s => s.action)
    expect(actions).toContain('long')
  })
})
