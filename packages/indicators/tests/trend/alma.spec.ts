import { collect } from '@vulcan-js/core'
import { alma } from '@vulcan-js/indicators'
import { describe, expect, it } from 'vitest'

describe('arnaud Legoux Moving Average (ALMA)', () => {
  const values = [1, 2, 3, 5, 8, 10, 15, 18, 14, 10, 7, 5]

  it('should throw RangeError for period of 0', () => {
    expect(() => alma.create({ period: 0 })).toThrow(RangeError)
  })

  it('should throw RangeError for offset out of range', () => {
    expect(() => alma.create({ offset: -0.1 })).toThrow(RangeError)
    expect(() => alma.create({ offset: 1.1 })).toThrow(RangeError)
  })

  it('should throw RangeError for non-positive sigma', () => {
    expect(() => alma.create({ sigma: 0 })).toThrow(RangeError)
    expect(() => alma.create({ sigma: -1 })).toThrow(RangeError)
  })

  it('should calculate ALMA with default options (period=9, offset=0.85, sigma=6)', () => {
    const result = collect(alma(values))
    const expected = [1, 1.42, 1.95, 2.87, 4.47, 6.5, 9.35, 12.61, 14.42, 14.01, 11.84, 9.07]
    expect(result).toMatchNumberArray(expected)
  })

  it('should calculate ALMA with custom period', () => {
    const result = collect(alma(values, { period: 5, offset: 0.85, sigma: 6 }))
    const expected = [1, 1.46, 2.28, 3.66, 5.93, 8.38, 11.71, 15.51, 15.95, 12.91, 9.37, 6.64]
    expect(result).toMatchNumberArray(expected)
  })

  it('should calculate ALMA with centered offset', () => {
    const result = collect(alma(values, { period: 9, offset: 0.5, sigma: 6 }))
    const expected = [1, 1.17, 1.33, 1.58, 2, 2.72, 3.93, 5.75, 8.14, 10.8, 13, 13.8]
    expect(result).toMatchNumberArray(expected)
  })

  it('should produce consistent results via create() processor', () => {
    const process = alma.create()
    const results = values.map(v => process(v))

    const expected = [1, 1.42, 1.95, 2.87, 4.47, 6.5, 9.35, 12.61, 14.42, 14.01, 11.84, 9.07]
    expect(results).toMatchNumberArray(expected)
  })
})
