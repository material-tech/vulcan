import { describe, expect, it } from 'vitest'
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
})
