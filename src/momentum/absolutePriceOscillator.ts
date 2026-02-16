import type { Dnum, Numberish } from 'dnum'
import type { Processor } from '~/types'
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

function createApoProcessor({ fastPeriod, slowPeriod }: Required<AbsolutePriceOscillatorOptions>): Processor<Numberish, Dnum> {
  const fastProc = ema.createProcessor({ period: fastPeriod })
  const slowProc = ema.createProcessor({ period: slowPeriod })
  return (value: Numberish) => {
    const fast = fastProc(value)
    const slow = slowProc(value)
    return sub(fast, slow)
  }
}

export const apo = createGenerator(createApoProcessor, defaultAbsolutePriceOscillatorOptions)

export { apo as absolutePriceOscillator }
