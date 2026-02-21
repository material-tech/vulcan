import { collect } from '@vulcan-js/core'
import { tema } from '@vulcan-js/indicators'
import { describe, expect, it } from 'vitest'

describe('triple exponential moving average (tema)', () => {
  const values = [1, 2, 3, 5, 8, 10, 15, 18, 14, 10, 7, 5]

  it('should able get tema', () => {
    const result = collect(tema(values))

    const expected = [1, 1.39, 2.07, 3.33, 5.39, 7.62, 11.12, 14.72, 15.58, 14.48, 12.38, 9.99]

    expect(result).toMatchNumberArray(expected)
  })

  it('should able get tema with options', () => {
    const result = collect(tema(values, { period: 5 }))

    const expected = [1, 1.7, 2.7, 4.51, 7.32, 9.8, 14.18, 17.9, 16.32, 12.46, 8.49, 5.4]

    expect(result).toMatchNumberArray(expected)
  })
})
