import type { Dnum, Numberish } from 'dnum'
import { assert, createSignal } from '@material-tech/vulcan-core'
import { add, div, from, mul } from 'dnum'

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
    let sum: Dnum = from(0, 18)
    let prev: Dnum = from(0, 18)

    return (value: Numberish) => {
      if (count < period) {
        sum = add(sum, value)
        count++
        prev = div(sum, count, 18)
        return prev
      }
      prev = div(
        add(mul(prev, period - 1, 18), value),
        period,
        18,
      )
      return prev
    }
  },
  defaultRMAOptions,
)

export { rma as rollingMovingAverage }
