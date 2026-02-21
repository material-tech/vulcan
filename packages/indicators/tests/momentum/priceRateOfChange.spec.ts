import { collect } from '@vulcan-js/core'
import { roc } from '@vulcan-js/indicators'
import { describe, expect, it } from 'vitest'

describe('price rate of change (ROC)', () => {
  const values = [1, 2, 1, 5, 8, 10, 4, 6, 5, 2]

  it('should able get ROC', () => {
    const expected = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 11.6, 12.69]

    const result = collect(roc([
      3674.84,
      3666.77,
      3789.99,
      3735.48,
      3749.63,
      3900.86,
      4017.82,
      4115.77,
      4160.68,
      4121.43,
      4108.54,
      4176.82,
      4101.23,
      4132.15,
    ]))

    expect(result).toMatchNumberArray(expected)
  })

  it('should able get ROC with period 1', () => {
    const expected = [0, 100, -50, 400, 60, 25, -60, 50, -16.67, -60]

    const result = collect(roc(values, { period: 1 }))

    expect(result).toMatchNumberArray(expected)
  })

  it('should able get ROC with period 3', () => {
    const expected = [0, 0, 0, 400, 300, 900, -20, -25, -50, -50]

    const result = collect(roc(values, { period: 3 }))

    expect(result).toMatchNumberArray(expected)
  })
})
