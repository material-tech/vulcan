import type { Dnum, Rounding } from 'dnum'
import type { KlineData } from '../types'
import { div, from, mul, sub } from 'dnum'
import { createSignal } from '../base'
import { mapOperator } from '../helpers/operator'
import { mmin, sma } from '../trend'
import { mmax } from '../trend/movingMax'

export interface StochasticOscillatorOptions {
  /**
   * period
   */
  kPeriod: number
  dPeriod: number
  decimals: number
  rounding: Rounding
}

export const defaultStochasticOscillatorOptions: StochasticOscillatorOptions = {
  kPeriod: 14,
  dPeriod: 3,
  decimals: 18,
  rounding: 'ROUND_HALF',
}

export interface StochResult {
  k: Dnum[]
  d: Dnum[]
}

export const stoch = createSignal((data: KlineData[], { kPeriod, dPeriod, decimals, rounding }) => {
  const highs = data.map(item => from(item.h, decimals))
  const lows = data.map(item => from(item.l, decimals))
  const closings = data.map(item => from(item.c, decimals))

  const highestHigh = mmax(highs, { period: kPeriod, decimals })
  const lowestLow = mmin(lows, { period: kPeriod, decimals })

  const kValue = mapOperator(mul)(
    mapOperator(div)(
      mapOperator(sub)(closings, lowestLow, decimals),
      mapOperator(sub)(highestHigh, lowestLow, decimals),
      { decimals, rounding },
    ),
    100,
    { decimals, rounding },
  )

  const dValue = sma(kValue, { period: dPeriod, decimals })

  return {
    k: kValue,
    d: dValue,
  } as StochResult
}, defaultStochasticOscillatorOptions)

export { stoch as stochasticOscillator }
