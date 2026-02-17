import { describe, expect, it } from 'vitest'
import { collect } from '~/base'
import { rsi } from '~/momentum/relativeStrengthIndex'

describe('relativeStrengthIndex (RSI)', () => {
  const values = [10, 12, 11, 11, 14, 16, 18, 17, 18, 19, 16, 14, 14, 15, 16, 19, 20, 22]

  it('should be able to calculate RSI with options', () => {
    const result = collect(rsi(values, { period: 9 }))

    const expected = [
      0,
      100,
      66.67,
      66.67,
      83.33,
      87.5,
      90,
      81.82,
      83.33,
      84.76,
      65.74,
      56.27,
      56.27,
      59.93,
      63.37,
      71.6,
      73.81,
      77.71,
    ]

    expect(result).toMatchNumberArray(expected)
  })

  it('should be able to calculate RSI ', () => {
    const result = collect(rsi(values))

    const expected = [
      0,
      100,
      66.67,
      66.67,
      83.33,
      87.5,
      90,
      81.82,
      83.33,
      84.62,
      68.75,
      61.11,
      61.11,
      63.16,
      65.13,
      70.28,
      71.78,
      74.54,
    ]

    // For continuously falling prices, RSI should be close to 0
    expect(result).toMatchNumberArray(expected)
  })
})
