import type { CandleData, RequiredProperties } from '@vulcan-js/core'
import { createSignal, fp18 } from '@vulcan-js/core'

export function createAdFp18() {
  let prevAD = fp18.ZERO

  return (h: bigint, l: bigint, c: bigint, v: bigint): bigint => {
    const range = h - l
    // When high equals low, the range is zero and MFM is undefined; treat as 0
    const mfm = range === fp18.ZERO
      ? fp18.ZERO
      : fp18.div((c - l) - (h - c), range)
    const mfv = fp18.mul(mfm, v)
    prevAD += mfv
    return prevAD
  }
}

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
    const proc = createAdFp18()
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
