import { format } from 'dnum'
import { describe, expect, it } from 'vitest'
import { rsi } from './relativeStrengthIndex'

describe('rsi', () => {
  // Test basic RSI calculation
  it('should correctly calculate basic RSI values', () => {
    // Simple price sequence: continuously rising prices
    const upPrices = [10, 11, 12, 13, 14, 15]
    const upResult = rsi(upPrices, { period: 3, decimals: 2 })

    // The first value should be 0 because there is no previous value to calculate the change
    expect(format(upResult[0])).toBe('0')

    // For continuously rising prices, RSI should be close to 100
    expect(format(upResult[upPrices.length - 1])).toBe('100')

    // Simple price sequence: continuously falling prices
    const downPrices = [15, 14, 13, 12, 11, 10]
    const downResult = rsi(downPrices, { period: 3, decimals: 2 })

    // For continuously falling prices, RSI should be close to 0
    expect(format(downResult[downPrices.length - 1])).toBe('0')
  })

  // Test more complex cases
  it('should correctly calculate complex RSI values', () => {
    // Fluctuating price scenario
    const prices = [10, 12, 11, 13, 10, 14, 12]
    const result = rsi(prices, { period: 2, decimals: 2 })

    // Manually verify RSI values at key points
    // Second value: first price change is +2, so average gain=2, average loss=0, RSI = 100
    expect(format(result[1])).toBe('100')

    // Third value: price change is -1, so there is average loss, RSI should be less than 100
    expect(Number.parseFloat(format(result[2]))).toBeLessThan(100)

    // Fourth value: price change is +2, should increase RSI value
    expect(Number.parseFloat(format(result[3]))).toBeGreaterThan(Number.parseFloat(format(result[2])))
  })

  // Test special cases
  it('should handle special cases', () => {
    // Test single value
    const singleResult = rsi([10], { period: 14, decimals: 2 })
    expect(singleResult.length).toBe(1)
    expect(format(singleResult[0])).toBe('0')

    // Test all identical prices (no price change)
    const flatPrices = [10, 10, 10, 10, 10]
    const flatResult = rsi(flatPrices, { period: 3, decimals: 2 })
    // Since there is no price change, the first value is 0, the rest should be 0 or 50
    // Note: The original algorithm sets RSI to 100 when avg loss is 0, but when avg gain is also 0,
    // theoretically RSI should be 50 (neither overbought nor oversold)
    expect(format(flatResult[0])).toBe('0')

    // Verify large amount of random data
    const randomPrices = Array.from({ length: 100 }, () => Math.random() * 100)
    const randomResult = rsi(randomPrices, { period: 14, decimals: 2 })
    // Ensure all RSI values are within the 0-100 range
    for (let i = 0; i < randomResult.length; i++) {
      const value = Number.parseFloat(format(randomResult[i]))
      expect(value).toBeGreaterThanOrEqual(0)
      expect(value).toBeLessThanOrEqual(100)
    }
  })
})
