import { collect } from '@vulcan-js/core'
import { trueStrengthIndex, tsi } from '@vulcan-js/indicators'
import { describe, expect, it } from 'vitest'

describe('trueStrengthIndex (TSI)', () => {
  // Sample price data for testing
  const prices = [
    100,
    102,
    101,
    103,
    105,
    104,
    106,
    108,
    107,
    109,
    110,
    108,
    106,
    107,
    109,
    111,
    110,
    112,
    114,
    113,
    115,
    117,
    116,
    118,
    120,
    119,
    121,
    123,
    122,
    124,
    125,
    123,
    121,
    122,
    124,
    126,
    125,
    127,
    129,
    128,
    130,
    132,
    131,
    133,
    135,
    134,
    136,
    138,
    137,
    139,
  ]

  it('should calculate TSI with default parameters', () => {
    const result = collect(trueStrengthIndex(prices))

    // Should return results for all input values
    expect(result).toHaveLength(prices.length)

    // All results should have tsi and signal fields
    result.forEach((item) => {
      expect(item).toHaveProperty('tsi')
      expect(item).toHaveProperty('signal')
    })

    // TSI values should be within -100 to +100 range
    result.forEach((item) => {
      const tsiValue = item.tsi[0]
      expect(tsiValue).toBeGreaterThanOrEqual(-100n * 10n ** 18n)
      expect(tsiValue).toBeLessThanOrEqual(100n * 10n ** 18n)
    })
  })

  it('should calculate TSI with custom parameters', () => {
    const result = collect(trueStrengthIndex(prices, {
      longPeriod: 10,
      shortPeriod: 5,
      signalPeriod: 3,
    }))

    expect(result).toHaveLength(prices.length)

    result.forEach((item) => {
      expect(item).toHaveProperty('tsi')
      expect(item).toHaveProperty('signal')
    })
  })

  it('should return zero for first value (no price change)', () => {
    const result = collect(trueStrengthIndex([100, 101]))

    // First value should have zero TSI (no prior price to compare)
    expect(result[0].tsi[0]).toBe(0n)
    expect(result[0].signal[0]).toBe(0n)

    // Second value should have non-zero TSI
    expect(result[1].tsi[0]).not.toBe(0n)
  })

  it('should return empty array for empty input', () => {
    const result = collect(trueStrengthIndex([]))
    expect(result).toEqual([])
  })

  it('should produce consistent results with stateful processor', () => {
    const processor = trueStrengthIndex.create()

    const values: ReturnType<typeof processor>[] = []
    for (const price of prices) {
      const result = processor(price)
      values.push(result)
    }

    // Compare with generator results
    const genResults = collect(trueStrengthIndex(prices))
    expect(values).toEqual(genResults)
  })

  it('should identify bullish momentum in uptrend', () => {
    // Strong uptrend data
    const uptrendData = [
      100,
      102,
      104,
      106,
      108,
      110,
      112,
      114,
      116,
      118,
      120,
      122,
      124,
      126,
      128,
      130,
      132,
      134,
      136,
      138,
      140,
      142,
      144,
      146,
      148,
      150,
      152,
      154,
      156,
      158,
      160,
      162,
      164,
      166,
      168,
      170,
      172,
      174,
      176,
      178,
    ]

    const result = collect(trueStrengthIndex(uptrendData))
    const lastValue = result[result.length - 1]

    // In a strong uptrend, TSI should be positive
    expect(lastValue.tsi[0]).toBeGreaterThan(0n)
  })

  it('should identify bearish momentum in downtrend', () => {
    // Strong downtrend data
    const downtrendData = [
      180,
      178,
      176,
      174,
      172,
      170,
      168,
      166,
      164,
      162,
      160,
      158,
      156,
      154,
      152,
      150,
      148,
      146,
      144,
      142,
      140,
      138,
      136,
      134,
      132,
      130,
      128,
      126,
      124,
      122,
      120,
      118,
      116,
      114,
      112,
      110,
      108,
      106,
      104,
      102,
    ]

    const result = collect(trueStrengthIndex(downtrendData))
    const lastValue = result[result.length - 1]

    // In a strong downtrend, TSI should be negative
    expect(lastValue.tsi[0]).toBeLessThan(0n)
  })

  it('should calculate signal line as EMA of TSI', () => {
    const result = collect(trueStrengthIndex(prices))

    // Signal line should generally follow TSI with some lag
    // We just verify it exists and is within reasonable bounds
    result.forEach((item) => {
      const signalValue = item.signal[0]
      expect(signalValue).toBeGreaterThanOrEqual(-100n * 10n ** 18n)
      expect(signalValue).toBeLessThanOrEqual(100n * 10n ** 18n)
    })
  })

  it('should work with tsi alias', () => {
    const result1 = collect(tsi(prices))
    const result2 = collect(trueStrengthIndex(prices))

    expect(result1).toEqual(result2)
  })

  it('should handle sideways market (no clear trend)', () => {
    // Sideways market data (oscillating around same level)
    const sidewaysData = [
      100,
      102,
      99,
      101,
      98,
      100,
      97,
      99,
      96,
      98,
      95,
      97,
      94,
      96,
      93,
      95,
      92,
      94,
      91,
      93,
    ]

    const result = collect(trueStrengthIndex(sidewaysData))

    // All values should be within valid range
    result.forEach((item) => {
      const tsiValue = item.tsi[0]
      expect(tsiValue).toBeGreaterThanOrEqual(-100n * 10n ** 18n)
      expect(tsiValue).toBeLessThanOrEqual(100n * 10n ** 18n)
    })
  })

  it('should throw error for invalid parameters', () => {
    expect(() => trueStrengthIndex.create({ longPeriod: 0 })).toThrow(RangeError)
    expect(() => trueStrengthIndex.create({ shortPeriod: 0 })).toThrow(RangeError)
    expect(() => trueStrengthIndex.create({ signalPeriod: 0 })).toThrow(RangeError)
    expect(() => trueStrengthIndex.create({ longPeriod: -1 })).toThrow(RangeError)
    expect(() => trueStrengthIndex.create({ longPeriod: 1.5 as unknown as number })).toThrow(RangeError)
  })

  it('should handle single price value', () => {
    const result = collect(trueStrengthIndex([100]))

    expect(result).toHaveLength(1)
    expect(result[0].tsi[0]).toBe(0n)
    expect(result[0].signal[0]).toBe(0n)
  })
})
