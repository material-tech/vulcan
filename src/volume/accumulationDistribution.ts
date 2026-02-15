import type { Dnum } from 'dnum'
import type { KlineData, RequiredProperties } from '~/types'
import { add, divide, equal, from, multiply, subtract } from 'dnum'
import { createSignal } from '~/base'

/**
 * Accumulation/Distribution Indicator (A/D). Cumulative indicator
 * that uses volume and price to assess whether a stock is
 * being accumulated or distributed.
 *
 * MFM = ((Closing - Low) - (High - Closing)) / (High - Low)
 * MFV = MFM * Period Volume
 * AD = Previous AD + CMFV
 */
export const ad = createSignal(() => {
  let prevAD: Dnum = from(0)
  let first = true
  return (data: RequiredProperties<KlineData, 'h' | 'l' | 'c' | 'v'>) => {
    const high = from(data.h, 18)
    const low = from(data.l, 18)
    const close = from(data.c, 18)
    const volume = from(data.v, 18)
    const range = subtract(high, low)
    let mfm: Dnum
    if (equal(range, 0)) {
      mfm = from(0, 18)
    }
    else {
      mfm = divide(
        subtract(subtract(close, low), subtract(high, close)),
        range,
        18,
      )
    }
    const mfv = multiply(mfm, volume)
    if (first) {
      prevAD = mfv
      first = false
    }
    else {
      prevAD = add(mfv, prevAD)
    }
    return prevAD
  }
})

export { ad as accumulationDistribution }
