import { collect } from '@vulcan-js/core'
import { zigZag } from '@vulcan-js/indicators'
import { describe, expect, it } from 'vitest'

describe('zigZag / ZigZag Indicator', () => {
  // A clear up-down-up price pattern with 5% deviation
  const candles = [
    { h: 105, l: 95, c: 100 },
    { h: 110, l: 100, c: 108 },
    { h: 115, l: 105, c: 112 },
    { h: 120, l: 110, c: 118 },
    { h: 118, l: 100, c: 102 }, // big drop — should trigger reversal
    { h: 100, l: 90, c: 92 },
    { h: 95, l: 85, c: 88 },
    { h: 110, l: 88, c: 108 }, // big bounce — should trigger reversal
    { h: 115, l: 105, c: 112 },
  ]

  it('should detect trend reversals with deviation=5', () => {
    const result = collect(zigZag(candles, { deviation: 5 }))

    expect(result).toHaveLength(9)

    // First bars should be uptrend with no pivot
    expect(result[0].trend).toBe('up')
    expect(result[0].pivot).toBeNull()

    // During uptrend, extreme tracks the highest high
    expect(result[3].trend).toBe('up')
    expect(result[3].extreme).toMatchNumber(120)

    // Bar 5 (big drop): should reverse to downtrend, confirming a high pivot
    const reversalDown = result.find(r => r.pivot?.type === 'high')
    expect(reversalDown).toBeDefined()
    expect(reversalDown!.trend).toBe('down')
    expect(reversalDown!.pivot!.price).toMatchNumber(120)

    // Later, a big bounce should reverse to uptrend, confirming a low pivot
    const reversalUp = result.find(r => r.pivot?.type === 'low')
    expect(reversalUp).toBeDefined()
    expect(reversalUp!.trend).toBe('up')
  })

  it('should track extreme values during trend', () => {
    const process = zigZag.create({ deviation: 10 })

    const r1 = process({ h: 100, l: 90 })
    expect(r1.trend).toBe('up')
    expect(r1.extreme).toMatchNumber(100)

    const r2 = process({ h: 110, l: 95 })
    expect(r2.trend).toBe('up')
    expect(r2.extreme).toMatchNumber(110)

    // Higher high should update extreme
    const r3 = process({ h: 120, l: 105 })
    expect(r3.extreme).toMatchNumber(120)
  })

  it('should work with .create() for stateful processing', () => {
    const process = zigZag.create({ deviation: 5 })

    const r1 = process({ h: 105, l: 95 })
    expect(r1.trend).toBe('up')
    expect(r1.pivot).toBeNull()

    const r2 = process({ h: 110, l: 100 })
    expect(r2.trend).toBe('up')
    expect(r2.pivot).toBeNull()
  })

  it('should not trigger reversal in a steady uptrend', () => {
    // Prices keep making new highs — no reversal check ever triggers
    const steadyUpCandles = [
      { h: 100, l: 98, c: 99 },
      { h: 102, l: 100, c: 101 },
      { h: 104, l: 102, c: 103 },
      { h: 106, l: 104, c: 105 },
      { h: 108, l: 106, c: 107 },
    ]

    const result = collect(zigZag(steadyUpCandles, { deviation: 10 }))

    // In a continuously rising market, no pivot should be confirmed
    for (const point of result) {
      expect(point.trend).toBe('up')
      expect(point.pivot).toBeNull()
    }
    // Extreme should track the highest high
    expect(result[4].extreme).toMatchNumber(108)
  })

  it('should trigger reversal with large deviation threshold', () => {
    const bigSwingCandles = [
      { h: 100, l: 90, c: 95 },
      { h: 110, l: 95, c: 105 },
      { h: 120, l: 100, c: 115 },
      { h: 115, l: 70, c: 75 }, // massive drop
      { h: 80, l: 60, c: 65 },
    ]

    const result = collect(zigZag(bigSwingCandles, { deviation: 20 }))

    // Should eventually detect a reversal with 20% deviation
    const hasReversal = result.some(r => r.pivot !== null)
    expect(hasReversal).toBe(true)
  })

  it('should throw RangeError for invalid deviation', () => {
    expect(() => zigZag.create({ deviation: 0 })).toThrow(RangeError)
    expect(() => zigZag.create({ deviation: -5 })).toThrow(RangeError)
    expect(() => zigZag.create({ deviation: 100 })).toThrow(RangeError)
    expect(() => zigZag.create({ deviation: 150 })).toThrow(RangeError)
  })

  it('should handle single candle input', () => {
    const result = collect(zigZag([{ h: 100, l: 90, c: 95 }], { deviation: 5 }))
    expect(result).toHaveLength(1)
    expect(result[0].trend).toBe('up')
    expect(result[0].pivot).toBeNull()
    expect(result[0].extreme).toMatchNumber(100)
  })

  it('should return empty array for empty input', () => {
    const result = collect(zigZag([]))
    expect(result).toEqual([])
  })

  it('should use default deviation of 5', () => {
    expect(zigZag.defaultOptions.deviation).toBe(5)
  })

  it('should export as zigZagIndicator alias', async () => {
    const mod = await import('@vulcan-js/indicators')
    expect(mod.zigZagIndicator).toBe(mod.zigZag)
  })

  it('should handle multiple reversals', () => {
    // Create a clear oscillating pattern
    const oscillating = [
      { h: 100, l: 90, c: 95 },
      { h: 110, l: 95, c: 108 },
      { h: 120, l: 105, c: 118 }, // peak
      { h: 112, l: 90, c: 92 }, // drop — reversal 1 (high pivot at 120)
      { h: 95, l: 80, c: 82 }, // continue down
      { h: 90, l: 70, c: 72 }, // trough
      { h: 110, l: 75, c: 108 }, // bounce — reversal 2 (low pivot)
      { h: 120, l: 100, c: 115 }, // continue up
    ]

    const result = collect(zigZag(oscillating, { deviation: 5 }))

    // Should have at least two reversals (one high pivot and one low pivot)
    const highPivots = result.filter(r => r.pivot?.type === 'high')
    const lowPivots = result.filter(r => r.pivot?.type === 'low')

    expect(highPivots.length).toBeGreaterThanOrEqual(1)
    expect(lowPivots.length).toBeGreaterThanOrEqual(1)
  })
})
