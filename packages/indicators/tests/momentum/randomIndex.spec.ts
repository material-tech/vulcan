import { collect } from '@vulcan-js/core'
import { kdj } from '@vulcan-js/indicators'
import { toNumber } from 'dnum'
import { describe, expect, it } from 'vitest'

describe('random Index (KDJ)', () => {
  it('should throw RangeError for invalid period', () => {
    expect(() => kdj.create({ period: 0, kPeriod: 3, dPeriod: 3 })).toThrow(RangeError)
    expect(() => kdj.create({ period: 9, kPeriod: 0, dPeriod: 3 })).toThrow(RangeError)
    expect(() => kdj.create({ period: 9, kPeriod: 3, dPeriod: 0 })).toThrow(RangeError)
  })

  it('should throw RangeError for non-integer period', () => {
    expect(() => kdj.create({ period: 1.5, kPeriod: 3, dPeriod: 3 })).toThrow(RangeError)
  })

  it('should return empty array for empty input', () => {
    const result = collect(kdj([]))
    expect(result).toEqual([])
  })

  it('should calculate KDJ with default options (9, 3, 3)', () => {
    const candles = [
      { h: 30.20, l: 29.41, c: 29.87 },
      { h: 30.28, l: 29.32, c: 30.24 },
      { h: 30.45, l: 29.96, c: 30.10 },
      { h: 29.35, l: 28.74, c: 28.90 },
      { h: 29.70, l: 28.56, c: 28.92 },
      { h: 30.65, l: 28.56, c: 30.61 },
      { h: 30.60, l: 29.49, c: 30.05 },
      { h: 30.76, l: 29.80, c: 30.19 },
      { h: 31.17, l: 30.13, c: 30.89 },
      { h: 30.54, l: 29.78, c: 30.04 },
      { h: 30.66, l: 29.77, c: 30.66 },
      { h: 31.12, l: 30.65, c: 30.96 },
      { h: 31.09, l: 30.43, c: 30.76 },
      { h: 31.47, l: 30.91, c: 31.21 },
    ]

    const result = collect(kdj(candles))

    // Manually calculate expected values:
    // Initial K=50, D=50
    // Bar 0: HighestHigh=30.20, LowestLow=29.41
    //   RSV = (29.87-29.41)/(30.20-29.41)*100 = 0.46/0.79*100 = 58.23
    //   K = 2/3*50 + 1/3*58.23 = 52.74
    //   D = 2/3*50 + 1/3*52.74 = 50.91
    //   J = 3*52.74 - 2*50.91 = 56.40

    // Verify with processor-style as well
    const process = kdj.create()
    const p0 = process(candles[0])
    expect(p0.k).toMatchNumber(52.74)
    expect(p0.d).toMatchNumber(50.91)
    expect(p0.j).toMatchNumber(56.40)

    // Verify the generator produces the same length
    expect(result.length).toBe(candles.length)
  })

  it('should handle range of zero (all same price)', () => {
    const candles = [
      { h: 100, l: 100, c: 100 },
      { h: 100, l: 100, c: 100 },
      { h: 100, l: 100, c: 100 },
    ]

    const result = collect(kdj(candles))

    // When range is 0, RSV = 0
    // Bar 0: K = 2/3*50 + 1/3*0 = 33.33, D = 2/3*50 + 1/3*33.33 = 44.44
    // J = 3*33.33 - 2*44.44 = 11.11
    expect(result[0].k).toMatchNumber(33.33)
    expect(result[0].d).toMatchNumber(44.44)
    expect(result[0].j).toMatchNumber(11.11)
  })

  it('should accept a non-array iterable source', () => {
    const candles = [
      { h: 30.20, l: 29.41, c: 29.87 },
      { h: 30.28, l: 29.32, c: 30.24 },
      { h: 30.45, l: 29.96, c: 30.10 },
      { h: 29.35, l: 28.74, c: 28.90 },
      { h: 29.70, l: 28.56, c: 28.92 },
    ]

    function* iterableSource() {
      yield* candles
    }

    const fromArray = collect(kdj(candles))
    const fromIterable = collect(kdj(iterableSource()))

    expect(fromIterable.length).toBe(fromArray.length)
    expect(fromIterable.map(p => toNumber(p.k, 4)))
      .toEqual(fromArray.map(p => toNumber(p.k, 4)))
  })

  it('should calculate J values that can exceed 100 or be below 0', () => {
    // Strong uptrend to push J above 100
    const candles = [
      { h: 10, l: 5, c: 6 },
      { h: 10, l: 5, c: 7 },
      { h: 10, l: 5, c: 10 },
      { h: 12, l: 5, c: 12 },
      { h: 15, l: 5, c: 15 },
    ]

    const result = collect(kdj(candles, { period: 3, kPeriod: 3, dPeriod: 3 }))
    const jValues = result.map(p => toNumber(p.j, 2))

    // J can go above 100 in strong uptrends
    expect(jValues.some(j => j > 100)).toBe(true)
  })

  it('should work with stateful processor via .create()', () => {
    const process = kdj.create({ period: 5, kPeriod: 3, dPeriod: 3 })

    const r1 = process({ h: 30.20, l: 29.41, c: 29.87 })
    expect(r1.k).toMatchNumber(52.74)

    const r2 = process({ h: 30.28, l: 29.32, c: 30.24 })
    expect(r2.k).toMatchNumber(67.11)
  })

  it('should work with period of 1', () => {
    const candles = [
      { h: 20, l: 10, c: 15 },
      { h: 25, l: 15, c: 20 },
    ]

    const result = collect(kdj(candles, { period: 1, kPeriod: 3, dPeriod: 3 }))

    // period=1: HighestHigh=H, LowestLow=L for each bar
    // Bar 0: RSV = (15-10)/(20-10)*100 = 50
    //   K = 2/3*50 + 1/3*50 = 50
    //   D = 2/3*50 + 1/3*50 = 50
    //   J = 3*50 - 2*50 = 50
    expect(result[0].k).toMatchNumber(50)
    expect(result[0].d).toMatchNumber(50)
    expect(result[0].j).toMatchNumber(50)

    // Bar 1: RSV = (20-15)/(25-15)*100 = 50
    //   K = 2/3*50 + 1/3*50 = 50
    //   D = 2/3*50 + 1/3*50 = 50
    //   J = 50
    expect(result[1].k).toMatchNumber(50)
    expect(result[1].d).toMatchNumber(50)
    expect(result[1].j).toMatchNumber(50)
  })
})
