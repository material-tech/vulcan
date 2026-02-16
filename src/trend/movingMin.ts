import type { Dnum, Numberish } from 'dnum'
import type { Processor } from '~/types'
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
function createMminProcessor({ period }: Required<MovingMinOptions>): Processor<Numberish, Dnum> {
  const buffer: Dnum[] = []
  return (value: Numberish) => {
    buffer.push(from(value, 18))
    if (buffer.length > period)
      buffer.shift()
    return buffer.reduce((min, cur) => lt(min, cur) ? min : cur)
  }
}

export const mmin = createGenerator(createMminProcessor, defaultMovingMinOptions)

export { mmin as movingMin }
