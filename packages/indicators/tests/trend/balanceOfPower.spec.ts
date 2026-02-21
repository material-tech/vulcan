import { collect } from '@material-tech/vulcan-core'
import { bop } from '@material-tech/vulcan-indicators'
import { describe, expect, it } from 'vitest'

describe('balance of power (BOP)', () => {
  it('should calculate BOP correctly', () => {
    const values = [
      { o: 10, h: 15, l: 5, c: 12 },
      { o: 10, h: 15, l: 5, c: 8 },
      { o: 5, h: 20, l: 5, c: 20 },
      { o: 20, h: 20, l: 5, c: 5 },
      { o: 100, h: 110, l: 90, c: 105 },
      { o: 50, h: 55, l: 45, c: 52 },
    ]

    const result = collect(bop(values))

    expect(result).toMatchNumberArray([0.2, -0.2, 1.0, -1.0, 0.25, 0.2])
  })

  it('should return 0 when high equals low', () => {
    const values = [
      { o: 10, h: 10, l: 10, c: 10 },
      { o: 10, h: 15, l: 5, c: 12 },
    ]

    const result = collect(bop(values))

    expect(result).toMatchNumberArray([0, 0.2])
  })

  it('should return empty array for empty input', () => {
    const result = collect(bop([]))

    expect(result).toEqual([])
  })
})
