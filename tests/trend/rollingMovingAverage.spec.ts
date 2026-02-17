import { describe, expect, it } from 'vitest'
import { collect } from '~/base'
import { rma } from '~/trend/rollingMovingAverage'

describe('rollingMovingAverage', () => {
  const values = [2, 4, 6, 8, 10, 12]
  it('should be able to calculate rolling moving average', () => {
    const result = collect(rma(values))
    const expected = [2, 3, 4, 5, 6.25, 7.69]

    expect(result).toMatchNumberArray(expected, { digits: 2 })
  })

  it('should correctly handle higher precision values', () => {
    const expected = [2, 3, 4, 5, 6, 7]

    const actual = collect(rma(values, { period: 8 }))

    expect(actual).toMatchNumberArray(expected, { digits: 2 })
  })
})
