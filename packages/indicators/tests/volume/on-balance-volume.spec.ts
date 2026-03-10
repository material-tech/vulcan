import { collect } from '@vulcan-js/core'
import { obv } from '@vulcan-js/indicators'
import { describe, expect, it } from 'vitest'

describe('on-balance volume (OBV)', () => {
  it('should calculate OBV correctly for basic price movements', () => {
    // Close prices: 10 -> 11 (up), 11 -> 10 (down), 10 -> 12 (up), 12 -> 12 (flat)
    // Volumes: 100, 200, 300, 400
    const candles = [
      { c: 10, v: 100 },
      { c: 11, v: 200 },
      { c: 10, v: 300 },
      { c: 12, v: 400 },
      { c: 12, v: 500 },
    ]

    const result = collect(obv(candles))

    // First bar: OBV = 0 (starting point)
    expect(result[0][0]).toBe(0n)

    // Second bar: Close up (11 > 10), OBV = 0 + 200 = 200
    expect(Number(result[1][0]) / 10 ** result[1][1]).toBeCloseTo(200, 0)

    // Third bar: Close down (10 < 11), OBV = 200 - 300 = -100
    expect(Number(result[2][0]) / 10 ** result[2][1]).toBeCloseTo(-100, 0)

    // Fourth bar: Close up (12 > 10), OBV = -100 + 400 = 300
    expect(Number(result[3][0]) / 10 ** result[3][1]).toBeCloseTo(300, 0)

    // Fifth bar: Close flat (12 = 12), OBV = 300 (no change)
    expect(Number(result[4][0]) / 10 ** result[4][1]).toBeCloseTo(300, 0)
  })

  it('should handle continuous uptrend', () => {
    const rising = [
      { c: 10, v: 100 },
      { c: 11, v: 100 },
      { c: 12, v: 100 },
      { c: 13, v: 100 },
    ]

    const result = collect(obv(rising))

    // OBV: 0, 100, 200, 300
    expect(result).toHaveLength(4)
    expect(Number(result[0][0]) / 10 ** result[0][1]).toBeCloseTo(0, 0)
    expect(Number(result[1][0]) / 10 ** result[1][1]).toBeCloseTo(100, 0)
    expect(Number(result[2][0]) / 10 ** result[2][1]).toBeCloseTo(200, 0)
    expect(Number(result[3][0]) / 10 ** result[3][1]).toBeCloseTo(300, 0)
  })

  it('should handle continuous downtrend', () => {
    const falling = [
      { c: 13, v: 100 },
      { c: 12, v: 100 },
      { c: 11, v: 100 },
      { c: 10, v: 100 },
    ]

    const result = collect(obv(falling))

    // OBV: 0, -100, -200, -300
    expect(result).toHaveLength(4)
    expect(Number(result[0][0]) / 10 ** result[0][1]).toBeCloseTo(0, 0)
    expect(Number(result[1][0]) / 10 ** result[1][1]).toBeCloseTo(-100, 0)
    expect(Number(result[2][0]) / 10 ** result[2][1]).toBeCloseTo(-200, 0)
    expect(Number(result[3][0]) / 10 ** result[3][1]).toBeCloseTo(-300, 0)
  })

  it('should handle zero volume', () => {
    const candles = [
      { c: 10, v: 0 },
      { c: 11, v: 0 },
      { c: 12, v: 100 },
    ]

    const result = collect(obv(candles))

    // OBV: 0, 0 (0 volume), 100 (add 100)
    expect(Number(result[0][0]) / 10 ** result[0][1]).toBeCloseTo(0, 0)
    expect(Number(result[1][0]) / 10 ** result[1][1]).toBeCloseTo(0, 0)
    expect(Number(result[2][0]) / 10 ** result[2][1]).toBeCloseTo(100, 0)
  })

  it('should handle alternating up and down', () => {
    const alternating = [
      { c: 10, v: 100 },
      { c: 12, v: 200 }, // up
      { c: 11, v: 150 }, // down
      { c: 13, v: 300 }, // up
      { c: 9, v: 250 }, // down
    ]

    const result = collect(obv(alternating))

    // OBV: 0, +200 = 200, -150 = 50, +300 = 350, -250 = 100
    expect(result).toHaveLength(5)
    expect(Number(result[0][0]) / 10 ** result[0][1]).toBeCloseTo(0, 0)
    expect(Number(result[1][0]) / 10 ** result[1][1]).toBeCloseTo(200, 0)
    expect(Number(result[2][0]) / 10 ** result[2][1]).toBeCloseTo(50, 0)
    expect(Number(result[3][0]) / 10 ** result[3][1]).toBeCloseTo(350, 0)
    expect(Number(result[4][0]) / 10 ** result[4][1]).toBeCloseTo(100, 0)
  })

  it('should work with stateful processor via .create()', () => {
    const processor = obv.create()

    const result1 = processor({ c: 10, v: 100 })
    expect(Number(result1[0]) / 10 ** result1[1]).toBeCloseTo(0, 0)

    const result2 = processor({ c: 11, v: 200 })
    expect(Number(result2[0]) / 10 ** result2[1]).toBeCloseTo(200, 0)

    const result3 = processor({ c: 10, v: 150 })
    expect(Number(result3[0]) / 10 ** result3[1]).toBeCloseTo(50, 0)
  })
})
