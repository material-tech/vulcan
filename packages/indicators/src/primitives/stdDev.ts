import { assert, fp18 } from '@vulcan-js/core'

/**
 * Create a standard deviation processor.
 *
 * Uses a ring buffer to maintain a sliding window of `period` values.
 * Calculates the population standard deviation during warm-up (when count < period).
 *
 * Formula: sqrt(Σ(xi - mean)² / n)
 */
export function stdDev(period: number): (value: bigint) => bigint {
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

    // Calculate mean
    const mean = runningSum / BigInt(count)

    // Calculate sum of squared differences
    let sumSquaredDiffs = fp18.ZERO
    for (let i = 0; i < count; i++) {
      const diff = buffer[i < head || count < period ? i : (head + i) % period]! - mean
      sumSquaredDiffs += (diff * diff) / fp18.ONE
    }

    // Calculate variance and standard deviation
    const variance = sumSquaredDiffs / BigInt(count)

    // Newton-Raphson method for square root
    if (variance === fp18.ZERO)
      return fp18.ZERO

    let x = variance
    for (let i = 0; i < 10; i++) {
      x = (x + (variance * fp18.ONE) / x) / 2n
    }

    return x
  }
}
