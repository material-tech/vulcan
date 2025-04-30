import { describe, expect, it } from 'vitest'
import { ad } from './accumulationDistribution'

describe('accumulation distribution (A/D)', () => {
  const values = [
    { h: 10, l: 6, c: 9, v: 100 },
    { h: 9, l: 7, c: 11, v: 200 },
    { h: 12, l: 9, c: 7, v: 300 },
    { h: 14, l: 12, c: 10, v: 400 },
    { h: 12, l: 10, c: 8, v: 500 },
  ]
  it('should be able to compute accumulation distribution', () => {
    const expected = [50, 650, -50, -1250, -2750]

    const result = ad(values)
    expect(result).toMatchNumberArray(expected)
  })
})
