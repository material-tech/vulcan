import { toNumber } from 'dnum'
import { describe, expect, it } from 'vitest'
import { mapOperator } from '~/helpers/operations'
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
    const result = aroon(values, { period: 5 })

    expect(result.up).toMatchNumberArray([100, 100, 80, 100, 80, 60, 100, 80, 60, 40])
    expect(result.down).toMatchNumberArray([100, 80, 100, 80, 100, 100, 80, 100, 80, 60])
    expect(result.oscillator).toMatchNumberArray([0, 20, -20, 20, -20, -40, 20, -20, -20, -20])
  })

  it('should calculate with custom period', () => {
    const result = aroon(values, { period: 3 })

    expect(result.up).toMatchNumberArray([100, 100, 66.67, 100, 66.67, 33.33, 100, 66.67, 33.33, 0])
    expect(result.down).toMatchNumberArray([100, 66.67, 100, 66.67, 100, 100, 66.67, 100, 66.67, 33.33])
    expect(result.oscillator).toMatchNumberArray([0, 33.33, -33.33, 33.33, -33.33, -66.67, 33.33, -33.33, -33.33, -33.33])
  })

  it('step should produce same results as batch', () => {
    const toNum = mapOperator(toNumber)
    const batchResult = aroon(values, { period: 5 })
    const next = aroon.step({ period: 5 })
    const streamResults = values.map(v => next(v))
    expect(streamResults.map(r => r.up)).toMatchNumberArray(
      toNum(batchResult.up, { digits: 2 }),
    )
    expect(streamResults.map(r => r.down)).toMatchNumberArray(
      toNum(batchResult.down, { digits: 2 }),
    )
    expect(streamResults.map(r => r.oscillator)).toMatchNumberArray(
      toNum(batchResult.oscillator, { digits: 2 }),
    )
  })
})
