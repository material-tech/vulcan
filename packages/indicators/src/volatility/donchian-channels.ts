import type { CandleData, RequiredProperties } from '@vulcan-js/core'
import { assert, createSignal, fp18 } from '@vulcan-js/core'

export interface DonchianChannelsOptions {
  /**
   * The period for calculating highest high and lowest low
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
 * A volatility indicator developed by Richard Donchian.
 * Consists of an upper band (highest high over N periods),
 * a lower band (lowest low over N periods), and a middle line.
 *
 * Formula:
 *   Upper = Highest High over period
 *   Lower = Lowest Low over period
 *   Middle = (Upper + Lower) / 2
 *
 * @param source - Iterable of OHLC candle data
 * @param options - Configuration options
 * @param options.period - The lookback period (default: 20)
 * @returns Generator yielding DonchianChannelsResult objects
 *
 * @example
 * ```ts
 * const channels = collect(donchianChannels(candles))
 * // Each result: { upper: [bigint, number], middle: [bigint, number], lower: [bigint, number] }
 * ```
 */
export const donchianChannels = createSignal(
  ({ period }) => {
    assert(Number.isInteger(period) && period > 0, new RangeError(`Expected period to be a positive integer, got ${period}`))

    const highs: bigint[] = []
    const lows: bigint[] = []

    return (bar: RequiredProperties<CandleData, 'h' | 'l'>): DonchianChannelsResult => {
      const high = fp18.toFp18(bar.h)
      const low = fp18.toFp18(bar.l)

      // Add current values
      highs.push(high)
      lows.push(low)

      // Keep only period number of values
      if (highs.length > period) {
        highs.shift()
        lows.shift()
      }

      // Calculate upper (highest high) and lower (lowest low)
      let upper = highs[0]
      let lower = lows[0]

      for (let i = 1; i < highs.length; i++) {
        if (highs[i] > upper)
          upper = highs[i]
        if (lows[i] < lower)
          lower = lows[i]
      }

      // Middle = (upper + lower) / 2
      const middle = fp18.div(upper + lower, fp18.from(2))

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
