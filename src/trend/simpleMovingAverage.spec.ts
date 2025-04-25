import { format } from 'dnum'
import { describe, expect, it } from 'vitest'
import { sma } from './simpleMovingAverage'

describe('sma', () => {
  it('should calculate simple moving average', () => {
    const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

    const result = sma(values, { period: 3 })

    expect(format(result[0])).toBe('1') // 1/1
    expect(format(result[1])).toBe('1.5') // (1+2)/2

    expect(format(result[2])).toBe('2') // (1+2+3)/3
    expect(format(result[3])).toBe('3') // (2+3+4)/3
    expect(format(result[4])).toBe('4') // (3+4+5)/3
    expect(format(result[5])).toBe('5') // (4+5+6)/3
    expect(format(result[6])).toBe('6') // (5+6+7)/3
    expect(format(result[7])).toBe('7') // (6+7+8)/3
    expect(format(result[8])).toBe('8') // (7+8+9)/3
    expect(format(result[9])).toBe('9') // (8+9+10)/3
  })

  it('should handle arrays smaller than the period', () => {
    const values = [1, 2]
    const result = sma(values, { period: 3 })

    expect(format(result[0])).toBe('1') // 1/1
    expect(format(result[1])).toBe('1.5') // (1+2)/2
  })

  it('should return empty array when the input is empty', () => {
    const result = sma([])
    expect(result).toEqual([])
  })
})
