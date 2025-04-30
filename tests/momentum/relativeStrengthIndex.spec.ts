import { describe, expect, it } from 'vitest'
import { rsi } from '~/momentum/relativeStrengthIndex'

describe('relativeStrengthIndex (RSI)', () => {
  const values = [10, 12, 11, 11, 14, 16, 18, 17, 18, 19, 16, 14, 14, 15, 16, 19, 20, 22]

  it('should be able to calculate RSI with options', () => {
    const result = rsi(values, { period: 9, decimals: 2 })

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
      65.75,
      56.33,
      56.33,
      60,
      63.37,
      71.59,
      73.82,
      77.73,
    ]

    expect(result).toMatchNumberArray(expected)
  })

  it('should be able to calculate RSI ', () => {
    const result = rsi(values, { decimals: 2 })

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
      61.09,
      61.09,
      63.1,
      65.16,
      70.33,
      71.75,
      74.55,
    ]

    // For continuously falling prices, RSI should be close to 0
    expect(result).toMatchNumberArray(expected)
  })
})
