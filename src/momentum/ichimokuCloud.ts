import type { Dnum } from 'dnum'
import type { KlineData, RequiredProperties } from '~/types'
import { add, div, from } from 'dnum'
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

export const ichimokuCloud = createSignal(
  (
    data: RequiredProperties<KlineData, 'h' | 'l' | 'c' | 'v'>[],
    { conversionPeriod, basePeriod, leadingBPeriod, displacement },
  ) => {
    assert(
      data.length > Math.max(conversionPeriod, basePeriod, leadingBPeriod),
      'data length must be greater than the maximum of conversionPeriod, basePeriod, leadingBPeriod',
    )
    const highs = mapPick(data, 'h', v => from(v))
    const lows = mapPick(data, 'l', v => from(v))
    const closings = mapPick(data, 'c', v => from(v))

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
  defaultIchimokuCloudOptions,
)
