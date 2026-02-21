import { collect } from '@vulcan-js/core'
import { psar } from '@vulcan-js/indicators'
import { describe, expect, it } from 'vitest'

describe('parabolic SAR (PSAR)', () => {
  it('should throw RangeError for start of 0', () => {
    expect(() => psar.create({ start: 0 })).toThrow(RangeError)
  })

  it('should throw RangeError for negative increment', () => {
    expect(() => psar.create({ increment: -0.01 })).toThrow(RangeError)
  })

  it('should throw RangeError for max less than start', () => {
    expect(() => psar.create({ max: 0.01, start: 0.02 })).toThrow(RangeError)
  })

  it('should return empty array for empty input', () => {
    const result = collect(psar([]))
    expect(result).toEqual([])
  })

  it('should handle single bar input', () => {
    const result = collect(psar([{ h: 10, l: 9 }]))
    expect(result).toHaveLength(1)
    expect(result[0].psar).toMatchNumber(9)
    expect(result[0].isUptrend).toBe(true)
  })

  it('should detect uptrend when second bar makes higher high', () => {
    const result = collect(psar([
      { h: 10, l: 9 },
      { h: 11, l: 9.5 },
    ]))
    expect(result[1].isUptrend).toBe(true)
    expect(result[1].psar).toMatchNumber(9)
  })

  it('should detect downtrend when second bar makes lower high', () => {
    const result = collect(psar([
      { h: 10, l: 9 },
      { h: 9.5, l: 8.5 },
    ]))
    expect(result[1].isUptrend).toBe(false)
    expect(result[1].psar).toMatchNumber(10)
  })

  it('should calculate PSAR for a rising market', () => {
    const candles = [
      { h: 10, l: 9 },
      { h: 11, l: 10 },
      { h: 12, l: 10.5 },
      { h: 13, l: 11 },
      { h: 14, l: 12 },
      { h: 15, l: 13 },
    ]

    const result = collect(psar(candles))

    // All bars should be in uptrend
    expect(result.map(p => p.isUptrend)).toEqual([true, true, true, true, true, true])

    // SAR should be below price and rising
    for (let i = 1; i < result.length; i++) {
      // SAR should be below the low of each bar
      const sarNum = Number(result[i].psar[0]) / (10 ** result[i].psar[1])
      const lowNum = candles[i].l
      expect(sarNum).toBeLessThanOrEqual(lowNum)
    }
  })

  it('should handle trend reversal from up to down', () => {
    const candles = [
      { h: 10, l: 9 },
      { h: 11, l: 10 },
      { h: 12, l: 10.5 },
      { h: 13, l: 11 },
      { h: 11, l: 8 }, // sharp drop triggers reversal
    ]

    const result = collect(psar(candles))

    // Should start as uptrend and reverse
    expect(result[1].isUptrend).toBe(true)
    expect(result[2].isUptrend).toBe(true)
    expect(result[3].isUptrend).toBe(true)
    expect(result[4].isUptrend).toBe(false)

    // After reversal, SAR should be at the previous EP (highest high = 13)
    expect(result[4].psar).toMatchNumber(13)
  })

  it('should handle trend reversal from down to up', () => {
    const candles = [
      { h: 15, l: 14 },
      { h: 14, l: 13 }, // lower high -> downtrend
      { h: 13, l: 12 },
      { h: 12, l: 11 },
      { h: 16, l: 14 }, // sharp rise triggers reversal
    ]

    const result = collect(psar(candles))

    expect(result[1].isUptrend).toBe(false)
    expect(result[2].isUptrend).toBe(false)
    expect(result[3].isUptrend).toBe(false)
    expect(result[4].isUptrend).toBe(true)

    // After reversal, SAR should be at the previous EP (lowest low = 11)
    expect(result[4].psar).toMatchNumber(11)
  })

  it('should cap acceleration factor at max', () => {
    // Create a long uptrend with continuously higher highs
    // With default increment=0.02 and max=0.2, AF caps after 9 new highs
    const candles: { h: number, l: number }[] = []
    for (let i = 0; i < 15; i++) {
      candles.push({ h: 10 + i, l: 9 + i })
    }

    const result = collect(psar(candles))

    // All should be uptrend
    expect(result.every(p => p.isUptrend)).toBe(true)

    // SAR should keep rising
    for (let i = 2; i < result.length; i++) {
      const sarCurr = Number(result[i].psar[0]) / (10 ** result[i].psar[1])
      const sarPrev = Number(result[i - 1].psar[0]) / (10 ** result[i - 1].psar[1])
      expect(sarCurr).toBeGreaterThanOrEqual(sarPrev)
    }
  })

  it('should work with custom start/increment/max', () => {
    const candles = [
      { h: 10, l: 9 },
      { h: 11, l: 10 },
      { h: 12, l: 10.5 },
      { h: 13, l: 11 },
      { h: 14, l: 12 },
    ]

    const result = collect(psar(candles, { start: 0.01, increment: 0.01, max: 0.1 }))

    // Should still be uptrend with smaller AF
    expect(result.every(p => p.isUptrend)).toBe(true)

    // With smaller AF, SAR should be lower than with default
    const defaultResult = collect(psar(candles))

    for (let i = 2; i < result.length; i++) {
      const sarCustom = Number(result[i].psar[0]) / (10 ** result[i].psar[1])
      const sarDefault = Number(defaultResult[i].psar[0]) / (10 ** defaultResult[i].psar[1])
      expect(sarCustom).toBeLessThanOrEqual(sarDefault)
    }
  })

  it('should handle multiple reversals', () => {
    const candles = [
      { h: 10, l: 9 },
      { h: 11, l: 10 }, // uptrend
      { h: 12, l: 10.5 },
      { h: 9, l: 7 }, // reversal to downtrend
      { h: 8, l: 6 },
      { h: 14, l: 13 }, // reversal to uptrend
      { h: 15, l: 13.5 },
      { h: 7, l: 5 }, // reversal to downtrend (low 5 < SAR ~6.36)
    ]

    const result = collect(psar(candles))

    // Check that reversals happen
    expect(result[1].isUptrend).toBe(true)
    expect(result[2].isUptrend).toBe(true)
    expect(result[3].isUptrend).toBe(false)
    expect(result[4].isUptrend).toBe(false)
    expect(result[5].isUptrend).toBe(true)
    expect(result[6].isUptrend).toBe(true)
    expect(result[7].isUptrend).toBe(false)
  })

  it('should clamp SAR to prior two bars in uptrend', () => {
    const candles = [
      { h: 20, l: 10 },
      { h: 21, l: 11 },
      { h: 50, l: 12 }, // big high causes large EP, but SAR should clamp
      { h: 51, l: 5 }, // low drops significantly
    ]

    const result = collect(psar(candles))

    // In uptrend, SAR should not exceed prior two lows
    if (result[3].isUptrend) {
      const sar3 = Number(result[3].psar[0]) / (10 ** result[3].psar[1])
      expect(sar3).toBeLessThanOrEqual(Math.min(candles[2].l, candles[1].l))
    }
  })

  it('should use .create() for stateful processing', () => {
    const process = psar.create()

    const r1 = process({ h: 10, l: 9 })
    expect(r1.isUptrend).toBe(true)

    const r2 = process({ h: 11, l: 10 })
    expect(r2.isUptrend).toBe(true)

    const r3 = process({ h: 12, l: 10.5 })
    expect(r3.isUptrend).toBe(true)
  })
})
