import { assert } from '@vulcan-js/core'

/**
 * Create a moving minimum processor.
 *
 * Tracks the minimum value in a sliding window of `period` values.
 */
export function mmin(period: number): (value: bigint) => bigint {
  assert(Number.isInteger(period) && period >= 1, new RangeError(`Expected period to be a positive integer, got ${period}`))
  const buffer: bigint[] = []

  return (value: bigint): bigint => {
    buffer.push(value)
    if (buffer.length > period)
      buffer.shift()
    return buffer.reduce((min, cur) => cur < min ? cur : min)
  }
}
