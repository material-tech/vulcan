import { collect } from '@vulcan-js/core'
import { sma } from '@vulcan-js/indicators'
import { describe, expect, it } from 'vitest'

describe('sma', () => {
  const values = [2, 4, 6, 8, 10]

  it('should throw RangeError for period of 0', () => {
    expect(() => sma.create({ period: 0 })).toThrow(RangeError)
  })

  it('should throw RangeError for negative period', () => {
    expect(() => sma.create({ period: -1 })).toThrow(RangeError)
  })

  it('should able to calculate simple moving average', () => {
    const result = collect(sma(values))
    const expected = [2, 3, 5, 7, 9]

    expect(result).toMatchNumberArray(expected)
  })

  it('should able to calculate simple moving average with option', () => {
    const result = collect(sma(values, { period: 4 }))
    const expected = [2, 3, 4, 5, 7]

    expect(result).toMatchNumberArray(expected)
  })

  it('should calculate simple moving average for decimal values', () => {
    const values = [
      1,
      1.5,
      1.3333333333333333,
      2.6666666666666665,
      4.666666666666667,
      7.666666666666667,
      7.333333333333333,
      6.666666666666667,
      5,
      4.333333333333333,
    ]
    const result = collect(sma(values, { period: 2 }))
    const expected = [1, 1.25, 1.42, 2, 3.67, 6.17, 7.5, 7, 5.83, 4.67]

    expect(result).toMatchNumberArray(expected)
  })
})
