import { describe, expect, it } from 'vitest'
import { collect } from '~/base'
import { cci } from '~/trend/commodityChannelIndex'

describe('commodity channel index (CCI)', () => {
  // Sample OHLC data
  const data = [
    { h: 25.0, l: 24.0, c: 24.5 },
    { h: 25.5, l: 24.5, c: 25.0 },
    { h: 26.0, l: 25.0, c: 25.5 },
    { h: 26.5, l: 25.5, c: 26.0 },
    { h: 27.0, l: 26.0, c: 26.5 },
    { h: 26.0, l: 25.0, c: 25.5 },
    { h: 25.0, l: 24.0, c: 24.5 },
    { h: 24.0, l: 23.0, c: 23.5 },
  ]

  it('should calculate CCI with custom period', () => {
    const result = collect(cci(data, { period: 5 }))

    expect(result).toMatchNumberArray([0, 0, 0, 0, 111.11, -30.3, -141.03, -118.06])
  })

  it('should calculate CCI with different period', () => {
    const result = collect(cci(data, { period: 3 }))

    expect(result).toMatchNumberArray([0, 0, 100.0, 100.0, 100.0, -100.0, -100.0, -100.0])
  })

  it('should return 0 when mean deviation is 0', () => {
    const sameData = [
      { h: 10, l: 10, c: 10 },
      { h: 10, l: 10, c: 10 },
      { h: 10, l: 10, c: 10 },
    ]

    const result = collect(cci(sameData, { period: 3 }))

    expect(result).toMatchNumberArray([0, 0, 0])
  })

  it('should return empty array for empty input', () => {
    const result = collect(cci([]))

    expect(result).toEqual([])
  })
})
