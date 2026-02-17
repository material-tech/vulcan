import { describe, expect, it } from 'vitest'
import { collect } from '~/base'
import { aroon } from '~/trend/aroon'

describe('aroon indicator', () => {
  const values = [
    { h: 10, l: 5 },
    { h: 12, l: 6 },
    { h: 11, l: 4 },
    { h: 13, l: 7 },
    { h: 9, l: 3 },
    { h: 8, l: 2 },
    { h: 14, l: 6 },
    { h: 10, l: 1 },
    { h: 11, l: 5 },
    { h: 12, l: 4 },
  ]

  it('should calculate aroon up, down, and oscillator', () => {
    const result = collect(aroon(values, { period: 5 }))

    expect(result.map(p => p.up)).toMatchNumberArray([100, 100, 80, 100, 80, 60, 100, 80, 60, 40])
    expect(result.map(p => p.down)).toMatchNumberArray([100, 80, 100, 80, 100, 100, 80, 100, 80, 60])
    expect(result.map(p => p.oscillator)).toMatchNumberArray([0, 20, -20, 20, -20, -40, 20, -20, -20, -20])
  })

  it('should calculate with custom period', () => {
    const result = collect(aroon(values, { period: 3 }))

    expect(result.map(p => p.up)).toMatchNumberArray([100, 100, 66.67, 100, 66.67, 33.33, 100, 66.67, 33.33, 0])
    expect(result.map(p => p.down)).toMatchNumberArray([100, 66.67, 100, 66.67, 100, 100, 66.67, 100, 66.67, 33.33])
    expect(result.map(p => p.oscillator)).toMatchNumberArray([0, 33.33, -33.33, 33.33, -33.33, -66.67, 33.33, -33.33, -33.33, -33.33])
  })
})
