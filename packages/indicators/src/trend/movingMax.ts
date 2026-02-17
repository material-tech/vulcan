import type { Dnum, Numberish } from 'dnum'
import { createSignal } from '@material-tech/alloy-core'
import { from, gt } from 'dnum'

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
export const mmax = createSignal(
  ({ period }) => {
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
