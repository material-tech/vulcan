import { collect } from '@vulcan/core'
import { mmax } from '@vulcan/indicators'
import { describe, expect, it } from 'vitest'

describe('movingMax (mmax)', () => {
  const values = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1]

  it('should be able to calculate moving maximum', () => {
    const result = collect(mmax(values))

    expect(result)
      .toMatchNumberArray([10, 10, 10, 10, 9, 8, 7, 6, 5, 4])
  })

  it('should be able to calculate moving maximum with period option', () => {
    const result = collect(mmax(values, { period: 8 }))

    expect(result)
      .toMatchNumberArray([10, 10, 10, 10, 10, 10, 10, 10, 9, 8])
  })
})
