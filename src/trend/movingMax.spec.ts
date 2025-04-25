import { format } from 'dnum'
import { describe, expect, it } from 'vitest'
import { mmax } from './movingMax'

describe('movingMax', () => {
  const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

  it('should be able to calculate moving maximum', () => {
    const result = mmax(values, { period: 8 })

    expect(result.map(format))
      .toStrictEqual(['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'])
  })

  it('should be able to calculate moving maximum with period option', () => {
    const result = mmax(values, { period: 2 })

    expect(result.map(format))
      .toStrictEqual(['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'])
  })
})
