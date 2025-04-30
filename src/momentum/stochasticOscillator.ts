import type { Dnum } from 'dnum'
import type { KlineData, RequiredProperties } from '../types'
import { div, from, mul, sub } from 'dnum'
import { mapPick } from '~/helpers/array'
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
}

export const defaultStochasticOscillatorOptions: StochasticOscillatorOptions = {
  kPeriod: 14,
  slowingPeriod: 1,
  dPeriod: 3,
}

export interface StochResult {
  k: Dnum[]
  d: Dnum[]
}

export const stoch = createSignal((data: RequiredProperties<KlineData, 'h' | 'l' | 'c'>[], { kPeriod, slowingPeriod, dPeriod, decimals, rounding }) => {
  const highs = mapPick(data, 'h', v => from(v, decimals))
  const lows = mapPick(data, 'l', v => from(v, decimals))
  const closings = mapPick(data, 'c', v => from(v, decimals))

  const highestHigh = mmax(highs, { period: kPeriod })
  const lowestLow = mmin(lows, { period: kPeriod })

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
    ? sma(rawK, { period: slowingPeriod })
    : rawK

  const dValue = sma(kValue, { period: dPeriod })

  return {
    k: kValue,
    d: dValue,
  } as StochResult
}, defaultStochasticOscillatorOptions)

export { stoch as stochasticOscillator }
