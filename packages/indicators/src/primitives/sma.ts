import { assert, fp18 } from '@vulcan-js/core'

/**
 * Create a simple moving average (SMA) processor.
 *
 * Uses a ring buffer to maintain a sliding window of `period` values.
 * Returns the running average (sum / count) during warm-up.
 */
export function sma(period: number): (value: bigint) => bigint {
  assert(Number.isInteger(period) && period >= 1, new RangeError(`Expected period to be a positive integer, got ${period}`))
  const buffer: bigint[] = Array.from({ length: period })
  let head = 0
  let count = 0
  let runningSum = fp18.ZERO

  return (value: bigint): bigint => {
    if (count < period) {
      buffer[count] = value
      runningSum += value
      count++
    }
    else {
      runningSum = runningSum - buffer[head] + value
      buffer[head] = value
      head = (head + 1) % period
    }
    return runningSum / BigInt(count)
  }
}
