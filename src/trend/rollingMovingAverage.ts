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
export const rma = createSignal({
  compute: (values: Numberish[], { period }) => {
    const result = Array.from({ length: values.length }, () => from(0))

    // Use SMA for the first period
    let sum = from(0)
    for (let i = 0; i < values.length; i++) {
      if (i < period) {
        // Use SMA for the first 'period' values
        sum = add(sum, values[i])
        result[i] = div(sum, i + 1, 18)
      }
      else {
        // Use RMA formula: RMA(i) = (RMA(i-1) * (period-1) + value(i)) / period
        result[i] = div(
          add(mul(result[i - 1], from(period - 1), 18), values[i]),
          from(period),
        )
      }
    }

    return result
  },
  stream: ({ period }) => {
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
  },
  defaultOptions: defaultRMAOptions,
})

export { rma as rollingMovingAverage }
