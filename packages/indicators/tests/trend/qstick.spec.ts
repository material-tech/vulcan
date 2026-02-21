import { collect } from '@vulcan-js/core'
import { qstick } from '@vulcan-js/indicators'
import { describe, expect, it } from 'vitest'

describe('qstick', () => {
  const data = [
    { o: 10, c: 12 },
    { o: 10, c: 8 },
    { o: 10, c: 15 },
    { o: 10, c: 7 },
    { o: 10, c: 14 },
  ]

  it('should throw RangeError for period of 0', () => {
    expect(() => qstick.create({ period: 0 })).toThrow(RangeError)
  })

  it('should calculate Qstick with default period (5)', () => {
    // diffs: [2, -2, 5, -3, 4]
    // SMA(5): [2/1, 0/2, 5/3, 2/4, 6/5] = [2, 0, 1.67, 0.5, 1.2]
    const result = collect(qstick(data))

    expect(result).toMatchNumberArray([2, 0, 1.67, 0.5, 1.2])
  })

  it('should calculate Qstick with custom period', () => {
    // diffs: [2, -2, 5, -3, 4]
    // SMA(3): [2/1, 0/2, 5/3, 0/3, 6/3] = [2, 0, 1.67, 0, 2]
    const result = collect(qstick(data, { period: 3 }))

    expect(result).toMatchNumberArray([2, 0, 1.67, 0, 2])
  })

  it('should return 0 when close equals open', () => {
    const flatData = [
      { o: 10, c: 10 },
      { o: 15, c: 15 },
      { o: 20, c: 20 },
    ]

    const result = collect(qstick(flatData, { period: 3 }))

    expect(result).toMatchNumberArray([0, 0, 0])
  })

  it('should return empty array for empty input', () => {
    const result = collect(qstick([]))

    expect(result).toEqual([])
  })

  it('should work with stateful processor', () => {
    const process = qstick.create({ period: 3 })

    expect(process({ o: 10, c: 12 })).toMatchNumber(2)
    expect(process({ o: 10, c: 8 })).toMatchNumber(0)
    expect(process({ o: 10, c: 15 })).toMatchNumber(1.67)
    expect(process({ o: 10, c: 7 })).toMatchNumber(0)
    expect(process({ o: 10, c: 14 })).toMatchNumber(2)
  })
})
