import { toNumber } from 'dnum'
import { describe, expect, it } from 'vitest'
import { mapOperator } from '~/helpers/operations'
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
    // period=5, CCI should output 0 for first 4 entries, then computed values
    const result = cci(data, { period: 5 })

    // TP values: 24.5, 25.0, 25.5, 26.0, 26.5, 25.5, 24.5, 23.5
    // For i=4 (window=[24.5,25.0,25.5,26.0,26.5]): SMA=25.5, meanDev=0.6, CCI=(26.5-25.5)/(0.015*0.6)=111.11
    // For i=5 (window=[25.0,25.5,26.0,26.5,25.5]): SMA=25.7, meanDev=0.44, CCI=(25.5-25.7)/(0.015*0.44)=-30.30
    // For i=6 (window=[25.5,26.0,26.5,25.5,24.5]): SMA=25.6, meanDev=0.52, CCI=(24.5-25.6)/(0.015*0.52)=-141.03
    // For i=7 (window=[26.0,26.5,25.5,24.5,23.5]): SMA=25.2, meanDev=0.96, CCI=(23.5-25.2)/(0.015*0.96)=-118.06
    expect(result).toMatchNumberArray([0, 0, 0, 0, 111.11, -30.3, -141.03, -118.06])
  })

  it('should calculate CCI with different period', () => {
    const result = cci(data, { period: 3 })

    // TP values: 24.5, 25.0, 25.5, 26.0, 26.5, 25.5, 24.5, 23.5
    // For i=2 (window=[24.5,25.0,25.5]): SMA=25.0, meanDev=0.333..., CCI=(25.5-25.0)/(0.015*0.333...)=100.0
    // For i=3 (window=[25.0,25.5,26.0]): SMA=25.5, meanDev=0.333..., CCI=(26.0-25.5)/(0.015*0.333...)=100.0
    // For i=4 (window=[25.5,26.0,26.5]): SMA=26.0, meanDev=0.333..., CCI=(26.5-26.0)/(0.015*0.333...)=100.0
    // For i=5 (window=[26.0,26.5,25.5]): SMA=26.0, meanDev=0.333..., CCI=(25.5-26.0)/(0.015*0.333...)=-100.0
    // For i=6 (window=[26.5,25.5,24.5]): SMA=25.5, meanDev=0.666..., CCI=(24.5-25.5)/(0.015*0.666...)=-100.0
    // For i=7 (window=[25.5,24.5,23.5]): SMA=24.5, meanDev=0.666..., CCI=(23.5-24.5)/(0.015*0.666...)=-100.0
    expect(result).toMatchNumberArray([0, 0, 100.0, 100.0, 100.0, -100.0, -100.0, -100.0])
  })

  it('should return 0 when mean deviation is 0', () => {
    // All same values → TP is same → meanDev = 0
    const sameData = [
      { h: 10, l: 10, c: 10 },
      { h: 10, l: 10, c: 10 },
      { h: 10, l: 10, c: 10 },
    ]

    const result = cci(sameData, { period: 3 })

    expect(result).toMatchNumberArray([0, 0, 0])
  })

  it('should return empty array for empty input', () => {
    const result = cci([])

    expect(result).toEqual([])
  })

  it('step should produce same results as batch', () => {
    const batchResult = mapOperator(toNumber)(cci(data, { period: 5 }), { digits: 2 })
    const next = cci.step({ period: 5 })
    const streamResult = data.map(v => next(v))
    expect(streamResult).toMatchNumberArray(batchResult)
  })
})
