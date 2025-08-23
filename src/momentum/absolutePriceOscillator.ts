import type { Numberish } from 'dnum'
import { from } from 'dnum'
import { createSignal } from '~/base'
import { subtract } from '../helpers/operator'
import { ema } from '../trend/exponentialMovingAverage'

export interface AbsolutePriceOscillatorOptions {
  fastPeriod: number
  slowPeriod: number
}

export const defaultAbsolutePriceOscillatorOptions: AbsolutePriceOscillatorOptions = {
  fastPeriod: 12,
  slowPeriod: 26,
}

export const apo = createSignal((
  data: Numberish[],
  { fastPeriod, slowPeriod, decimals, rounding },
) => {
  const closes = data.map(v => from(v, decimals))

  const fastEMA = ema(closes, { period: fastPeriod, decimals, rounding })
  const slowEMA = ema(closes, { period: slowPeriod, decimals, rounding })

  return subtract(fastEMA, slowEMA, decimals)
}, defaultAbsolutePriceOscillatorOptions)

export { apo as absolutePriceOscillator }
