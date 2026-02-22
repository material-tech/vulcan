import type { Numberish } from 'dnum'
import { assert, createSignal, fp18 } from '@vulcan-js/core'
import * as prim from '../primitives'

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
    const fastProc = prim.ewma(prim.ewma.k(fastPeriod))
    const slowProc = prim.ewma(prim.ewma.k(slowPeriod))
    return (value: Numberish) => {
      const v = fp18.toFp18(value)
      return fp18.toDnum(fastProc(v) - slowProc(v))
    }
  },
  defaultAbsolutePriceOscillatorOptions,
)

export { apo as absolutePriceOscillator }
