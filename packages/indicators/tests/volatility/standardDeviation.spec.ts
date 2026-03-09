import { collect } from '@vulcan-js/core'
import { stdDev } from '@vulcan-js/indicators'
import { describe, expect, it } from 'vitest'

describe('standard deviation (stdDev)', () => {
  it('should throw RangeError for period of 0', () => {
    expect(() => stdDev.create({ period: 0 })).toThrow(RangeError)
  })

  it('should throw RangeError for negative period', () => {
    expect(() => stdDev.create({ period: -1 })).toThrow(RangeError)
  })

  it('should calculate standard deviation with constant values', () => {
    // Constant values should have 0 standard deviation
    const values = [10, 10, 10, 10, 10]
    const result = collect(stdDev(values, { period: 3 }))

    // All values should be 0 (or very close to 0)
    expect(result.length).toBe(5)
    result.forEach((val) => {
      expect(val[0]).toBeLessThanOrEqual(1n) // Should be essentially 0
    })
  })

  it('should calculate standard deviation correctly', () => {
    // Test data: [2, 4, 6, 8, 10] with period 3
    // Window 1: [2] -> stdDev = 0
    // Window 2: [2, 4] -> mean=3, variance=((2-3)^2+(4-3)^2)/2=1, stdDev=1
    // Window 3: [2, 4, 6] -> mean=4, variance=((2-4)^2+(4-4)^2+(6-4)^2)/3=8/3, stdDev=1.633
    // Window 4: [4, 6, 8] -> mean=6, variance=((4-6)^2+(6-6)^2+(8-6)^2)/3=8/3, stdDev=1.633
    // Window 5: [6, 8, 10] -> mean=8, variance=((6-8)^2+(8-8)^2+(10-8)^2)/3=8/3, stdDev=1.633
    const values = [2, 4, 6, 8, 10]
    const result = collect(stdDev(values, { period: 3 }))

    expect(result.length).toBe(5)
    // First value has only one data point, stdDev = 0
    expect(result[0][0]).toBe(0n)
    // Second value: stdDev of [2, 4] = 1
    expect(result[1][0]).toBeGreaterThan(0.9e18)
    expect(result[1][0]).toBeLessThan(1.1e18)
    // Third value onwards: stdDev ≈ 1.633
    expect(result[2][0]).toBeGreaterThan(1.6e18)
    expect(result[2][0]).toBeLessThan(1.7e18)
    expect(result[3][0]).toBeGreaterThan(1.6e18)
    expect(result[3][0]).toBeLessThan(1.7e18)
    expect(result[4][0]).toBeGreaterThan(1.6e18)
    expect(result[4][0]).toBeLessThan(1.7e18)
  })

  it('should calculate standard deviation with default period', () => {
    // Generate 25 values with some variation
    const values = Array.from({ length: 25 }, (_, i) => i + 1)
    const result = collect(stdDev(values))

    expect(result.length).toBe(25)
    // With period=20 default, values should start stabilizing after 20
    // Standard deviation should be positive for varying data
    expect(result[20][0]).toBeGreaterThan(0n)
  })

  it('should handle decimal values', () => {
    const values = [1.5, 2.5, 3.5, 4.5, 5.5]
    const result = collect(stdDev(values, { period: 3 }))

    expect(result.length).toBe(5)
    // stdDev of [1.5, 2.5, 3.5] with mean=2.5:
    // variance = ((1.5-2.5)^2 + (2.5-2.5)^2 + (3.5-2.5)^2) / 3 = (1 + 0 + 1) / 3 = 0.667
    // stdDev = sqrt(0.667) ≈ 0.816
    expect(result[2][0]).toBeGreaterThan(0.8e18)
    expect(result[2][0]).toBeLessThan(0.85e18)
  })

  it('should return empty array for empty input', () => {
    const result = collect(stdDev([]))

    expect(result).toEqual([])
  })

  it('should work with stateful processor', () => {
    const processor = stdDev.create({ period: 3 })

    // Feed values one by one
    const r1 = processor(2)
    const r2 = processor(4)
    const r3 = processor(6)
    const r4 = processor(8)

    expect(r1[0]).toBe(0n) // Only one value
    expect(r2[0]).toBeGreaterThan(0.9e18) // stdDev of [2, 4] = 1
    expect(r2[0]).toBeLessThan(1.1e18)
    expect(r3[0]).toBeGreaterThan(1.6e18) // stdDev of [2, 4, 6] ≈ 1.633
    expect(r3[0]).toBeLessThan(1.7e18)
    expect(r4[0]).toBeGreaterThan(1.6e18) // stdDev of [4, 6, 8] ≈ 1.633
    expect(r4[0]).toBeLessThan(1.7e18)
  })
})
