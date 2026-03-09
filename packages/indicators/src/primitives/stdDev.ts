import { assert, fp18 } from '@vulcan-js/core'

/**
 * Create a standard deviation processor.
 *
 * Uses a ring buffer to maintain a sliding window of `period` values.
 * Calculates population standard deviation (divides by N, not N-1).
 */
export function stdDev(period: number): (value: bigint) => bigint {
  assert(Number.isInteger(period) && period >= 1, new RangeError(`Expected period to be a positive integer, got ${period}`))
  const buffer: bigint[] = Array.from({ length: period })
  let head = 0
  let count = 0
  let runningSum = fp18.ZERO
  let runningSumSq = fp18.ZERO

  return (value: bigint): bigint => {
    const valueSq = fp18.mul(value, value)

    if (count < period) {
      buffer[count] = value
      runningSum += value
      runningSumSq += valueSq
      count++
    }
    else {
      const oldValue = buffer[head]
      const oldValueSq = fp18.mul(oldValue, oldValue)
      runningSum = runningSum - oldValue + value
      runningSumSq = runningSumSq - oldValueSq + valueSq
      buffer[head] = value
      head = (head + 1) % period
    }

    // Population standard deviation: sqrt(E[X^2] - (E[X])^2)
    // variance = E[X^2] - (E[X])^2
    const mean = runningSum / BigInt(count)
    const meanSq = fp18.mul(mean, mean)
    const meanOfSq = runningSumSq / BigInt(count)

    // variance = meanOfSq - meanSq
    const variance = meanOfSq - meanSq

    // sqrt using Newton-Raphson method
    return sqrt(variance)
  }
}

/**
 * Integer square root using Newton-Raphson method.
 * Works with fp18 fixed-point numbers.
 */
function sqrt(n: bigint): bigint {
  if (n <= 0n)
    return fp18.ZERO

  // Initial guess: better approximation
  // For n in fp18 format, sqrt(n * SCALE) = sqrt(n) * sqrt(SCALE)
  // We want to find sqrt(n) in fp18, which is sqrt(n * SCALE) * SCALE / sqrt(SCALE)
  // A simple approximation: if n = a * SCALE, then sqrt(n) ≈ sqrt(a) * SCALE
  let x: bigint
  if (n >= fp18.SCALE) {
    // n >= 1.0, use sqrt of the scaled value
    const nNum = Number(n) / 1e18
    x = BigInt(Math.floor(Math.sqrt(nNum) * 1e18))
  }
  else {
    // n < 1.0, start with a reasonable guess
    x = fp18.ONE
  }

  if (x === 0n)
    x = n

  // Newton-Raphson iteration
  for (let i = 0; i < 20; i++) {
    const div = fp18.div(n, x)
    const nextX = (x + div) / 2n
    // Check for convergence (difference less than 1 unit)
    const diff = nextX > x ? nextX - x : x - nextX
    if (diff <= 1n)
      break
    x = nextX
  }

  return x
}
