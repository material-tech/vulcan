import type { Dnum, Numberish } from 'dnum'
import { assert, createSignal, toDnum } from '@vulcan-js/core'
import { lt } from 'dnum'

export interface MovingMinOptions {
  /**
   * period
   */
  period: number
}

export const defaultMovingMinOptions: MovingMinOptions = {
  period: 4,
}

/**
 * Moving Minimum (MovingMin)
 */
export const mmin = createSignal(
  ({ period }) => {
    assert(Number.isInteger(period) && period >= 1, new RangeError(`Expected period to be a positive integer, got ${period}`))
    const buffer: Dnum[] = []
    return (value: Numberish) => {
      buffer.push(toDnum(value))
      if (buffer.length > period)
        buffer.shift()
      return buffer.reduce((min, cur) => lt(min, cur) ? min : cur)
    }
  },
  defaultMovingMinOptions,
)

export { mmin as movingMin }
