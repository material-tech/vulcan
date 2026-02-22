import type { Numberish } from 'dnum'
import { createSignal, fp18 } from '@vulcan-js/core'
import * as prim from '../primitives'

export interface RMAOptions {
  /**
   * period
   */
  period: number
}

export const defaultRMAOptions: RMAOptions = {
  period: 4,
}

/**
 * Rolling moving average (RMA).
 *
 * R[0] to R[p-1] is SMA(values)
 *
 * R[p] and after is R[i] = ((R[i-1]*(p-1)) + v[i]) / p
 */
export const rma = createSignal(
  ({ period }) => {
    const proc = prim.rma(period)
    return (value: Numberish) => fp18.toDnum(proc(fp18.toFp18(value)))
  },
  defaultRMAOptions,
)

export { rma as rollingMovingAverage }
