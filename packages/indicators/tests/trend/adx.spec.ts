import { collect } from '@vulcan-js/core'
import { adx } from '@vulcan-js/indicators'
import { describe, expect, it } from 'vitest'

describe('adx / Average Directional Index (ADX/DMI)', () => {
  const candles = [
    { h: 10, l: 8, c: 9 },
    { h: 11, l: 9, c: 10 },
    { h: 12, l: 10, c: 11 },
    { h: 11, l: 9, c: 10 },
    { h: 13, l: 10, c: 12 },
    { h: 14, l: 11, c: 13 },
    { h: 12, l: 9, c: 10 },
  ]

  it('should calculate ADX, +DI, and -DI with period=3', () => {
    const result = collect(adx(candles, { period: 3 }))

    expect(result).toHaveLength(7)

    // First bar: no previous data, all zeros
    expect(result[0].adx).toMatchNumber(0)
    expect(result[0].pdi).toMatchNumber(0)
    expect(result[0].mdi).toMatchNumber(0)

    expect(result.slice(1).map(p => p.pdi)).toMatchNumberArray([50, 50, 33.33, 47.62, 42.03, 23.58])
    expect(result.slice(1).map(p => p.mdi)).toMatchNumberArray([0, 0, 16.67, 9.52, 5.80, 25.20])
    expect(result.slice(1).map(p => p.adx)).toMatchNumberArray([100, 100, 77.78, 74.07, 74.64, 50.87])
  })

  it('should calculate with period=2', () => {
    const result = collect(adx(candles.slice(0, 5), { period: 2 }))

    expect(result).toHaveLength(5)
    expect(result[0].adx).toMatchNumber(0)
    expect(result[0].pdi).toMatchNumber(0)
    expect(result[0].mdi).toMatchNumber(0)
  })

  it('should work with .create() for stateful processing', () => {
    const process = adx.create({ period: 3 })

    const r1 = process({ h: 10, l: 8, c: 9 })
    expect(r1.adx).toMatchNumber(0)
    expect(r1.pdi).toMatchNumber(0)
    expect(r1.mdi).toMatchNumber(0)

    const r2 = process({ h: 11, l: 9, c: 10 })
    expect(r2.pdi).toMatchNumber(50)
    expect(r2.mdi).toMatchNumber(0)
    expect(r2.adx).toMatchNumber(100)

    const r3 = process({ h: 12, l: 10, c: 11 })
    expect(r3.pdi).toMatchNumber(50)
    expect(r3.mdi).toMatchNumber(0)
  })

  it('should throw RangeError for invalid period', () => {
    expect(() => adx.create({ period: 0 })).toThrow(RangeError)
    expect(() => adx.create({ period: -1 })).toThrow(RangeError)
    expect(() => adx.create({ period: 1.5 })).toThrow(RangeError)
  })

  it('should handle single candle input', () => {
    const result = collect(adx([{ h: 10, l: 8, c: 9 }]))
    expect(result).toHaveLength(1)
    expect(result[0].adx).toMatchNumber(0)
    expect(result[0].pdi).toMatchNumber(0)
    expect(result[0].mdi).toMatchNumber(0)
  })

  it('should return empty array for empty input', () => {
    const result = collect(adx([]))
    expect(result).toEqual([])
  })

  it('should use default period of 14', () => {
    expect(adx.defaultOptions.period).toBe(14)
  })

  it('should handle inside bars where both +DM and -DM are zero', () => {
    // Inside bar: current high <= prev high AND current low >= prev low
    const insideBarCandles = [
      { h: 20, l: 10, c: 15 },
      { h: 18, l: 12, c: 15 }, // inside bar: upMove=-2, downMove=-2, both DM=0
    ]
    const result = collect(adx(insideBarCandles, { period: 3 }))
    expect(result[1].pdi).toMatchNumber(0)
    expect(result[1].mdi).toMatchNumber(0)
  })

  it('should export as averageDirectionalIndex alias', async () => {
    const mod = await import('@vulcan-js/indicators')
    expect(mod.averageDirectionalIndex).toBe(mod.adx)
  })
})
