import { toNumber } from 'dnum'
import { describe, expect, it } from 'vitest'
import { mapOperator } from '~/helpers/operations'
import { mmin } from '~/trend/movingMin'

describe('movingMin', () => {
  const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

  it('should be able to calculate moving minimum', () => {
    const result = mmin(values, { period: 8 })

    expect(result).toMatchNumberArray([1, 1, 1, 1, 1, 1, 1, 1, 2, 3])
  })

  it('should be able to calculate moving minimum with period option', () => {
    const result = mmin(values, { period: 2 })

    expect(result).toMatchNumberArray([1, 1, 2, 3, 4, 5, 6, 7, 8, 9])
  })

  it('step should produce same results as batch', () => {
    const batchResult = mapOperator(toNumber)(mmin(values, { period: 8 }), { digits: 2 })
    const next = mmin.step({ period: 8 })
    const streamResult = values.map(v => next(v))
    expect(streamResult).toMatchNumberArray(batchResult)
  })
})
