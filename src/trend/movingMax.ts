import type { Dnum, Numberish } from 'dnum'
import type { Processor } from '~/types'
import { from, gt } from 'dnum'
import { createGenerator } from '~/base'

export interface MovingMaxOptions {
  /**
   * period
   */
  period: number
}

export const defaultMovingMaxOptions: MovingMaxOptions = {
  period: 4,
}

/**
 * Moving Maximum (MovingMax)
 */
export const mmax = createGenerator(
  ({ period }: Required<MovingMaxOptions>): Processor<Numberish, Dnum> => {
    const buffer: Dnum[] = []
    return (value: Numberish) => {
      buffer.push(from(value, 18))
      if (buffer.length > period)
        buffer.shift()
      return buffer.reduce((max, cur) => gt(max, cur) ? max : cur)
    }
  },
  defaultMovingMaxOptions,
)

export { mmax as movingMax }
