import type { CandleData, RequiredProperties } from '@vulcan-js/core'
import { createSignal, fp18 } from '@vulcan-js/core'
import * as prim from '../primitives'

/**
 * Accumulation/Distribution Indicator (A/D). Cumulative indicator
 * that uses volume and price to assess whether a stock is
 * being accumulated or distributed.
 *
 * MFM = ((Closing - Low) - (High - Closing)) / (High - Low)
 * MFV = MFM * Period Volume
 * AD = Previous AD + CMFV
 */
export const ad = createSignal(
  () => {
    const proc = prim.ad()
    return (bar: RequiredProperties<CandleData, 'h' | 'l' | 'c' | 'v'>) => {
      return fp18.toDnum(proc(
        fp18.toFp18(bar.h),
        fp18.toFp18(bar.l),
        fp18.toFp18(bar.c),
        fp18.toFp18(bar.v),
      ))
    }
  },
)

export { ad as accumulationDistribution }
