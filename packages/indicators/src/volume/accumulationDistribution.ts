import type { CandleData, RequiredProperties } from '@material-tech/alloy-core'
import type { Dnum } from 'dnum'
import { createSignal } from '@material-tech/alloy-core'
import { add, divide, from, multiply, subtract } from 'dnum'

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

      const mfm = divide(
        subtract(subtract(c, l), subtract(h, c)),
        subtract(h, l),
        18,
      )
      const mfv = multiply(mfm, v)
      prevAD = add(mfv, prevAD)
      return prevAD
    }
  },
)

export { ad as accumulationDistribution }
