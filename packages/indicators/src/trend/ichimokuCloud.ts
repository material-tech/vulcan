import type { CandleData, RequiredProperties } from '@vulcan-js/core'
import type { Dnum } from 'dnum'
import { assert, createSignal } from '@vulcan-js/core'
import { add, div, from } from 'dnum'
import { mmax } from './movingMax'
import { mmin } from './movingMin'

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
    const convHighProc = mmax.create({ period: conversionPeriod })
    const convLowProc = mmin.create({ period: conversionPeriod })
    const baseHighProc = mmax.create({ period: basePeriod })
    const baseLowProc = mmin.create({ period: basePeriod })
    const leadBHighProc = mmax.create({ period: leadingBPeriod })
    const leadBLowProc = mmin.create({ period: leadingBPeriod })

    return (bar: RequiredProperties<CandleData, 'h' | 'l' | 'c'>) => {
      const h = from(bar.h, 18)
      const l = from(bar.l, 18)

      const conversion = div(add(convHighProc(h), convLowProc(l)), 2, 18)
      const base = div(add(baseHighProc(h), baseLowProc(l)), 2, 18)
      const leadingA = div(add(conversion, base), 2, 18)
      const leadingB = div(add(leadBHighProc(h), leadBLowProc(l)), 2, 18)

      return { conversion, base, leadingA, leadingB, lagging: from(bar.c, 18) }
    }
  },
  defaultIchimokuCloudOptions,
)
