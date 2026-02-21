import type { Dnum, Numberish } from 'dnum'
import { assert, constants, createSignal, toDnum } from '@vulcan-js/core'
import { add, divide, mul, subtract } from 'dnum'

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
    const k = divide(constants.TWO, toDnum(1 + period), constants.DECIMALS)
    const m = subtract(constants.ONE, k)
    let prev: Dnum | undefined
    return (value: Numberish) => {
      if (prev === undefined) {
        prev = toDnum(value)
        return prev
      }
      prev = add(
        mul(value, k, constants.DECIMALS),
        mul(prev, m, constants.DECIMALS),
      )
      return prev
    }
  },
  defaultExponentialMovingAverageOptions,
)

export { ema as exponentialMovingAverage }
