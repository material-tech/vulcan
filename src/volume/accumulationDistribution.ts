import type { Dnum } from 'dnum'
import type { KlineData, Processor, RequiredProperties } from '~/types'
import { add, divide, from, multiply, subtract } from 'dnum'
import { createGenerator } from '~/base'

/**
 * Accumulation/Distribution Indicator (A/D). Cumulative indicator
 * that uses volume and price to assess whether a stock is
 * being accumulated or distributed.
 *
 * MFM = ((Closing - Low) - (High - Closing)) / (High - Low)
 * MFV = MFM * Period Volume
 * AD = Previous AD + CMFV
 */
export const ad = createGenerator(
  (): Processor<RequiredProperties<KlineData, 'h' | 'l' | 'c' | 'v'>, Dnum> => {
    let prevAD: Dnum = from(0)
    return (bar) => {
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
