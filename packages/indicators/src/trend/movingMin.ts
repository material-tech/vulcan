import type { Numberish } from 'dnum'
import { createSignal, fp18 } from '@vulcan-js/core'
import * as prim from '../primitives'

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
    const proc = prim.mmin(period)
    return (value: Numberish) => fp18.toDnum(proc(fp18.toFp18(value)))
  },
  defaultMovingMinOptions,
)

export { mmin as movingMin }
