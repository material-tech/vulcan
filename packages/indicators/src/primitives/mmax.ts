import { assert } from '@vulcan-js/core'

/**
 * Create a moving maximum processor.
 *
 * Tracks the maximum value in a sliding window of `period` values.
 */
export function mmax(period: number): (value: bigint) => bigint {
  assert(Number.isInteger(period) && period >= 1, new RangeError(`Expected period to be a positive integer, got ${period}`))
  const buffer: bigint[] = []

  return (value: bigint): bigint => {
    buffer.push(value)
    if (buffer.length > period)
      buffer.shift()
    return buffer.reduce((max, cur) => cur > max ? cur : max)
  }
}
