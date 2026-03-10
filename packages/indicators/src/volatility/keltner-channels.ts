import type { CandleData, RequiredProperties } from '@vulcan-js/core'
import { assert, createSignal, fp18 } from '@vulcan-js/core'
import * as prim from '../primitives'

export interface KeltnerChannelsOptions {
  /**
   * The EMA period for the middle line (typically 20).
   * @default 20
   */
  emaPeriod: number
  /**
   * The ATR period for channel width (typically 10).
   * @default 10
   */
  atrPeriod: number
  /**
   * The multiplier for ATR to determine channel width (typically 2).
   * @default 2
   */
  multiplier: number
}

export const defaultKeltnerChannelsOptions: KeltnerChannelsOptions = {
  emaPeriod: 20,
  atrPeriod: 10,
  multiplier: 2,
}

export interface KeltnerChannelsResult {
  /** Upper channel line */
  upper: readonly [bigint, number]
  /** Middle line (EMA of typical price) */
  middle: readonly [bigint, number]
  /** Lower channel line */
  lower: readonly [bigint, number]
}

/**
 * Keltner Channels
 *
 * A volatility-based technical indicator that uses an exponential moving average
 * (EMA) as the middle line and Average True Range (ATR) to set the channel width.
 * The channels expand and contract based on market volatility.
 *
 * Formula:
 *   Typical Price = (High + Low + Close) / 3
 *   Middle Line = EMA(Typical Price, emaPeriod)
 *   Upper = Middle + (ATR × multiplier)
 *   Lower = Middle - (ATR × multiplier)
 *
 * @param source - Iterable of OHLCV candle data
 * @param options - Configuration options
 * @param options.emaPeriod - The EMA period for middle line (default: 20)
 * @param options.atrPeriod - The ATR period for channel width (default: 10)
 * @param options.multiplier - The ATR multiplier for channel width (default: 2)
 * @returns Generator yielding KeltnerChannelsResult objects
 *
 * @example
 * ```ts
 * const channels = collect(keltnerChannels(candles))
 * // Each result contains upper, middle, lower lines
 * ```
 */
export const keltnerChannels = createSignal(
  ({ emaPeriod, atrPeriod, multiplier }) => {
    assert(Number.isInteger(emaPeriod) && emaPeriod > 0, new RangeError(`Expected emaPeriod to be a positive integer, got ${emaPeriod}`))
    assert(Number.isInteger(atrPeriod) && atrPeriod > 0, new RangeError(`Expected atrPeriod to be a positive integer, got ${atrPeriod}`))
    assert(multiplier > 0, new RangeError(`Expected multiplier to be positive, got ${multiplier}`))

    const ema = prim.ema({ period: emaPeriod })
    const atrRma = prim.rma({ period: atrPeriod })

    const multFp = fp18.from(multiplier)

    let prevClose: bigint | undefined

    return (bar: RequiredProperties<CandleData, 'h' | 'l' | 'c'>): KeltnerChannelsResult => {
      const h = fp18.toFp18(bar.h)
      const l = fp18.toFp18(bar.l)
      const c = fp18.toFp18(bar.c)

      // Typical Price = (High + Low + Close) / 3
      const typicalPrice = fp18.div(h + l + c, fp18.from(3))

      // Middle line = EMA of typical price
      const middle = ema(typicalPrice)

      // Calculate True Range
      // TR = max(High - Low, |High - PrevClose|, |Low - PrevClose|)
      let tr = h - l // High - Low
      if (prevClose !== undefined) {
        const highMinusPrevClose = h > prevClose ? h - prevClose : prevClose - h
        const lowMinusPrevClose = l > prevClose ? l - prevClose : prevClose - l
        tr = tr > highMinusPrevClose ? tr : highMinusPrevClose
        tr = tr > lowMinusPrevClose ? tr : lowMinusPrevClose
      }
      prevClose = c

      // ATR = RMA of TR
      const atrValue = atrRma(tr)

      // Upper = Middle + (ATR × multiplier)
      const upper = middle + fp18.mul(atrValue, multFp)

      // Lower = Middle - (ATR × multiplier)
      const lower = middle - fp18.mul(atrValue, multFp)

      return {
        upper: fp18.toDnum(upper),
        middle: fp18.toDnum(middle),
        lower: fp18.toDnum(lower),
      }
    }
  },
  defaultKeltnerChannelsOptions,
)

export { keltnerChannels as kc }
