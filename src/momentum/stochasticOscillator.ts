import type { Dnum } from 'dnum'
import type { KlineData, RequiredProperties } from '~/types'
import { from } from 'dnum'
import { createSignal } from '~/base'
import { mapPick } from '~/helpers/array'
import { divide, multiply, subtract } from '~/helpers/operations'
import { mmin, sma } from '~/trend'
import { mmax } from '~/trend/movingMax'

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

export const stoch = createSignal((data: RequiredProperties<KlineData, 'h' | 'l' | 'c'>[], { kPeriod, slowingPeriod, dPeriod }) => {
  const highs = mapPick(data, 'h', v => from(v))
  const lows = mapPick(data, 'l', v => from(v))
  const closings = mapPick(data, 'c', v => from(v))

  const highestHigh = mmax(highs, { period: kPeriod })
  const lowestLow = mmin(lows, { period: kPeriod })

  const rawK = multiply(
    divide(
      subtract(closings, lowestLow, 18),
      subtract(highestHigh, lowestLow, 18),
      18,
    ),
    100,
    18,
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
