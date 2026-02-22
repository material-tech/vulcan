import type { Numberish } from 'dnum'
import { createSignal, fp18 } from '@vulcan-js/core'
import * as prim from '../primitives'

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
    const proc = prim.mmax(period)
    return (value: Numberish) => fp18.toDnum(proc(fp18.toFp18(value)))
  },
  defaultMovingMaxOptions,
)

export { mmax as movingMax }
