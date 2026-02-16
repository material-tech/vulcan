import { describe, expect, it } from 'vitest'
import { collect } from '~/base'
import { msum } from '~/trend/movingSum'

describe('movingSum', () => {
  const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

  it('should be able to calculate moving sum', () => {
    const result = collect(msum(values))

    const expectedValues = [1, 3, 6, 10, 14, 18, 22, 26, 30, 34]

    expect(result).toMatchNumberArray(expectedValues)
  })

  it('should be able to calculate moving sum with period option', () => {
    const result = collect(msum(values, { period: 7 }))

    const expectedValues = [1, 3, 6, 10, 15, 21, 28, 35, 42, 49]

    expect(result).toMatchNumberArray(expectedValues)
  })
})
