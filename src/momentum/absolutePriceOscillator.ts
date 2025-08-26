import type { Numberish } from 'dnum'
import { from } from 'dnum'
import { createSignal } from '~/base'
import { subtract } from '../helpers/operations'
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
  { fastPeriod, slowPeriod },
) => {
  const closes = data.map(v => from(v))

  const fastEMA = ema(closes, { period: fastPeriod })
  const slowEMA = ema(closes, { period: slowPeriod })

  return subtract(fastEMA, slowEMA, 18)
}, defaultAbsolutePriceOscillatorOptions)

export { apo as absolutePriceOscillator }
