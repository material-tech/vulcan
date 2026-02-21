import type { Numberish } from 'dnum'
import { assert, createSignal, fp18 } from '@vulcan-js/core'

export interface MovingSumOptions {
  period: number
}

export const defaultMovingSumOptions: MovingSumOptions = {
  period: 4,
}

export function createMsumFp18({ period }: { period: number }) {
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
    return runningSum
  }
}

/**
 * Moving Sum
 *
 * Calculates the sum of values in a sliding window of the specified period.
 */
export const msum = createSignal(
  ({ period }) => {
    const proc = createMsumFp18({ period })
    return (value: Numberish) => fp18.toDnum(proc(fp18.toFp18(value)))
  },
  defaultMovingSumOptions,
)
