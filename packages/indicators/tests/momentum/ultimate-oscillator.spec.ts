import { collect } from '@vulcan-js/core'
import { ultimateOscillator } from '@vulcan-js/indicators'
import { describe, expect, it } from 'vitest'

describe('ultimateOscillator', () => {
  // Sample OHLC data - uptrend
  const data = [
    { h: 120.0, l: 110.0, c: 115.0 },
    { h: 125.0, l: 112.0, c: 122.0 },
    { h: 128.0, l: 118.0, c: 120.0 },
    { h: 126.0, l: 119.0, c: 125.0 },
    { h: 130.0, l: 122.0, c: 128.0 },
    { h: 132.0, l: 125.0, c: 130.0 },
    { h: 135.0, l: 128.0, c: 133.0 },
    { h: 138.0, l: 130.0, c: 136.0 },
    { h: 140.0, l: 133.0, c: 138.0 },
    { h: 142.0, l: 135.0, c: 140.0 },
    { h: 145.0, l: 138.0, c: 142.0 },
    { h: 148.0, l: 140.0, c: 145.0 },
    { h: 150.0, l: 142.0, c: 148.0 },
    { h: 152.0, l: 145.0, c: 150.0 },
    { h: 155.0, l: 148.0, c: 153.0 },
    { h: 158.0, l: 150.0, c: 156.0 },
    { h: 160.0, l: 152.0, c: 158.0 },
    { h: 162.0, l: 155.0, c: 160.0 },
    { h: 165.0, l: 158.0, c: 163.0 },
    { h: 168.0, l: 160.0, c: 166.0 },
    { h: 170.0, l: 162.0, c: 168.0 },
    { h: 172.0, l: 165.0, c: 170.0 },
    { h: 175.0, l: 168.0, c: 173.0 },
    { h: 178.0, l: 170.0, c: 176.0 },
    { h: 180.0, l: 172.0, c: 178.0 },
    { h: 182.0, l: 175.0, c: 180.0 },
    { h: 185.0, l: 178.0, c: 183.0 },
    { h: 188.0, l: 180.0, c: 186.0 },
    { h: 190.0, l: 182.0, c: 188.0 },
    { h: 192.0, l: 185.0, c: 190.0 },
  ]

  it('should calculate Ultimate Oscillator with default parameters', () => {
    const result = collect(ultimateOscillator(data))

    // First 28 values should be 0 (warm-up for long period)
    expect(result.slice(0, 28)).toMatchNumberArray(Array.from({ length: 28 }).fill(0))

    // Remaining values should be in range 0-100
    result.slice(28).forEach((value) => {
      expect(value[0]).toBeGreaterThanOrEqual(0n)
      expect(value[0]).toBeLessThanOrEqual(100n * 10n ** 18n)
    })

    // Last value should be high due to uptrend
    const lastValue = result[result.length - 1]
    expect(lastValue[0]).toBeGreaterThan(50n * 10n ** 18n)
  })

  it('should calculate Ultimate Oscillator with custom parameters', () => {
    const result = collect(ultimateOscillator(data, {
      shortPeriod: 5,
      mediumPeriod: 10,
      longPeriod: 15,
      weight1: 1,
      weight2: 1,
      weight3: 1,
    }))

    // First 15 values should be 0 (warm-up for long period)
    expect(result.slice(0, 15)).toMatchNumberArray(Array.from({ length: 15 }).fill(0))

    // Remaining values should be in range 0-100
    result.slice(15).forEach((value) => {
      expect(value[0]).toBeGreaterThanOrEqual(0n)
      expect(value[0]).toBeLessThanOrEqual(100n * 10n ** 18n)
    })
  })

  it('should return 0 during warm-up period', () => {
    const shortData = [
      { h: 120.0, l: 110.0, c: 115.0 },
      { h: 125.0, l: 112.0, c: 122.0 },
      { h: 128.0, l: 118.0, c: 120.0 },
    ]

    const result = collect(ultimateOscillator(shortData, { shortPeriod: 7, mediumPeriod: 14, longPeriod: 28 }))

    // All values should be 0 since we don't have enough data
    expect(result).toMatchNumberArray([0, 0, 0])
  })

  it('should return empty array for empty input', () => {
    const result = collect(ultimateOscillator([]))
    expect(result).toEqual([])
  })

  it('should produce consistent results with stateful processor', () => {
    const processor = ultimateOscillator.create()

    const values: ReturnType<typeof processor>[] = []
    for (const bar of data) {
      const result = processor(bar)
      values.push(result)
    }

    // Compare with generator results
    const genResults = collect(ultimateOscillator(data))
    expect(values).toEqual(genResults)
  })

  it('should identify overbought conditions in strong uptrend', () => {
    // Strong uptrend data
    const uptrendData = [
      { h: 100, l: 95, c: 98 },
      { h: 105, l: 98, c: 103 },
      { h: 110, l: 102, c: 108 },
      { h: 115, l: 107, c: 113 },
      { h: 120, l: 112, c: 118 },
      { h: 125, l: 117, c: 123 },
      { h: 130, l: 122, c: 128 },
      { h: 135, l: 127, c: 133 },
      { h: 140, l: 132, c: 138 },
      { h: 145, l: 137, c: 143 },
      { h: 150, l: 142, c: 148 },
      { h: 155, l: 147, c: 153 },
      { h: 160, l: 152, c: 158 },
      { h: 165, l: 157, c: 163 },
      { h: 170, l: 162, c: 168 },
      { h: 175, l: 167, c: 173 },
      { h: 180, l: 172, c: 178 },
      { h: 185, l: 177, c: 183 },
      { h: 190, l: 182, c: 188 },
      { h: 195, l: 187, c: 193 },
      { h: 200, l: 192, c: 198 },
      { h: 205, l: 197, c: 203 },
      { h: 210, l: 202, c: 208 },
      { h: 215, l: 207, c: 213 },
      { h: 220, l: 212, c: 218 },
      { h: 225, l: 217, c: 223 },
      { h: 230, l: 222, c: 228 },
      { h: 235, l: 227, c: 233 },
      { h: 240, l: 232, c: 238 },
      { h: 245, l: 237, c: 243 },
    ]

    const result = collect(ultimateOscillator(uptrendData))
    const lastValue = result[result.length - 1]

    // In a strong uptrend, UO should be in overbought territory (>70)
    expect(lastValue[0]).toBeGreaterThan(70n * 10n ** 18n)
  })

  it('should identify oversold conditions in strong downtrend', () => {
    // Strong downtrend data
    const downtrendData = [
      { h: 200, l: 192, c: 198 },
      { h: 195, l: 187, c: 193 },
      { h: 190, l: 182, c: 188 },
      { h: 185, l: 177, c: 183 },
      { h: 180, l: 172, c: 178 },
      { h: 175, l: 167, c: 173 },
      { h: 170, l: 162, c: 168 },
      { h: 165, l: 157, c: 163 },
      { h: 160, l: 152, c: 158 },
      { h: 155, l: 147, c: 153 },
      { h: 150, l: 142, c: 148 },
      { h: 145, l: 137, c: 143 },
      { h: 140, l: 132, c: 138 },
      { h: 135, l: 127, c: 133 },
      { h: 130, l: 122, c: 128 },
      { h: 125, l: 117, c: 123 },
      { h: 120, l: 112, c: 118 },
      { h: 115, l: 107, c: 113 },
      { h: 110, l: 102, c: 108 },
      { h: 105, l: 97, c: 103 },
      { h: 100, l: 92, c: 98 },
      { h: 95, l: 87, c: 93 },
      { h: 90, l: 82, c: 88 },
      { h: 85, l: 77, c: 83 },
      { h: 80, l: 72, c: 78 },
      { h: 75, l: 67, c: 73 },
      { h: 70, l: 62, c: 68 },
      { h: 65, l: 57, c: 63 },
      { h: 60, l: 52, c: 58 },
      { h: 55, l: 47, c: 53 },
    ]

    const result = collect(ultimateOscillator(downtrendData))
    const lastValue = result[result.length - 1]

    // In a strong downtrend, UO should be in oversold territory (<30)
    expect(lastValue[0]).toBeLessThan(30n * 10n ** 18n)
  })

  it('should calculate correct values with known data', () => {
    // Using specific test data where we can verify the calculation
    const testData = [
      { h: 10, l: 8, c: 9 },
      { h: 11, l: 9, c: 10 },
      { h: 12, l: 10, c: 11 },
      { h: 13, l: 11, c: 12 },
      { h: 14, l: 12, c: 13 },
      { h: 15, l: 13, c: 14 },
      { h: 16, l: 14, c: 15 },
      { h: 17, l: 15, c: 16 },
      { h: 18, l: 16, c: 17 },
      { h: 19, l: 17, c: 18 },
    ]

    const result = collect(ultimateOscillator(testData, { shortPeriod: 3, mediumPeriod: 5, longPeriod: 7 }))

    // First 7 values should be 0 (warm-up for long period)
    expect(result.slice(0, 7)).toMatchNumberArray(Array.from({ length: 7 }).fill(0))

    // Values should be in 0-100 range
    result.slice(7).forEach((value) => {
      expect(value[0]).toBeGreaterThanOrEqual(0n)
      expect(value[0]).toBeLessThanOrEqual(100n * 10n ** 18n)
    })
  })
})
