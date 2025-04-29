import { format } from 'dnum'
import { describe, expect, it } from 'vitest'
import { trima } from './triangularMovingAverage'

describe('triangular moving average (trima)', () => {
  const values = [1, 2, 1, 5, 8, 10, 4, 6, 5, 2]

  it('should able get trima', () => {
    const result = trima(values)

    const expected = ['1', '1.3', '1.42', '2', '3.6667', '6.16667', '7.5', '7', '5.83333333', '4.666666667']

    expect(result.map(format)).toStrictEqual(expected)
  })

  it('should able get trima with options', () => {
    const result = trima(values, { period: 9 })

    const expected = ['1', '1.3', '1.28', '1.521', '1.8967', '2.73667', '3.556667', '4.61', '5.48', '5.88']

    expect(result.map(format)).toStrictEqual(expected)
  })
})
