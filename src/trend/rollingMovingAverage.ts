import type { Dnum, Numberish } from 'dnum'
import { add, div, from, mul } from 'dnum'
import { createSignal } from '~/base'

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
export const rma = createSignal(({ period }) => {
  let count = 0
  let sum = from(0)
  let prev: Dnum = from(0)
  return (value: Numberish) => {
    if (count < period) {
      sum = add(sum, value)
      count++
      prev = div(sum, count, 18)
    }
    else {
      prev = div(
        add(mul(prev, from(period - 1), 18), value),
        from(period),
      )
    }
    return prev
  }
}, defaultRMAOptions)

export { rma as rollingMovingAverage }
