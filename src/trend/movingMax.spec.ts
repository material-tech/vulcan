import { format } from 'dnum'
import { describe, expect, it } from 'vitest'
import { mmax } from './movingMax'

describe('movingMax', () => {
  it('should correctly calculate moving maximum', () => {
    const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    const result = mmax(values, { period: 8 })

    expect(result.map(format))
      .toStrictEqual(['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'])
  })

  it('should handle small window period', () => {
    const values = [5, 3, 9, 1]
    const result = mmax(values, { period: 2 })

    expect(result.map(format))
      .toStrictEqual(['5', '5', '9', '9'])
  })
})
