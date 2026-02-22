import type { Numberish } from 'dnum'
import { assert, createSignal, fp18 } from '@vulcan-js/core'
import * as prim from '../primitives'

export interface ExponentialMovingAverageOptions {
  period: number
}

export const defaultExponentialMovingAverageOptions: ExponentialMovingAverageOptions = {
  period: 12,
}

/**
 * Exponential Moving Average (EMA)
 *
 * EMA = Price * k + PrevEMA * (1 - k)
 * Where k = 2 / (period + 1)
 */
export const ema = createSignal(
  ({ period }) => {
    assert(Number.isInteger(period) && period >= 1, new RangeError(`Expected period to be a positive integer, got ${period}`))
    const proc = prim.ewma(prim.ewma.k(period))
    return (value: Numberish) => fp18.toDnum(proc(fp18.toFp18(value)))
  },
  defaultExponentialMovingAverageOptions,
)

export { ema as exponentialMovingAverage }
