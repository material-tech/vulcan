import { collect } from '@vulcan-js/core'
import { vwma } from '@vulcan-js/indicators'
import { describe, expect, it } from 'vitest'

describe('vwma', () => {
  it('should throw RangeError for period of 0', () => {
    expect(() => vwma.create({ period: 0 })).toThrow(RangeError)
  })

  it('should throw RangeError for negative period', () => {
    expect(() => vwma.create({ period: -1 })).toThrow(RangeError)
  })

  it('should calculate volume weighted moving average', () => {
    const candles = [
      { c: 10, v: 100 },
      { c: 12, v: 200 },
      { c: 11, v: 150 },
      { c: 13, v: 300 },
      { c: 14, v: 250 },
    ]

    // period=3
    // bar 0: (10*100) / 100 = 10
    // bar 1: (10*100 + 12*200) / (100+200) = 3400/300 = 11.33
    // bar 2: (10*100 + 12*200 + 11*150) / (100+200+150) = 5050/450 = 11.22
    // bar 3: (12*200 + 11*150 + 13*300) / (200+150+300) = 7950/650 = 12.23
    // bar 4: (11*150 + 13*300 + 14*250) / (150+300+250) = 9050/700 = 12.93
    const result = collect(vwma(candles, { period: 3 }))

    expect(result).toMatchNumberArray([10, 11.33, 11.22, 12.23, 12.93])
  })

  it('should equal close price when all volumes are the same', () => {
    const candles = [
      { c: 10, v: 100 },
      { c: 20, v: 100 },
      { c: 30, v: 100 },
    ]

    // With equal volumes, VWMA = SMA
    // bar 0: 10
    // bar 1: (10+20)/2 = 15
    // bar 2: (10+20+30)/3 = 20
    const result = collect(vwma(candles, { period: 3 }))

    expect(result).toMatchNumberArray([10, 15, 20])
  })

  it('should weight higher volume prices more', () => {
    const candles = [
      { c: 10, v: 1 },
      { c: 20, v: 1000 },
    ]

    // bar 0: 10
    // bar 1: (10*1 + 20*1000) / (1+1000) = 20010/1001 ≈ 19.99
    const result = collect(vwma(candles, { period: 2 }))

    expect(result).toMatchNumberArray([10, 19.99])
  })

  it('should return empty array for empty input', () => {
    const result = collect(vwma([]))

    expect(result).toEqual([])
  })

  it('should work with period of 1', () => {
    const candles = [
      { c: 10, v: 100 },
      { c: 20, v: 200 },
      { c: 30, v: 300 },
    ]

    // period=1: just the close price itself
    const result = collect(vwma(candles, { period: 1 }))

    expect(result).toMatchNumberArray([10, 20, 30])
  })

  it('should handle decimal values', () => {
    const candles = [
      { c: 10.5, v: 150.5 },
      { c: 11.2, v: 200.3 },
    ]

    // bar 0: 10.5
    // bar 1: (10.5*150.5 + 11.2*200.3) / (150.5+200.3) = (1580.25 + 2243.36) / 350.8 = 3823.61 / 350.8 ≈ 10.9
    const result = collect(vwma(candles, { period: 2 }))

    expect(result).toMatchNumberArray([10.5, 10.9])
  })

  it('should work with stateful processor via .create()', () => {
    const process = vwma.create({ period: 3 })

    expect(process({ c: 10, v: 100 })).toMatchNumber(10)
    expect(process({ c: 12, v: 200 })).toMatchNumber(11.33)
    expect(process({ c: 11, v: 150 })).toMatchNumber(11.22)
    expect(process({ c: 13, v: 300 })).toMatchNumber(12.23)
  })
})
