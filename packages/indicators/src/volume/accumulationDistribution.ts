import type { CandleData, RequiredProperties } from '@vulcan-js/core'
import type { Dnum } from 'dnum'
import { constants, createSignal, toDnum } from '@vulcan-js/core'
import { add, divide, equal, multiply, subtract } from 'dnum'

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
    let prevAD: Dnum = constants.ZERO
    return (bar: RequiredProperties<CandleData, 'h' | 'l' | 'c' | 'v'>) => {
      const h = toDnum(bar.h)
      const l = toDnum(bar.l)
      const c = toDnum(bar.c)
      const v = toDnum(bar.v)

      const range = subtract(h, l)
      // When high equals low, the range is zero and MFM is undefined; treat as 0
      const mfm = equal(range, 0)
        ? constants.ZERO
        : divide(
            subtract(subtract(c, l), subtract(h, c)),
            range,
            constants.DECIMALS,
          )
      const mfv = multiply(mfm, v)
      prevAD = add(mfv, prevAD)
      return prevAD
    }
  },
)

export { ad as accumulationDistribution }
