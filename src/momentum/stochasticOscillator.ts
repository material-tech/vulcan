import type { Dnum, Rounding } from 'dnum'
import type { KlineData } from '../types'
import { div, from, mul, sub } from 'dnum'
import { createSignal } from '../base'
import { mapOperator } from '../helpers/operator'
import { mmin, sma } from '../trend'
import { mmax } from '../trend/movingMax'

export interface StochasticOscillatorOptions {
  /** The %k period */
  kPeriod: number
  /** The %k slowing period */
  slowingPeriod: number
  /** The %d period  */
  dPeriod: number
  decimals: number
  rounding: Rounding
}

export const defaultStochasticOscillatorOptions: StochasticOscillatorOptions = {
  kPeriod: 14,
  slowingPeriod: 1,
  dPeriod: 3,
  decimals: 18,
  rounding: 'ROUND_HALF',
}

export interface StochResult {
  k: Dnum[]
  d: Dnum[]
}

export const stoch = createSignal((data: KlineData[], { kPeriod, slowingPeriod, dPeriod, decimals, rounding }) => {
  const highs = data.map(item => from(item.h, decimals))
  const lows = data.map(item => from(item.l, decimals))
  const closings = data.map(item => from(item.c, decimals))

  const highestHigh = mmax(highs, { period: kPeriod, decimals })
  const lowestLow = mmin(lows, { period: kPeriod, decimals })

  const rawK = mapOperator(mul)(
    mapOperator(div)(
      mapOperator(sub)(closings, lowestLow, decimals),
      mapOperator(sub)(highestHigh, lowestLow, decimals),
      { decimals, rounding },
    ),
    100,
    { decimals, rounding },
  )

  // 应用平滑度处理
  const kValue = slowingPeriod > 1
    ? sma(rawK, { period: slowingPeriod, decimals })
    : rawK

  const dValue = sma(kValue, { period: dPeriod, decimals })

  return {
    k: kValue,
    d: dValue,
  } as StochResult
}, defaultStochasticOscillatorOptions)

export { stoch as stochasticOscillator }
