import type { Dnum, Numberish } from 'dnum'
import { from, subtract } from 'dnum'
import { createSignal } from '~/base'
import { ema } from '../trend/exponentialMovingAverage'

export interface AbsolutePriceOscillatorOptions {
  fastPeriod: number
  slowPeriod: number
}

export const defaultAbsolutePriceOscillatorOptions: AbsolutePriceOscillatorOptions = {
  fastPeriod: 12,
  slowPeriod: 26,
}

export const apo = createSignal(({ fastPeriod, slowPeriod }) => {
  const fastEma = ema.step({ period: fastPeriod })
  const slowEma = ema.step({ period: slowPeriod })
  return (value: Numberish): Dnum => {
    const v = from(value)
    const fast = fastEma(v)
    const slow = slowEma(v)
    return subtract(fast, slow)
  }
}, defaultAbsolutePriceOscillatorOptions)

export { apo as absolutePriceOscillator }
