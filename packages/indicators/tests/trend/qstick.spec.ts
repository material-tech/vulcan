import { collect } from '@vulcan-js/core'
import { qstick } from '@vulcan-js/indicators'
import { describe, expect, it } from 'vitest'

describe('qstick', () => {
  it('should throw RangeError for period of 0', () => {
    expect(() => qstick.create({ period: 0 })).toThrow(RangeError)
  })

  it('should throw RangeError for negative period', () => {
    expect(() => qstick.create({ period: -1 })).toThrow(RangeError)
  })

  it('should calculate Qstick as SMA of (Close - Open)', () => {
    const candles = [
      { o: 10, c: 12 },
      { o: 11, c: 14 },
      { o: 13, c: 11 },
      { o: 12, c: 15 },
      { o: 14, c: 13 },
    ]

    // period=3: SMA of diffs [2, 3, -2, 3, -1]
    // bar 0: 2/1 = 2
    // bar 1: (2+3)/2 = 2.5
    // bar 2: (2+3-2)/3 = 1
    // bar 3: (3-2+3)/3 = 1.33
    // bar 4: (-2+3-1)/3 = 0
    const result = collect(qstick(candles, { period: 3 }))

    expect(result).toMatchNumberArray([2, 2.5, 1, 1.33, 0])
  })

  it('should return positive values when closes are above opens', () => {
    const candles = [
      { o: 10, c: 15 },
      { o: 12, c: 18 },
      { o: 14, c: 20 },
    ]

    // diffs: [5, 6, 6], period=3
    // bar 0: 5/1 = 5
    // bar 1: 11/2 = 5.5
    // bar 2: 17/3 = 5.67
    const result = collect(qstick(candles, { period: 3 }))

    expect(result).toMatchNumberArray([5, 5.5, 5.67])
  })

  it('should return negative values when closes are below opens', () => {
    const candles = [
      { o: 15, c: 10 },
      { o: 18, c: 12 },
      { o: 20, c: 14 },
    ]

    // diffs: [-5, -6, -6], period=3
    // bar 0: -5/1 = -5
    // bar 1: -11/2 = -5.5
    // bar 2: -17/3 = -5.67
    const result = collect(qstick(candles, { period: 3 }))

    expect(result).toMatchNumberArray([-5, -5.5, -5.67])
  })

  it('should return 0 when open equals close', () => {
    const candles = [
      { o: 10, c: 10 },
      { o: 15, c: 15 },
      { o: 20, c: 20 },
    ]

    const result = collect(qstick(candles, { period: 2 }))

    expect(result).toMatchNumberArray([0, 0, 0])
  })

  it('should return empty array for empty input', () => {
    const result = collect(qstick([]))

    expect(result).toEqual([])
  })

  it('should work with period of 1', () => {
    const candles = [
      { o: 10, c: 13 },
      { o: 12, c: 10 },
      { o: 15, c: 18 },
    ]

    // period=1: just the diff itself
    const result = collect(qstick(candles, { period: 1 }))

    expect(result).toMatchNumberArray([3, -2, 3])
  })

  it('should work with stateful processor via .create()', () => {
    const process = qstick.create({ period: 3 })

    expect(process({ o: 10, c: 12 })).toMatchNumber(2)
    expect(process({ o: 11, c: 14 })).toMatchNumber(2.5)
    expect(process({ o: 13, c: 11 })).toMatchNumber(1)
    expect(process({ o: 12, c: 15 })).toMatchNumber(1.33)
  })
})
