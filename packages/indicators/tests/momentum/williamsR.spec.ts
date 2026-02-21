import { collect } from '@vulcan-js/core'
import { willr } from '@vulcan-js/indicators'
import { describe, expect, it } from 'vitest'

describe('williams %R (WILLR)', () => {
  // Same data as stochastic oscillator test for cross-verification
  // Williams %R = Stochastic %K - 100 (when using same period, no slowing)
  const values = [
    { h: 127.01, l: 125.36, c: 126.00 },
    { h: 127.62, l: 126.16, c: 126.60 },
    { h: 126.59, l: 124.93, c: 127.10 },
    { h: 127.35, l: 126.09, c: 127.20 },
    { h: 128.17, l: 126.82, c: 128.10 },
    { h: 128.43, l: 126.48, c: 128.20 },
    { h: 127.37, l: 126.03, c: 126.30 },
    { h: 126.42, l: 124.83, c: 126.00 },
    { h: 126.90, l: 126.39, c: 126.60 },
    { h: 126.85, l: 125.72, c: 127.00 },
    { h: 125.65, l: 124.56, c: 127.50 },
    { h: 125.72, l: 124.57, c: 128.00 },
    { h: 127.16, l: 125.07, c: 128.10 },
    { h: 127.72, l: 126.86, c: 127.29 },
    { h: 127.69, l: 126.63, c: 127.18 },
    { h: 128.22, l: 126.80, c: 128.01 },
    { h: 128.27, l: 126.71, c: 127.11 },
    { h: 128.09, l: 126.80, c: 127.73 },
    { h: 128.27, l: 126.13, c: 127.06 },
    { h: 127.74, l: 125.92, c: 127.33 },
  ]

  it('should calculate Williams %R with period 12', () => {
    // Williams %R = %K - 100 (where %K is Stochastic raw %K with same period)
    const expected = [
      -61.21,
      -45.13,
      -19.33,
      -15.61,
      -2.16,
      -6.57,
      -60.86,
      -67.50,
      -50.83,
      -39.72,
      -24.03,
      -11.11,
      -8.53,
      -29.46,
      -32.30,
      -10.85,
      -34.11,
      -14.56,
      -32.61,
      -25.34,
    ]

    const result = collect(willr(values, { period: 12 }))
    expect(result).toMatchNumberArray(expected)
  })

  it('should calculate Williams %R with default period (14)', () => {
    const result = collect(willr(values))
    expect(result).toHaveLength(values.length)
  })

  it('should return 0 when range is zero', () => {
    const flatValues = Array.from({ length: 5 }, () => ({
      h: 100,
      l: 100,
      c: 100,
    }))

    const result = collect(willr(flatValues, { period: 3 }))
    expect(result).toMatchNumberArray([0, 0, 0, 0, 0])
  })

  it('should return -100 when close equals lowest low', () => {
    const values = [
      { h: 110, l: 90, c: 100 },
      { h: 120, l: 95, c: 110 },
      { h: 115, l: 85, c: 85 },
    ]

    const result = collect(willr(values, { period: 3 }))
    expect(result[2]).toMatchNumber(-100)
  })

  it('should return 0 when close equals highest high', () => {
    const values = [
      { h: 110, l: 90, c: 100 },
      { h: 120, l: 95, c: 110 },
      { h: 115, l: 85, c: 120 },
    ]

    const result = collect(willr(values, { period: 3 }))
    expect(result[2]).toMatchNumber(0)
  })
})
