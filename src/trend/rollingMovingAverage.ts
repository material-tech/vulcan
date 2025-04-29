import type { Numberish } from 'dnum'
import { add, div, from, mul } from 'dnum'
import { createSignal } from '../base'

export interface RMAOptions {
  /**
   * period
   */
  period: number
}

export const defaultRMAOptions: RMAOptions = {
  period: 14,
}

/**
 * Rolling moving average (RMA).
 *
 * R[0] to R[p-1] is SMA(values)
 *
 * R[p] and after is R[i] = ((R[i-1]*(p-1)) + v[i]) / p
 */
export const rma = createSignal(
  (values: Numberish[], { period, decimals }) => {
    const result = Array.from({ length: values.length }, () => from(0, decimals))

    // Use SMA for the first period
    let sum = from(0, decimals)
    for (let i = 0; i < values.length; i++) {
      if (i < period) {
        // Use SMA for the first 'period' values
        sum = add(sum, values[i])
        result[i] = div(sum, from(i + 1, decimals))
      }
      else {
        // Use RMA formula: RMA(i) = (RMA(i-1) * (period-1) + value(i)) / period
        result[i] = div(
          add(mul(result[i - 1], from(period - 1, decimals)), values[i]),
          from(period, decimals),
        )
      }
    }

    return result
  },
  defaultRMAOptions,
)

export { rma as rollingMovingAverage }
