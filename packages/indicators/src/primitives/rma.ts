import { assert, fp18 } from '@vulcan-js/core'

/**
 * Create a rolling moving average (RMA) processor.
 *
 * Warm-up: running SMA for the first `period` values.
 * After: R[i] = (R[i-1] * (period - 1) + value) / period
 */
export function rma(period: number): (value: bigint) => bigint {
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
