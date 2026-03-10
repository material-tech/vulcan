import type { CandleData, RequiredProperties } from '@vulcan-js/core'
import { assert, createSignal, fp18 } from '@vulcan-js/core'
import * as prim from '../primitives'

export interface DonchianChannelsOptions {
  /**
   * The period for calculating the channel (typically 20).
   * @default 20
   */
  period: number
}

export const defaultDonchianChannelsOptions: DonchianChannelsOptions = {
  period: 20,
}

export interface DonchianChannelsResult {
  /** Upper channel line (highest high over period) */
  upper: readonly [bigint, number]
  /** Middle line (average of upper and lower) */
  middle: readonly [bigint, number]
  /** Lower channel line (lowest low over period) */
  lower: readonly [bigint, number]
}

/**
 * Donchian Channels
 *
 * A volatility-based technical indicator developed by Richard Donchian.
 * It plots the highest high and lowest low over a specified period,
 * creating a channel that helps identify breakouts and trend strength.
 *
 * Formula:
 *   Upper = Highest High over period
 *   Lower = Lowest Low over period
 *   Middle = (Upper + Lower) / 2
 *
 * @param source - Iterable of OHLCV candle data
 * @param options - Configuration options
 * @param options.period - The period for calculating channels (default: 20)
 * @returns Generator yielding DonchianChannelsResult objects
 *
 * @example
 * ```ts
 * const channels = collect(donchianChannels(candles))
 * // Each result contains upper, middle, lower lines
 * ```
 */
export const donchianChannels = createSignal(
  ({ period }) => {
    assert(Number.isInteger(period) && period > 0, new RangeError(`Expected period to be a positive integer, got ${period}`))

    const maxHigh = prim.mmax(period)
    const minLow = prim.mmin(period)

    return (bar: RequiredProperties<CandleData, 'h' | 'l'>): DonchianChannelsResult => {
      const h = fp18.toFp18(bar.h)
      const l = fp18.toFp18(bar.l)

      // Upper = Highest High over period
      const upper = maxHigh(h)

      // Lower = Lowest Low over period
      const lower = minLow(l)

      // Middle = (Upper + Lower) / 2
      const middle = (upper + lower) / 2n

      return {
        upper: fp18.toDnum(upper),
        middle: fp18.toDnum(middle),
        lower: fp18.toDnum(lower),
      }
    }
  },
  defaultDonchianChannelsOptions,
)

export { donchianChannels as dc }
