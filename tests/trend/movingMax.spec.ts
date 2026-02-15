import { toNumber } from 'dnum'
import { describe, expect, it } from 'vitest'
import { mapOperator } from '~/helpers/operations'
import { mmax } from '~/trend/movingMax'

describe('movingMax (mmax)', () => {
  const values = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1]

  it('should be able to calculate moving maximum', () => {
    const result = mmax(values)

    expect(result)
      .toMatchNumberArray([10, 10, 10, 10, 9, 8, 7, 6, 5, 4])
  })

  it('should be able to calculate moving maximum with period option', () => {
    const result = mmax(values, { period: 8 })

    expect(result)
      .toMatchNumberArray([10, 10, 10, 10, 10, 10, 10, 10, 9, 8])
  })

  it('stream should produce same results as batch', () => {
    const batchResult = mapOperator(toNumber)(mmax(values), { digits: 2 })
    const next = mmax.stream()
    const streamResult = values.map(v => next(v))
    expect(streamResult).toMatchNumberArray(batchResult)
  })
})
