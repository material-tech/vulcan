import type { Dnum, Numberish } from 'dnum'
import { add, from, mul } from 'dnum'
import { createSignal } from '~/base'

export interface ExponentialMovingAverageOptions {
  period: number
}

export const defaultExponentialMovingAverageOptions: ExponentialMovingAverageOptions = {
  period: 12,
}

export const ema = createSignal(({ period }) => {
  const k = 2 / (1 + period)
  const m = 1 - k
  let prev: Dnum | null = null
  return (value: Numberish) => {
    if (prev === null) {
      prev = from(value)
    }
    else {
      prev = add(mul(value, k, 18), mul(prev, m, 18))
    }
    return prev
  }
}, defaultExponentialMovingAverageOptions)

export { ema as exponentialMovingAverage }
