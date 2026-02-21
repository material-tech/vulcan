import { collect } from '@vulcan-js/core'
import { typicalPrice } from '@vulcan-js/indicators'
import { describe, expect, it } from 'vitest'

describe('typicalPrice', () => {
  it('should calculate (High + Low + Close) / 3', () => {
    const candles = [
      { h: 30, l: 10, c: 20 },
      { h: 25, l: 15, c: 22 },
      { h: 40, l: 20, c: 35 },
    ]

    // bar 0: (30 + 10 + 20) / 3 = 20
    // bar 1: (25 + 15 + 22) / 3 = 20.67
    // bar 2: (40 + 20 + 35) / 3 = 31.67
    const result = collect(typicalPrice(candles))

    expect(result).toMatchNumberArray([20, 20.67, 31.67])
  })

  it('should return the price itself when h, l, c are equal', () => {
    const candles = [
      { h: 10, l: 10, c: 10 },
      { h: 50, l: 50, c: 50 },
    ]

    const result = collect(typicalPrice(candles))

    expect(result).toMatchNumberArray([10, 50])
  })

  it('should handle decimal values', () => {
    const candles = [
      { h: 10.5, l: 9.5, c: 10.2 },
      { h: 11.3, l: 10.1, c: 10.8 },
    ]

    // bar 0: (10.5 + 9.5 + 10.2) / 3 = 10.07
    // bar 1: (11.3 + 10.1 + 10.8) / 3 = 10.73
    const result = collect(typicalPrice(candles))

    expect(result).toMatchNumberArray([10.07, 10.73])
  })

  it('should return empty array for empty input', () => {
    const result = collect(typicalPrice([]))

    expect(result).toEqual([])
  })

  it('should handle single candle', () => {
    const candles = [{ h: 15, l: 5, c: 10 }]

    // (15 + 5 + 10) / 3 = 10
    const result = collect(typicalPrice(candles))

    expect(result).toMatchNumberArray([10])
  })

  it('should work with stateful processor via .create()', () => {
    const process = typicalPrice.create()

    // (30 + 10 + 20) / 3 = 20
    expect(process({ h: 30, l: 10, c: 20 })).toMatchNumber(20)
    // (25 + 15 + 22) / 3 = 20.67
    expect(process({ h: 25, l: 15, c: 22 })).toMatchNumber(20.67)
  })
})
