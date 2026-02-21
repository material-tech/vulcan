import type { Dnum, Numberish } from 'dnum'
import { assert, constants, createSignal } from '@vulcan-js/core'
import { add, div, mul } from 'dnum'

export interface RMAOptions {
  /**
   * period
   */
  period: number
}

export const defaultRMAOptions: RMAOptions = {
  period: 4,
}

/**
 * Rolling moving average (RMA).
 *
 * R[0] to R[p-1] is SMA(values)
 *
 * R[p] and after is R[i] = ((R[i-1]*(p-1)) + v[i]) / p
 */
export const rma = createSignal(
  ({ period }) => {
    assert(Number.isInteger(period) && period >= 1, new RangeError(`Expected period to be a positive integer, got ${period}`))
    let count = 0
    let sum: Dnum = constants.ZERO
    let prev: Dnum = constants.ZERO

    return (value: Numberish) => {
      if (count < period) {
        sum = add(sum, value)
        count++
        prev = div(sum, count, constants.DECIMALS)
        return prev
      }
      prev = div(
        add(mul(prev, period - 1, constants.DECIMALS), value),
        period,
        constants.DECIMALS,
      )
      return prev
    }
  },
  defaultRMAOptions,
)

export { rma as rollingMovingAverage }
