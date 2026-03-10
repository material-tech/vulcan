import type { CandleData, RequiredProperties } from '@vulcan-js/core'
import { assert, createSignal, fp18 } from '@vulcan-js/core'
import * as prim from '../primitives'

export interface KeltnerChannelsOptions {
  /**
   * The period for calculating the EMA (middle line)
   * @default 20
   */
  period: number
  /**
   * The multiplier for ATR (determines channel width)
   * @default 2.0
   */
  multiplier: number
  /**
   * The period for calculating ATR
   * @default 10
   */
  atrPeriod: number
}

export const defaultKeltnerChannelsOptions: KeltnerChannelsOptions = {
  period: 20,
  multiplier: 2.0,
  atrPeriod: 10,
}

export interface KeltnerChannelsResult {
  /** Middle line (EMA of close prices) */
  middle: readonly [bigint, number]
  /** Upper channel line */
  upper: readonly [bigint, number]
  /** Lower channel line */
  lower: readonly [bigint, number]
}

/**
 * Keltner Channels
 *
 * A volatility-based envelope indicator developed by Chester Keltner.
 * Consists of an EMA (middle line) with an envelope based on ATR above and below.
 *
 * Formula:
 *   Middle Line = EMA(Close, period)
 *   Upper Line = Middle Line + (multiplier × ATR)
 *   Lower Line = Middle Line - (multiplier × ATR)
 *
 * @param source - Iterable of OHLC candle data
 * @param options - Configuration options
 * @param options.period - EMA period for middle line (default: 20)
 * @param options.multiplier - ATR multiplier for channel width (default: 2.0)
 * @param options.atrPeriod - ATR calculation period (default: 10)
 * @returns Generator yielding KeltnerChannelsResult objects
 *
 * @example
 * ```ts
 * const channels = collect(keltnerChannels(candles))
 * // Each result: { middle: [bigint, number], upper: [bigint, number], lower: [bigint, number] }
 * ```
 */
export const keltnerChannels = createSignal(
  ({ period, multiplier, atrPeriod }) => {
    assert(Number.isInteger(period) && period > 0, new RangeError(`Expected period to be a positive integer, got ${period}`))
    assert(multiplier > 0, new RangeError(`Expected multiplier to be positive, got ${multiplier}`))
    assert(Number.isInteger(atrPeriod) && atrPeriod > 0, new RangeError(`Expected atrPeriod to be a positive integer, got ${atrPeriod}`))

    const emaProc = prim.ema({ period })
    const rmaProc = prim.rma(atrPeriod)
    let prevClose: bigint | null = null

    return (bar: RequiredProperties<CandleData, 'h' | 'l' | 'c'>): KeltnerChannelsResult => {
      const high = fp18.toFp18(bar.h)
      const low = fp18.toFp18(bar.l)
      const close = fp18.toFp18(bar.c)

      // Calculate True Range
      const range1 = high - low
      let tr: bigint

      if (prevClose === null) {
        tr = range1
      }
      else {
        const range2 = high > prevClose ? high - prevClose : prevClose - high
        const range3 = low > prevClose ? low - prevClose : prevClose - low
        tr = range1 > range2 ? (range1 > range3 ? range1 : range3) : (range2 > range3 ? range2 : range3)
      }

      prevClose = close

      // Calculate ATR (using RMA)
      const atr = rmaProc(tr)

      // Calculate Middle Line (EMA of close)
      const middle = emaProc(close)

      // Calculate channel offset
      const offset = fp18.mul(atr, fp18.from(multiplier))

      // Upper and Lower bands
      const upper = middle + offset
      const lower = middle - offset

      return {
        middle: fp18.toDnum(middle),
        upper: fp18.toDnum(upper),
        lower: fp18.toDnum(lower),
      }
    }
  },
  defaultKeltnerChannelsOptions,
)

export { keltnerChannels as kc }
