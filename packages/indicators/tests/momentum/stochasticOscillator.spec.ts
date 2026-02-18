import { collect } from '@material-tech/vulcan-core'
import { stoch } from '@material-tech/vulcan-indicators'
import { toNumber } from 'dnum'
import { describe, expect, it } from 'vitest'

describe('stochastic oscillator (STOCH)', () => {
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

  it('should accept a non-array iterable source', () => {
    function* iterableSource() {
      yield* values
    }
    const fromArray = collect(stoch(values, { kPeriod: 12, dPeriod: 2 }))
    const fromIterable = collect(stoch(iterableSource(), { kPeriod: 12, dPeriod: 2 }))
    expect(fromIterable.length).toBe(fromArray.length)
    expect(fromIterable.map(p => toNumber(p.k, 2)))
      .toEqual(fromArray.map(p => toNumber(p.k, 2)))
  })

  it('should be able get k and d', () => {
    const expectedK = [
      38.79,
      54.87,
      80.67,
      84.39,
      97.84,
      93.43,
      39.14,
      32.5,
      49.17,
      60.28,
      75.97,
      88.89,
      91.47,
      70.54,
      67.7,
      89.15,
      65.89,
      85.44,
      67.39,
      74.66,
    ]
    const expectedD = [
      38.79,
      46.83,
      67.77,
      82.53,
      91.11,
      95.63,
      66.29,
      35.82,
      40.83,
      54.72,
      68.12,
      82.43,
      90.18,
      81.01,
      69.12,
      78.42,
      77.52,
      75.67,
      76.42,
      71.02,
    ]

    const actual = collect(stoch(values, { kPeriod: 12, dPeriod: 2 }))
    expect(actual.map(p => p.k)).toMatchNumberArray(expectedK)
    expect(actual.map(p => p.d)).toMatchNumberArray(expectedD)
  })

  it('should be able get k and d with options', () => {
    const expectedK = [38.79, 46.83, 58.11, 73.31, 87.63, 91.88, 76.8, 55.02, 40.27, 47.31, 61.8, 75.05, 85.44, 83.63, 76.57, 75.8, 74.25, 80.16, 72.91, 75.83]
    const expectedD = [38.79, 42.81, 52.47, 65.71, 80.47, 89.76, 84.34, 65.91, 47.65, 43.79, 54.56, 68.42, 80.24, 84.54, 80.1, 76.18, 75.02, 77.2, 76.53, 74.37]

    const actual = collect(stoch(values, {
      kPeriod: 12,
      dPeriod: 2,
      slowingPeriod: 3,
    }))
    expect(actual.map(p => p.k)).toMatchNumberArray(expectedK)
    expect(actual.map(p => p.d)).toMatchNumberArray(expectedD)
  })
})
