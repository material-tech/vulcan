import type { KlineData, RequiredProperties } from '~/types'
import { add, from } from 'dnum'
import { createSignal } from '~/base'
import { mapPick } from '~/helpers/array'
import { divide, multiply, subtract } from '~/helpers/operator'

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
  (data: RequiredProperties<KlineData, 'h' | 'l' | 'c' | 'v'>[], { decimals, rounding }) => {
    const highs = mapPick(data, 'h', v => from(v, decimals))
    const lows = mapPick(data, 'l', v => from(v, decimals))
    const closings = mapPick(data, 'c', v => from(v, decimals))
    const volumes = mapPick(data, 'v', v => from(v, decimals))

    /** Money Flow Multiplier */
    const mfm = divide(
      subtract(
        subtract(closings, lows, decimals),
        subtract(highs, closings, decimals),
        decimals,
      ),
      subtract(highs, lows, decimals),
      { decimals, rounding },
    )

    /** Money Flow Volume */
    const mfv = multiply(mfm, volumes)

    let prevValue = from(0, decimals)

    return Array.from({ length: mfv.length }, (_, i) => {
      const currentValue = i === 0 ? mfv[i] : add(mfv[i], prevValue, decimals)
      return prevValue = currentValue
    })
  },
)

export { ad as accumulationDistribution }
