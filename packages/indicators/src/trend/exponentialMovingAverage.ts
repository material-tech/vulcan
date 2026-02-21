import type { Numberish } from 'dnum'
import { assert, createSignal, fp18 } from '@vulcan-js/core'

export interface ExponentialMovingAverageOptions {
  period: number
}

export const defaultExponentialMovingAverageOptions: ExponentialMovingAverageOptions = {
  period: 12,
}

export function createEmaFp18({ period }: { period: number }) {
  assert(Number.isInteger(period) && period >= 1, new RangeError(`Expected period to be a positive integer, got ${period}`))
  // k = 2 / (period + 1)
  const k = fp18.div(fp18.TWO, BigInt(1 + period) * fp18.SCALE)
  const m = fp18.ONE - k
  let prev: bigint | undefined

  return (value: bigint): bigint => {
    if (prev === undefined) {
      prev = value
      return prev
    }
    prev = fp18.mul(value, k) + fp18.mul(prev, m)
    return prev
  }
}

/**
 * Exponential Moving Average (EMA)
 *
 * EMA = Price * k + PrevEMA * (1 - k)
 * Where k = 2 / (period + 1)
 */
export const ema = createSignal(
  ({ period }) => {
    const proc = createEmaFp18({ period })
    return (value: Numberish) => fp18.toDnum(proc(fp18.toFp18(value)))
  },
  defaultExponentialMovingAverageOptions,
)

export { ema as exponentialMovingAverage }
