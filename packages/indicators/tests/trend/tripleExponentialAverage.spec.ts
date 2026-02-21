import { collect } from '@vulcan-js/core'
import { trix } from '@vulcan-js/indicators'
import { describe, expect, it } from 'vitest'

describe('triple exponential average (trix)', () => {
  const values = [1, 2, 3, 5, 8, 10, 15, 18, 14, 10, 7, 5]

  it('should compute trix with default options', () => {
    const result = collect(trix(values))

    const expected = [0, 0.2, 0.71, 1.78, 3.72, 6.34, 9.83, 13.55, 15.88, 16.39, 15.55, 13.98]

    expect(result).toMatchNumberArray(expected)
  })

  it('should compute trix with custom period', () => {
    const result = collect(trix(values, { period: 3 }))

    const expected = [0, 12.5, 27.78, 43.48, 53.03, 46.29, 44.92, 37.77, 20.81, 6.65, -3.25, -9.97]

    expect(result).toMatchNumberArray(expected)
  })
})
