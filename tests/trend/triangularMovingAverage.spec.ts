import { describe, expect, it } from 'vitest'
import { trima } from '~/trend/triangularMovingAverage'

describe('triangular moving average (trima)', () => {
  const values = [1, 2, 1, 5, 8, 10, 4, 6, 5, 2]

  it('should able get trima', () => {
    const result = trima(values)

    const expected = [1, 1.25, 1.42, 2, 3.67, 6.17, 7.5, 7, 5.83, 4.67]

    expect(result).toMatchNumberArray(expected)
  })

  it('should able get trima with options', () => {
    const result = trima(values, { period: 9 })

    const expected = [1, 1.25, 1.28, 1.52, 1.9, 2.74, 3.56, 4.61, 5.48, 5.88]

    expect(result).toMatchNumberArray(expected)
  })
})
