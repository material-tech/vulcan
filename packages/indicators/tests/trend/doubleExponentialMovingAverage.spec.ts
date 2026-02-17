import { collect } from '@material-tech/alloy-core'
import { dema } from '@material-tech/alloy-indicators'
import { describe, expect, it } from 'vitest'

describe('double exponential moving average (dema)', () => {
  const values = [1, 2, 3, 5, 8, 10, 15, 18, 14, 10, 7, 5]

  it('should able get dema', () => {
    const result = collect(dema(values))

    const expected = [1, 1.28, 1.79, 2.75, 4.34, 6.13, 8.93, 11.93, 13.08, 12.79, 11.67, 10.18]

    expect(result).toMatchNumberArray(expected)
  })

  it('should able get dema with options', () => {
    const result = collect(dema(values, { period: 5 }))

    const expected = [1, 1.56, 2.41, 3.96, 6.44, 8.82, 12.79, 16.46, 16.05, 13.41, 10.19, 7.3]

    expect(result).toMatchNumberArray(expected)
  })
})
