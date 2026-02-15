import { toNumber } from 'dnum'
import { describe, expect, it } from 'vitest'
import { mapOperator } from '~/helpers/operations'
import { sma } from '~/trend/simpleMovingAverage'

describe('sma', () => {
  const values = [2, 4, 6, 8, 10]

  it('should able to calculate simple moving average', () => {
    const result = sma(values)
    const expected = [2, 3, 5, 7, 9]

    expect(result).toMatchNumberArray(expected)
  })

  it('should able to calculate simple moving average with option', () => {
    const result = sma(values, { period: 4 })
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
    const result = sma(values, { period: 2 })
    const expected = [1, 1.25, 1.42, 2, 3.67, 6.17, 7.5, 7, 5.83, 4.67]

    expect(result).toMatchNumberArray(expected)
  })

  it('step should produce same results as batch', () => {
    const batchResult = mapOperator(toNumber)(sma(values), { digits: 2 })
    const next = sma.step()
    const streamResult = values.map(v => next(v))
    expect(streamResult).toMatchNumberArray(batchResult)
  })
})
