import type { Dnum } from 'dnum'
import type { KlineData, RequiredProperties } from '~/types'
import { add, divide, equal, from, multiply, subtract } from 'dnum'
import { createSignal } from '~/base'
import { mapPick } from '~/helpers/array'

/**
 * Accumulation/Distribution Indicator (A/D). Cumulative indicator
 * that uses volume and price to assess whether a stock is
 * being accumulated or distributed.
 *
 * MFM = ((Closing - Low) - (High - Closing)) / (High - Low)
 * MFV = MFM * Period Volume
 * AD = Previous AD + CMFV
 */
export const ad = createSignal({
  compute: (data: RequiredProperties<KlineData, 'h' | 'l' | 'c' | 'v'>[]) => {
    const highs = mapPick(data, 'h', v => from(v))
    const lows = mapPick(data, 'l', v => from(v))
    const closings = mapPick(data, 'c', v => from(v))
    const volumes = mapPick(data, 'v', v => from(v))

    let prevValue = from(0)

    return Array.from({ length: data.length }, (_, i) => {
      const range = subtract(highs[i], lows[i])
      let mfm: Dnum
      if (equal(range, 0)) {
        mfm = from(0, 18)
      }
      else {
        mfm = divide(
          subtract(subtract(closings[i], lows[i]), subtract(highs[i], closings[i])),
          range,
          18,
        )
      }
      const mfv = multiply(mfm, volumes[i])
      const currentValue = i === 0 ? mfv : add(mfv, prevValue)
      return prevValue = currentValue
    })
  },
  stream: () => {
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
  },
})

export { ad as accumulationDistribution }
