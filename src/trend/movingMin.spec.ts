import { format } from 'dnum'
import { describe, expect, it } from 'vitest'
import { mmin } from './movingMin'

describe('movingMin', () => {
  it('should correctly calculate moving minimum', () => {
    const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    const result = mmin(values, { period: 8 })

    expect(result.map(format))
      .toStrictEqual(['1', '1', '1', '1', '1', '1', '1', '1', '2', '3'])
  })

  it('should handle small window period', () => {
    const values = [5, 3, 9, 1]
    const result = mmin(values, { period: 2 })

    expect(result.map(format))
      .toStrictEqual(['5', '3', '3', '1'])
  })
})
