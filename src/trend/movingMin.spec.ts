import { format } from 'dnum'
import { describe, expect, it } from 'vitest'
import { mmin } from './movingMin'

describe('movingMin', () => {
  const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

  it('should be able to calculate moving minimum', () => {
    const result = mmin(values, { period: 8 })

    expect(result.map(format))
      .toStrictEqual(['1', '1', '1', '1', '1', '1', '1', '1', '2', '3'])
  })

  it('should be able to calculate moving minimum with period option', () => {
    const result = mmin(values, { period: 2 })

    expect(result.map(format))
      .toStrictEqual(['1', '1', '2', '3', '4', '5', '6', '7', '8', '9'])
  })
})
