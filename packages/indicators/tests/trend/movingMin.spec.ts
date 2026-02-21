import { collect } from '@vulcan-js/core'
import { mmin } from '@vulcan-js/indicators'
import { describe, expect, it } from 'vitest'

describe('movingMin', () => {
  const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

  it('should be able to calculate moving minimum', () => {
    const result = collect(mmin(values, { period: 8 }))

    expect(result).toMatchNumberArray([1, 1, 1, 1, 1, 1, 1, 1, 2, 3])
  })

  it('should be able to calculate moving minimum with period option', () => {
    const result = collect(mmin(values, { period: 2 }))

    expect(result).toMatchNumberArray([1, 1, 2, 3, 4, 5, 6, 7, 8, 9])
  })
})
