import { format } from 'dnum'
import { describe, expect, it } from 'vitest'
import { msum } from './movingSum'

describe('moving sum', () => {
  const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

  it('should be able to calculate moving sum', () => {
    const result = msum(values)

    const expectedValues = [1, 3, 6, 10, 14, 18, 22, 26, 30, 34]

    result.forEach((value, index) => {
      expect(format(value)).toBe(expectedValues[index].toString())
    })
  })

  it('should be able to calculate moving sum with period option', () => {
    const result = msum(values, { period: 7 })

    const expectedValues = [1, 3, 6, 10, 15, 21, 28, 35, 42, 49]

    result.forEach((value, index) => {
      expect(format(value)).toBe(expectedValues[index].toString())
    })
  })
})
