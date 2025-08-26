import type { KlineData, RequiredProperties } from '~/types'
import { add, from } from 'dnum'
import { createSignal } from '~/base'
import { mapPick } from '~/helpers/array'
import { divide, multiply, subtract } from '~/helpers/operations'

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
  (data: RequiredProperties<KlineData, 'h' | 'l' | 'c' | 'v'>[]) => {
    const highs = mapPick(data, 'h', v => from(v))
    const lows = mapPick(data, 'l', v => from(v))
    const closings = mapPick(data, 'c', v => from(v))
    const volumes = mapPick(data, 'v', v => from(v))

    /** Money Flow Multiplier */
    const mfm = divide(
      subtract(
        subtract(closings, lows),
        subtract(highs, closings),
      ),
      subtract(highs, lows),
      18,
    )

    /** Money Flow Volume */
    const mfv = multiply(mfm, volumes)

    let prevValue = from(0)

    return Array.from({ length: mfv.length }, (_, i) => {
      const currentValue = i === 0 ? mfv[i] : add(mfv[i], prevValue)
      return prevValue = currentValue
    })
  },
)

export { ad as accumulationDistribution }
