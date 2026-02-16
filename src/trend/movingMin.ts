import type { Dnum, Numberish } from 'dnum'
import { from, lt } from 'dnum'
import { createGenerator } from '~/base'

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
export const mmin = createGenerator(
  ({ period }: Required<MovingMinOptions>) => {
    const buffer: Dnum[] = []
    return (value: Numberish) => {
      buffer.push(from(value, 18))
      if (buffer.length > period)
        buffer.shift()
      return buffer.reduce((min, cur) => lt(min, cur) ? min : cur)
    }
  },
  defaultMovingMinOptions,
)

export { mmin as movingMin }
