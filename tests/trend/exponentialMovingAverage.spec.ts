import { toNumber } from 'dnum'
import { describe, expect, it } from 'vitest'
import { mapOperator } from '~/helpers/operations'
import { ema } from '~/trend/exponentialMovingAverage'

describe('exponential moving average (ema)', () => {
  const values = [2, 4, 6, 8, 12, 14, 16, 18, 20]

  it('should able get ema with default options', () => {
    const result = ema(values)

    const expected = [2, 2.308, 2.876, 3.664, 4.947, 6.339, 7.826, 9.391, 11.023]

    expect(result).toMatchNumberArray(expected, { digits: 3 })
  })

  it('should able get ema with options', () => {
    const result = ema(values, { period: 2 })

    const expected = [2, 3.333, 5.111, 7.037, 10.346, 12.782, 14.927, 16.976, 18.992]

    expect(result).toMatchNumberArray(expected, { digits: 3 })
  })

  it('stream should produce same results as batch', () => {
    const batchResult = mapOperator(toNumber)(ema(values), { digits: 3 })
    const next = ema.stream()
    const streamResult = values.map(v => next(v))
    expect(streamResult).toMatchNumberArray(batchResult, { digits: 3 })
  })
})
