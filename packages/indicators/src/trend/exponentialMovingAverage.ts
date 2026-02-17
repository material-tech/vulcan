import type { Dnum, Numberish } from 'dnum'
import { createSignal } from '@material-tech/alloy-core'
import { add, from, mul } from 'dnum'

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
    const k = 2 / (1 + period)
    const m = 1 - k
    let prev: Dnum | undefined
    return (value: Numberish) => {
      if (prev === undefined) {
        prev = from(value, 18)
        return prev
      }
      prev = add(
        mul(value, k, 18),
        mul(prev, m, 18),
      )
      return prev
    }
  },
  defaultExponentialMovingAverageOptions,
)

export { ema as exponentialMovingAverage }
