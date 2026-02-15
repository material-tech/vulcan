import { toNumber } from 'dnum'
import { describe, expect, it } from 'vitest'
import { mapOperator } from '~/helpers/operations'
import { cmo } from '~/momentum/chaikinOscillator'

describe('chaikin money flow oscillator (CMO)', () => {
  const values = [
    { h: 10, l: 1, c: 5, v: 100 },
    { h: 11, l: 2, c: 6, v: 200 },
    { h: 12, l: 3, c: 7, v: 300 },
    { h: 13, l: 4, c: 8, v: 400 },
    { h: 14, l: 5, c: 9, v: 500 },
    { h: 15, l: 6, c: 10, v: 600 },
    { h: 16, l: 7, c: 11, v: 700 },
    { h: 17, l: 8, c: 12, v: 800 },
  ]

  it('should able to calculate CMO', () => {
    const result = cmo(values)

    const expected = [0, -7.07, -19.93, -37.52, -58.98, -83.61, -110.83, -140.17]

    expect(result).toMatchNumberArray(expected, { digits: 2 })
  })

  it('should able to calculate CMO with options', () => {
    const result = cmo(values, {
      fastPeriod: 2,
      slowPeriod: 5,
    })

    const expected = [0, -7.41, -18.52, -31.69, -46.09, -61.27, -76.95, -92.97]

    expect(result).toMatchNumberArray(expected, { digits: 2 })
  })

  it('stream should produce same results as batch', () => {
    const batchResult = mapOperator(toNumber)(cmo(values), { digits: 2 })
    const next = cmo.stream()
    const streamResult = values.map(v => next(v))
    expect(streamResult).toMatchNumberArray(batchResult)
  })
})
