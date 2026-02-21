import { collect } from '@vulcan-js/core'
import { vortex } from '@vulcan-js/indicators'
import { describe, expect, it } from 'vitest'

describe('vortex indicator', () => {
  const candles = [
    { h: 10, l: 8, c: 9 },
    { h: 11, l: 9, c: 10 },
    { h: 12, l: 10, c: 11 },
    { h: 11, l: 9, c: 10 },
    { h: 13, l: 10, c: 12 },
    { h: 14, l: 11, c: 13 },
    { h: 12, l: 9, c: 10 },
  ]

  it('should calculate VI+ and VI- with period=3', () => {
    const result = collect(vortex(candles, { period: 3 }))

    expect(result).toHaveLength(7)

    expect(result[0].plus).toMatchNumber(0)
    expect(result[0].minus).toMatchNumber(0)

    expect(result.slice(1).map(p => p.plus)).toMatchNumberArray([1.5, 1.5, 1.17, 1.14, 1.13, 0.9])
    expect(result.slice(1).map(p => p.minus)).toMatchNumberArray([0.5, 0.5, 0.83, 0.71, 0.75, 0.8])
  })

  it('should calculate with period=2', () => {
    const result = collect(vortex(candles.slice(0, 4), { period: 2 }))

    expect(result).toHaveLength(4)
    expect(result[0].plus).toMatchNumber(0)
    expect(result.slice(1).map(p => p.plus)).toMatchNumberArray([1.5, 1.5, 1])
    expect(result.slice(1).map(p => p.minus)).toMatchNumberArray([0.5, 0.5, 1])
  })

  it('should work with .create() for stateful processing', () => {
    const process = vortex.create({ period: 3 })

    const r1 = process({ h: 10, l: 8, c: 9 })
    expect(r1.plus).toMatchNumber(0)
    expect(r1.minus).toMatchNumber(0)

    const r2 = process({ h: 11, l: 9, c: 10 })
    expect(r2.plus).toMatchNumber(1.5)
    expect(r2.minus).toMatchNumber(0.5)
  })

  it('should throw RangeError for invalid period', () => {
    expect(() => vortex.create({ period: 0 })).toThrow(RangeError)
    expect(() => vortex.create({ period: -1 })).toThrow(RangeError)
    expect(() => vortex.create({ period: 1.5 })).toThrow(RangeError)
  })

  it('should handle single candle input', () => {
    const result = collect(vortex([{ h: 10, l: 8, c: 9 }]))
    expect(result).toHaveLength(1)
    expect(result[0].plus).toMatchNumber(0)
    expect(result[0].minus).toMatchNumber(0)
  })

  it('should return empty array for empty input', () => {
    const result = collect(vortex([]))
    expect(result).toEqual([])
  })

  it('should use default period of 14', () => {
    expect(vortex.defaultOptions.period).toBe(14)
  })
})
