import { collect } from '@vulcan-js/core'
import { apo } from '@vulcan-js/indicators'
import { describe, expect, it } from 'vitest'

describe('absolute price oscillator (APO)', () => {
  const values = [1, 2, 1, 5, 8, 10, 4, 6, 5, 2]

  it('should able get APO', () => {
    const expected = [0, 0.08, 0.06, 0.37, 0.84, 1.36, 1.27, 1.35, 1.32, 1.04]

    const result = collect(apo(values))

    expect(result).toMatchNumberArray(expected)
  })

  it('should able get APO with options', () => {
    const expected = [
      0,
      0.33,
      0,
      1.26,
      2.26,
      2.65,
      0.14,
      0.22,
      -0.14,
      -1.19,
    ]

    const result = collect(apo(values, { fastPeriod: 2, slowPeriod: 5 }))

    expect(result).toMatchNumberArray(expected)
  })
})
