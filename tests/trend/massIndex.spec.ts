import { describe, expect, it } from 'vitest'
import { collect } from '~/base'
import { mi } from '~/trend/massIndex'

describe('mass index (MI)', () => {
  // Constant range data (all ranges = 1.0)
  const data = [
    { h: 25.0, l: 24.0 },
    { h: 25.5, l: 24.5 },
    { h: 26.0, l: 25.0 },
    { h: 26.5, l: 25.5 },
    { h: 27.0, l: 26.0 },
    { h: 26.0, l: 25.0 },
    { h: 25.0, l: 24.0 },
    { h: 24.0, l: 23.0 },
    { h: 23.5, l: 22.5 },
    { h: 24.5, l: 23.5 },
    { h: 25.5, l: 24.5 },
    { h: 26.0, l: 25.0 },
  ]

  it('should calculate MI with default options', () => {
    const result = collect(mi(data))

    // With constant range, EMA1/EMA2 ratio converges to 1
    // Moving sum accumulates ratios up to miPeriod window
    expect(result).toMatchNumberArray([
      1,
      2,
      3,
      4,
      5,
      6,
      7,
      8,
      9,
      10,
      11,
      12,
    ])
  })

  it('should calculate MI with custom options', () => {
    const result = collect(mi(data, { emaPeriod: 3, miPeriod: 5 }))

    // With miPeriod=5, MI caps at 5 once window is full
    expect(result).toMatchNumberArray([
      1,
      2,
      3,
      4,
      5,
      5,
      5,
      5,
      5,
      5,
      5,
      5,
    ])
  })

  it('should handle varying high-low ranges', () => {
    // Data with expanding then contracting ranges
    const varyingData = [
      { h: 25.0, l: 24.5 }, // range 0.5
      { h: 25.5, l: 24.5 }, // range 1.0
      { h: 26.5, l: 24.0 }, // range 2.5
      { h: 28.0, l: 23.0 }, // range 5.0
      { h: 27.0, l: 24.0 }, // range 3.0
      { h: 25.5, l: 24.5 }, // range 1.0
      { h: 25.0, l: 24.5 }, // range 0.5
      { h: 25.0, l: 24.5 }, // range 0.5
    ]

    const result = collect(mi(varyingData, { emaPeriod: 3, miPeriod: 4 }))

    expect(result.length).toBe(8)
    // MI accumulates up to miPeriod window then remains bounded
    expect(result).toMatchNumberArray([1, 2.2, 3.64, 5.14, 5.31, 4.98, 4.24, 3.4])
  })

  it('should return empty array for empty input', () => {
    const result = collect(mi([]))

    expect(result).toEqual([])
  })
})
