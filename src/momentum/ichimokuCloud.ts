import type { Dnum } from 'dnum'
import type { KlineData, RequiredProperties } from '~/types'
import { add, div, from, gt, lt } from 'dnum'
import { createSignal } from '~/base'
import { mapPick } from '~/helpers/array'
import { assert } from '~/helpers/assert'
import { max, min } from '~/helpers/operations'

export interface IchimokuCloudOptions {
  /**
   * Conversion line period
   *
   * @default 9
   */
  conversionPeriod?: number
  /**
   * Base line period
   *
   * @default 26
   */
  basePeriod?: number
  /**
   * Leading span B period
   *
   * @default 52
   */
  leadingBPeriod?: number
  /**
   * Displacement period
   *
   * @default 26
   */
  displacement?: number
}

export const defaultIchimokuCloudOptions: IchimokuCloudOptions = {
  conversionPeriod: 9,
  basePeriod: 26,
  leadingBPeriod: 52,
  displacement: 26,
}

export interface IchimokuCloudResult {
  conversion: Dnum[]
  base: Dnum[]
  leadingA: Dnum[]
  leadingB: Dnum[]
  lagging: Dnum[]
}

export const ichimokuCloud = createSignal({
  compute: (
    data: RequiredProperties<KlineData, 'h' | 'l' | 'c' | 'v'>[],
    { conversionPeriod, basePeriod, leadingBPeriod, displacement },
  ) => {
    assert(
      data.length > Math.max(conversionPeriod, basePeriod, leadingBPeriod),
      'data length must be greater than the maximum of conversionPeriod, basePeriod, leadingBPeriod',
    )
    const highs = mapPick(data, 'h', v => from(v, 18))
    const lows = mapPick(data, 'l', v => from(v, 18))
    const closings = mapPick(data, 'c', v => from(v, 18))

    const createMovingAverage = (period: number) => {
      return Array.from({ length: highs.length }, (_, cur) => {
        const start = cur - period + 1
        if (start < 0) {
          return from(0)
        }
        const highest = max(highs, { period, start })
        const lowest = min(lows, { period, start })

        return div(add(highest, lowest), 2, 18)
      })
    }

    const conversion = createMovingAverage(conversionPeriod)
    const base = createMovingAverage(basePeriod)

    const leadingA = Array.from({ length: highs.length }, (_, cur) => {
      const displacedIndex = cur - displacement
      if (displacedIndex < 0) {
        return from(0)
      }
      return div(add(conversion[cur], base[cur]), 2, 18)
    })

    const leadingBBase = createMovingAverage(leadingBPeriod)
    const leadingB = Array.from({ length: highs.length }, (_, cur) => {
      const displacedIndex = cur - displacement
      if (displacedIndex < 0) {
        return from(0)
      }
      return leadingBBase[cur]
    })

    const lagging = Array.from({ length: highs.length }, (_, cur) => {
      const laggedIndex = cur + displacement
      if (laggedIndex >= closings.length) {
        return from(0)
      }
      return closings[cur]
    })

    return {
      conversion,
      base,
      leadingA,
      leadingB,
      lagging,
    }
  },
  stream: ({ conversionPeriod, basePeriod, leadingBPeriod, displacement }) => {
    // Buffers for donchian channels of different periods
    const highBufferConv: Dnum[] = []
    const lowBufferConv: Dnum[] = []
    const highBufferBase: Dnum[] = []
    const lowBufferBase: Dnum[] = []
    const highBufferLeadB: Dnum[] = []
    const lowBufferLeadB: Dnum[] = []
    let count = 0

    const donchianMid = (highBuf: Dnum[], lowBuf: Dnum[]): Dnum => {
      const highest = highBuf.reduce((m, c) => gt(c, m) ? c : m, highBuf[0])
      const lowest = lowBuf.reduce((m, c) => lt(c, m) ? c : m, lowBuf[0])
      return div(add(highest, lowest), 2, 18)
    }

    return (data: RequiredProperties<KlineData, 'h' | 'l' | 'c' | 'v'>) => {
      const high = from(data.h, 18)
      const low = from(data.l, 18)
      const close = from(data.c, 18)

      // Update conversion buffers
      highBufferConv.push(high)
      lowBufferConv.push(low)
      if (highBufferConv.length > conversionPeriod) {
        highBufferConv.shift()
        lowBufferConv.shift()
      }

      // Update base buffers
      highBufferBase.push(high)
      lowBufferBase.push(low)
      if (highBufferBase.length > basePeriod) {
        highBufferBase.shift()
        lowBufferBase.shift()
      }

      // Update leading B buffers
      highBufferLeadB.push(high)
      lowBufferLeadB.push(low)
      if (highBufferLeadB.length > leadingBPeriod) {
        highBufferLeadB.shift()
        lowBufferLeadB.shift()
      }

      // Conversion line: requires conversionPeriod data
      const conversion = highBufferConv.length >= conversionPeriod
        ? donchianMid(highBufferConv, lowBufferConv)
        : from(0)

      // Base line: requires basePeriod data
      const base = highBufferBase.length >= basePeriod
        ? donchianMid(highBufferBase, lowBufferBase)
        : from(0)

      // Leading A: needs displacement warm-up
      const leadingA = count >= displacement
        ? div(add(conversion, base), 2, 18)
        : from(0)

      // Leading B: needs displacement warm-up + leadingBPeriod data
      const leadingBBase = highBufferLeadB.length >= leadingBPeriod
        ? donchianMid(highBufferLeadB, lowBufferLeadB)
        : from(0)
      const leadingB = count >= displacement ? leadingBBase : from(0)

      // Lagging: in stream mode, always return current close
      const lagging = close

      count++

      return { conversion, base, leadingA, leadingB, lagging }
    }
  },
  defaultOptions: defaultIchimokuCloudOptions,
})
