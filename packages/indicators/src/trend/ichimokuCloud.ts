import type { CandleData, RequiredProperties } from '@vulcan-js/core'
import type { Dnum } from 'dnum'
import { assert, createSignal, fp18 } from '@vulcan-js/core'
import { createMmaxFp18 } from './movingMax'
import { createMminFp18 } from './movingMin'

export interface IchimokuCloudOptions {
  /** Conversion line period */
  conversionPeriod: number
  /** Base line period */
  basePeriod: number
  /** Leading span B period */
  leadingBPeriod: number
}

export const defaultIchimokuCloudOptions: IchimokuCloudOptions = {
  conversionPeriod: 9,
  basePeriod: 26,
  leadingBPeriod: 52,
}

export interface IchimokuCloudPoint {
  conversion: Dnum
  base: Dnum
  leadingA: Dnum
  leadingB: Dnum
  lagging: Dnum
}

/**
 * Ichimoku Cloud (Ichimoku Kinko Hyo)
 *
 * Computes raw values for each component. Displacement (shifting
 * Leading Spans forward and Lagging Span backward on the chart)
 * is a presentation concern left to the consumer.
 *
 * - Conversion (Tenkan-sen): (highest high + lowest low) / 2 over conversionPeriod
 * - Base (Kijun-sen): (highest high + lowest low) / 2 over basePeriod
 * - Leading Span A (Senkou A): (conversion + base) / 2
 * - Leading Span B (Senkou B): (highest high + lowest low) / 2 over leadingBPeriod
 * - Lagging (Chikou): current close price
 */
export const ichimokuCloud = createSignal(
  ({ conversionPeriod, basePeriod, leadingBPeriod }) => {
    assert(Number.isInteger(conversionPeriod) && conversionPeriod >= 1, new RangeError(`Expected conversionPeriod to be a positive integer, got ${conversionPeriod}`))
    assert(Number.isInteger(basePeriod) && basePeriod >= 1, new RangeError(`Expected basePeriod to be a positive integer, got ${basePeriod}`))
    assert(Number.isInteger(leadingBPeriod) && leadingBPeriod >= 1, new RangeError(`Expected leadingBPeriod to be a positive integer, got ${leadingBPeriod}`))
    const convHighProc = createMmaxFp18({ period: conversionPeriod })
    const convLowProc = createMminFp18({ period: conversionPeriod })
    const baseHighProc = createMmaxFp18({ period: basePeriod })
    const baseLowProc = createMminFp18({ period: basePeriod })
    const leadBHighProc = createMmaxFp18({ period: leadingBPeriod })
    const leadBLowProc = createMminFp18({ period: leadingBPeriod })

    return (bar: RequiredProperties<CandleData, 'h' | 'l' | 'c'>) => {
      const h = fp18.toFp18(bar.h)
      const l = fp18.toFp18(bar.l)

      const conversion = (convHighProc(h) + convLowProc(l)) / 2n
      const base = (baseHighProc(h) + baseLowProc(l)) / 2n
      const leadingA = (conversion + base) / 2n
      const leadingB = (leadBHighProc(h) + leadBLowProc(l)) / 2n

      return {
        conversion: fp18.toDnum(conversion),
        base: fp18.toDnum(base),
        leadingA: fp18.toDnum(leadingA),
        leadingB: fp18.toDnum(leadingB),
        lagging: fp18.toDnum(fp18.toFp18(bar.c)),
      }
    }
  },
  defaultIchimokuCloudOptions,
)
