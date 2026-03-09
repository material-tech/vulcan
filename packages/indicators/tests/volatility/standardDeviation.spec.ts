import { collect } from '@vulcan-js/core'
import { stdDev } from '@vulcan-js/indicators'
import { describe, expect, it } from 'vitest'

describe('stdDev', () => {
  const values = [2, 4, 6, 8, 10]

  it('should throw RangeError for period of 0', () => {
    expect(() => stdDev.create({ period: 0 })).toThrow(RangeError)
  })

  it('should throw RangeError for negative period', () => {
    expect(() => stdDev.create({ period: -1 })).toThrow(RangeError)
  })

  it('should calculate standard deviation correctly', () => {
    const result = collect(stdDev(values, { period: 5 }))
    // During warm-up, we calculate population std dev for available data
    // period=1: stdDev=0 (single value has no variation)
    // period=2: stdDev of [2,4] = sqrt(((2-3)² + (4-3)²) / 2) = sqrt(1) = 1
    // period=3: stdDev of [2,4,6] = sqrt(((2-4)² + (4-4)² + (6-4)²) / 3) = sqrt(8/3) ≈ 1.63
    // period=4: stdDev of [2,4,6,8] = sqrt(((2-5)² + (4-5)² + (6-5)² + (8-5)²) / 4) = sqrt(5) ≈ 2.24
    // period=5: stdDev of [2,4,6,8,10] = sqrt(((2-6)² + (4-6)² + (6-6)² + (8-6)² + (10-6)²) / 5) = sqrt(8) ≈ 2.83
    const expected = [0, 1, 1.63, 2.24, 2.83]

    expect(result).toMatchNumberArray(expected)
  })

  it('should calculate standard deviation with period 3', () => {
    const result = collect(stdDev(values, { period: 3 }))
    // period=1: stdDev=0
    // period=2: stdDev of [2,4] = 1
    // period=3: stdDev of [2,4,6] ≈ 1.63
    // period=4: stdDev of [4,6,8] = sqrt(((4-6)² + (6-6)² + (8-6)²) / 3) = sqrt(8/3) ≈ 1.63
    // period=5: stdDev of [6,8,10] = sqrt(((6-8)² + (8-8)² + (10-8)²) / 3) = sqrt(8/3) ≈ 1.63
    const expected = [0, 1, 1.63, 1.63, 1.63]

    expect(result).toMatchNumberArray(expected)
  })

  it('should return 0 for constant values', () => {
    const constantValues = [5, 5, 5, 5, 5]
    const result = collect(stdDev(constantValues, { period: 3 }))

    // All values are the same, so standard deviation should be 0
    expect(result).toMatchNumberArray([0, 0, 0, 0, 0])
  })

  it('should work with decimal values', () => {
    const decimalValues = [1.5, 2.5, 3.5, 4.5, 5.5]
    const result = collect(stdDev(decimalValues, { period: 5 }))
    // Mean = 3.5
    // Variance = ((1.5-3.5)² + (2.5-3.5)² + (3.5-3.5)² + (4.5-3.5)² + (5.5-3.5)²) / 5
    //          = (4 + 1 + 0 + 1 + 4) / 5 = 2
    // StdDev = sqrt(2) ≈ 1.41
    const expected = [0, 0.5, 0.82, 1.12, 1.41]

    expect(result).toMatchNumberArray(expected)
  })
})
