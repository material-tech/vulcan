import { toNumber } from 'dnum'
import { describe, expect, it } from 'vitest'
import { mapOperator } from '~/helpers/operations'
import { apo } from '~/momentum/absolutePriceOscillator'

describe('absolute price oscillator (APO)', () => {
  const values = [1, 2, 1, 5, 8, 10, 4, 6, 5, 2]

  it('should able get APO', () => {
    const expected = [0, 0.08, 0.06, 0.37, 0.84, 1.36, 1.27, 1.35, 1.32, 1.04]

    const result = apo(values)

    expect(result).toMatchNumberArray(expected)
  })

  it('should able get APO with options', () => {
    const expected = [
      0,
      0.33,
      -0,
      1.26,
      2.26,
      2.65,
      0.14,
      0.22,
      -0.14,
      -1.19,
    ]

    const result = apo(values, { fastPeriod: 2, slowPeriod: 5 })

    expect(result).toMatchNumberArray(expected)
  })

  it('stream should produce same results as batch', () => {
    const batchResult = mapOperator(toNumber)(apo(values), { digits: 2 })
    const next = apo.stream()
    const streamResult = values.map(v => next(v))
    expect(streamResult).toMatchNumberArray(batchResult)
  })
})
