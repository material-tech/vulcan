import { describe, expect, it } from 'vitest'
import { apo } from '~/momentum/absolutePriceOscillator'

describe('absolute price oscillator (APO)', () => {
  const values = [1, 2, 1, 5, 8, 10, 4, 6, 5, 2]

  it('should able get APO', () => {
    const expected = [0, 0.08, 0.06, 0.37, 0.84, 1.37, 1.28, 1.36, 1.33, 1.05]

    const result = apo(values, { decimals: 2 })

    expect(result).toMatchNumberArray(expected)
  })

  it('should able get APO with options', () => {
    const expected = [0, 0.25, 0.06, 0.99, 1.96, 2.58, 0.99, 0.77, 0.34, -0.62]

    const result = apo(values, { fastPeriod: 3, slowPeriod: 7, decimals: 2 })

    expect(result).toMatchNumberArray(expected)
  })
})
