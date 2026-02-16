import { toNumber } from 'dnum'
import { describe, expect, it } from 'vitest'
import { mapOperator } from '~/helpers/operations'
import { cfo } from '~/trend/chandeForecastOscillator'

describe('chande forecast oscillator (CFO)', () => {
  const values = [10, 14, 12, 16, 20]

  it('should calculate CFO correctly', () => {
    const result = cfo(values, { period: 4 })

    expect(result).toMatchNumberArray([0, 0, -8.33, 3.75, 6])
  })

  it('should calculate CFO with different period', () => {
    const result = cfo(values, { period: 3 })

    expect(result).toMatchNumberArray([0, 0, -8.33, 6.25, 0])
  })

  it('should return 0 when close is 0', () => {
    const result = cfo([0, 1, 0], { period: 3 })

    expect(result).toMatchNumberArray([0, 0, 0])
  })

  it('should return empty array for empty input', () => {
    const result = cfo([])

    expect(result).toEqual([])
  })

  it('step should produce same results as batch', () => {
    const batchResult = mapOperator(toNumber)(cfo(values, { period: 4 }), { digits: 2 })
    const next = cfo.next({ period: 4 })
    const streamResult = values.map(v => next(v))
    expect(streamResult).toMatchNumberArray(batchResult)
  })
})
