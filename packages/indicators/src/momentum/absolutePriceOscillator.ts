import type { Numberish } from 'dnum'
import { assertPositiveInteger, createSignal } from '@material-tech/vulcan-core'
import { sub } from 'dnum'
import { ema } from '../trend/exponentialMovingAverage'

export interface AbsolutePriceOscillatorOptions {
  fastPeriod: number
  slowPeriod: number
}

export const defaultAbsolutePriceOscillatorOptions: AbsolutePriceOscillatorOptions = {
  fastPeriod: 12,
  slowPeriod: 26,
}

export const apo = createSignal(
  ({ fastPeriod, slowPeriod }) => {
    assertPositiveInteger(fastPeriod, 'fastPeriod')
    assertPositiveInteger(slowPeriod, 'slowPeriod')
    const fastProc = ema.create({ period: fastPeriod })
    const slowProc = ema.create({ period: slowPeriod })
    return (value: Numberish) => sub(fastProc(value), slowProc(value))
  },
  defaultAbsolutePriceOscillatorOptions,
)

export { apo as absolutePriceOscillator }
