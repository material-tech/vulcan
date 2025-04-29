import { describe, expect, it } from 'vitest'
import { mmax } from './movingMax'

describe('movingMax (mmax)', () => {
  const values = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1]

  it('should be able to calculate moving maximum', () => {
    const result = mmax(values)

    expect(result)
      .toMatchNumberArray([10, 10, 10, 10, 9, 8, 7, 6, 5, 4])
  })

  it('should be able to calculate moving maximum with period option', () => {
    const result = mmax(values, { period: 8 })

    expect(result)
      .toMatchNumberArray([10, 10, 10, 10, 10, 10, 10, 10, 9, 8])
  })
})
