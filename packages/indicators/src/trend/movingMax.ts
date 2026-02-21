import type { Numberish } from 'dnum'
import { assert, createSignal, fp18 } from '@vulcan-js/core'

export interface MovingMaxOptions {
  /**
   * period
   */
  period: number
}

export const defaultMovingMaxOptions: MovingMaxOptions = {
  period: 4,
}

export function createMmaxFp18({ period }: { period: number }) {
  assert(Number.isInteger(period) && period >= 1, new RangeError(`Expected period to be a positive integer, got ${period}`))
  const buffer: bigint[] = []

  return (value: bigint): bigint => {
    buffer.push(value)
    if (buffer.length > period)
      buffer.shift()
    return buffer.reduce((max, cur) => cur > max ? cur : max)
  }
}

/**
 * Moving Maximum (MovingMax)
 */
export const mmax = createSignal(
  ({ period }) => {
    const proc = createMmaxFp18({ period })
    return (value: Numberish) => fp18.toDnum(proc(fp18.toFp18(value)))
  },
  defaultMovingMaxOptions,
)

export { mmax as movingMax }
