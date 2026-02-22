import type { Numberish } from 'dnum'
import { createSignal, fp18 } from '@vulcan-js/core'
import * as prim from '../primitives'

export interface MovingSumOptions {
  period: number
}

export const defaultMovingSumOptions: MovingSumOptions = {
  period: 4,
}

/**
 * Moving Sum
 *
 * Calculates the sum of values in a sliding window of the specified period.
 */
export const msum = createSignal(
  ({ period }) => {
    const proc = prim.msum(period)
    return (value: Numberish) => fp18.toDnum(proc(fp18.toFp18(value)))
  },
  defaultMovingSumOptions,
)
