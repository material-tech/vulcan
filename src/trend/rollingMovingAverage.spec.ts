import { format } from 'dnum'
import { describe, expect, it } from 'vitest'
import { rma } from './rollingMovingAverage'

describe('rma', () => {
  // Test RMA calculation for a simple sequence of numbers
  it('should correctly calculate RMA for simple numbers', () => {
    const values = [10, 20, 30, 40, 50]
    const period = 3
    const result = rma(values, { period, decimals: 0 })

    expect(format(result[0])).toBe('10') // 10/1
    expect(format(result[1])).toBe('15') // (10+20)/2
    expect(format(result[2])).toBe('20') // (10+20+30)/3

    // From the fourth value, use the RMA formula: (previous RMA * (period-1) + current value) / period
    // RMA[3] = (RMA[2] * (3-1) + values[3]) / 3 = (20 * 2 + 40) / 3 = 80/3 = 26.67 ~ 27
    // Since decimal=0, the expected result is the rounded value
    expect(format(result[3])).toBe('27')

    // RMA[4] = (RMA[3] * (3-1) + values[4]) / 3 = (27 * 2 + 50) / 3 = 104/3 = 34.67 ~ 35
    expect(format(result[4])).toBe('35')
  })

  // Test handling of higher precision values
  it('should correctly handle higher precision values', () => {
    const values = [10.00, 11.00, 9.00, 10.50]
    const period = 2
    const result = rma(values, { period, decimals: 4 })

    expect(format(result[0])).toBe('10')
    expect(format(result[1])).toBe('10.5') // (10+11)/2
    expect(format(result[2])).toBe('9.75') // (10.5*1 + 9)/2
    expect(format(result[3])).toBe('10.125') // (9.75*1 + 10.5)/2
  })
})
