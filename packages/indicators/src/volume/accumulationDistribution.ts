import type { CandleData, RequiredProperties } from '@vulcan/core'
import type { Dnum } from 'dnum'
import { createSignal } from '@vulcan/core'
import { add, divide, equal, from, multiply, subtract } from 'dnum'

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
    let prevAD: Dnum = from(0, 18)
    return (bar: RequiredProperties<CandleData, 'h' | 'l' | 'c' | 'v'>) => {
      const h = from(bar.h, 18)
      const l = from(bar.l, 18)
      const c = from(bar.c, 18)
      const v = from(bar.v, 18)

      const range = subtract(h, l)
      // When high equals low, the range is zero and MFM is undefined; treat as 0
      const mfm = equal(range, 0)
        ? from(0, 18)
        : divide(
            subtract(subtract(c, l), subtract(h, c)),
            range,
            18,
          )
      const mfv = multiply(mfm, v)
      prevAD = add(mfv, prevAD)
      return prevAD
    }
  },
)

export { ad as accumulationDistribution }
