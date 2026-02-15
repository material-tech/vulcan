import type { Dnum, Numberish } from 'dnum'
import { from, subtract } from 'dnum'
import { createSignal } from '~/base'
import { subtract as mapSubtract } from '../helpers/operations'
import { ema } from '../trend/exponentialMovingAverage'

export interface AbsolutePriceOscillatorOptions {
  fastPeriod: number
  slowPeriod: number
}

export const defaultAbsolutePriceOscillatorOptions: AbsolutePriceOscillatorOptions = {
  fastPeriod: 12,
  slowPeriod: 26,
}

export const apo = createSignal({
  compute: (
    data: Numberish[],
    { fastPeriod, slowPeriod },
  ) => {
    const closes = data.map(v => from(v))

    const fastEMA = ema(closes, { period: fastPeriod })
    const slowEMA = ema(closes, { period: slowPeriod })

    return mapSubtract(fastEMA, slowEMA, 18)
  },
  stream: ({ fastPeriod, slowPeriod }) => {
    const fastEma = ema.stream({ period: fastPeriod })
    const slowEma = ema.stream({ period: slowPeriod })
    return (value: Numberish): Dnum => {
      const v = from(value)
      const fast = fastEma(v)
      const slow = slowEma(v)
      return subtract(fast, slow)
    }
  },
  defaultOptions: defaultAbsolutePriceOscillatorOptions,
})

export { apo as absolutePriceOscillator }
