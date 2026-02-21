import type { Numberish } from 'dnum'
import { assert, createSignal, fp18 } from '@vulcan-js/core'

export interface MovingMinOptions {
  /**
   * period
   */
  period: number
}

export const defaultMovingMinOptions: MovingMinOptions = {
  period: 4,
}

export function createMminFp18({ period }: { period: number }) {
  assert(Number.isInteger(period) && period >= 1, new RangeError(`Expected period to be a positive integer, got ${period}`))
  const buffer: bigint[] = []

  return (value: bigint): bigint => {
    buffer.push(value)
    if (buffer.length > period)
      buffer.shift()
    return buffer.reduce((min, cur) => cur < min ? cur : min)
  }
}

/**
 * Moving Minimum (MovingMin)
 */
export const mmin = createSignal(
  ({ period }) => {
    const proc = createMminFp18({ period })
    return (value: Numberish) => fp18.toDnum(proc(fp18.toFp18(value)))
  },
  defaultMovingMinOptions,
)

export { mmin as movingMin }
