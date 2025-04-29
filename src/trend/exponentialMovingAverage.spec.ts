import { toNumber } from 'dnum'
import { describe, expect, it } from 'vitest'
import { ema } from './exponentialMovingAverage'

describe('exponential moving average (ema)', () => {
  const values = [2, 4, 6, 8, 12, 14, 16, 18, 20]

  it('should calculate basic ema with default options', () => {
    const result = ema(values)

    const expected = [2, 2.3, 2.88, 3.664, 4.9465, 6.33938, 7.825626, 9.3909143, 11.02308134]

    expect(result.map(toNumber)).toStrictEqual(expected)
  })

  it('should calculate ema with custom period', () => {
    const result = ema(values, { period: 2 })

    const expected = [2, 3.3, 5.11, 7.037, 10.3457, 12.78189, 14.927298, 16.9757659, 18.99192196]

    expect(result.map(toNumber)).toStrictEqual(expected)
  })
})
