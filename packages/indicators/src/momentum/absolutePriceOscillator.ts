import type { Numberish } from 'dnum'
import { assert, createSignal } from '@vulcan/core'
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
    assert(Number.isInteger(fastPeriod) && fastPeriod >= 1, new RangeError(`Expected fastPeriod to be a positive integer, got ${fastPeriod}`))
    assert(Number.isInteger(slowPeriod) && slowPeriod >= 1, new RangeError(`Expected slowPeriod to be a positive integer, got ${slowPeriod}`))
    const fastProc = ema.create({ period: fastPeriod })
    const slowProc = ema.create({ period: slowPeriod })
    return (value: Numberish) => sub(fastProc(value), slowProc(value))
  },
  defaultAbsolutePriceOscillatorOptions,
)

export { apo as absolutePriceOscillator }
