import { collect } from '@vulcan/core'
import { ao } from '@vulcan/indicators'
import { describe, expect, it } from 'vitest'

describe('awesomeOscillator (AO)', () => {
  const data = [
    { h: 10, l: 1 },
    { h: 11, l: 2 },
    { h: 12, l: 3 },
    { h: 13, l: 4 },
    { h: 14, l: 5 },
    { h: 15, l: 6 },
    { h: 16, l: 7 },
    { h: 17, l: 8 },
  ]

  it('should correctly calculate AO values', () => {
    const expected = [0, 0, 0, 0, 0, 0.5, 1, 1.5]

    const result = collect(ao(data))
    expect(result).toMatchNumberArray(expected)
  })

  it('should correctly calculate AO values with options', () => {
    const expected = [0, 0, 0.5, 1, 1.5, 2, 2.5, 3]

    const result = collect(ao(data, { fastPeriod: 2, slowPeriod: 20 }))
    expect(result).toMatchNumberArray(expected)
  })
})
