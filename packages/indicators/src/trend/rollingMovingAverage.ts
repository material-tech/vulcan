import type { Numberish } from 'dnum'
import { assert, createSignal, fp18 } from '@vulcan-js/core'

export interface RMAOptions {
  /**
   * period
   */
  period: number
}

export const defaultRMAOptions: RMAOptions = {
  period: 4,
}

export function createRmaFp18({ period }: { period: number }) {
  assert(Number.isInteger(period) && period >= 1, new RangeError(`Expected period to be a positive integer, got ${period}`))
  const periodBig = BigInt(period)
  let count = 0
  let sum = fp18.ZERO
  let prev = fp18.ZERO

  return (value: bigint): bigint => {
    if (count < period) {
      sum += value
      count++
      prev = sum / BigInt(count)
      return prev
    }
    prev = (prev * (periodBig - 1n) + value) / periodBig
    return prev
  }
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
    const proc = createRmaFp18({ period })
    return (value: Numberish) => fp18.toDnum(proc(fp18.toFp18(value)))
  },
  defaultRMAOptions,
)

export { rma as rollingMovingAverage }
