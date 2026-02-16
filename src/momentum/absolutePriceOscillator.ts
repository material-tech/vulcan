import type { Numberish } from 'dnum'
import { sub } from 'dnum'
import { createGenerator } from '~/base'
import { ema } from '../trend/exponentialMovingAverage'

export interface AbsolutePriceOscillatorOptions {
  fastPeriod: number
  slowPeriod: number
}

export const defaultAbsolutePriceOscillatorOptions: AbsolutePriceOscillatorOptions = {
  fastPeriod: 12,
  slowPeriod: 26,
}

export const apo = createGenerator(
  ({ fastPeriod, slowPeriod }: Required<AbsolutePriceOscillatorOptions>) => {
    const fastProc = ema.create({ period: fastPeriod })
    const slowProc = ema.create({ period: slowPeriod })
    return (value: Numberish) => sub(fastProc(value), slowProc(value))
  },
  defaultAbsolutePriceOscillatorOptions,
)

export { apo as absolutePriceOscillator }
