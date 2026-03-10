import type { CandleData, RequiredProperties } from '@vulcan-js/core'
import { assert, createSignal, fp18 } from '@vulcan-js/core'

export interface VWAPOptions {
  /**
   * The lookback period for rolling VWAP.
   * Set to 0 for cumulative VWAP (from the first bar).
   * @default 0
   */
  period: number
}

export const defaultVWAPOptions: VWAPOptions = {
  period: 0,
}

/**
 * Volume Weighted Average Price (VWAP)
 *
 * A trading benchmark that gives the average price a security has traded at
 * throughout the day, based on both volume and price. VWAP is important because
 * it provides traders with insight into both the trend and value of a security.
 *
 * Formula:
 *   Typical Price = (High + Low + Close) / 3
 *   VWAP = Σ(Typical Price × Volume) / Σ(Volume)
 *
 * When period = 0: cumulative VWAP from the first bar
 * When period > 0: rolling VWAP over the specified period
 *
 * @param source - Iterable of OHLCV candle data (requires high, low, close, volume)
 * @param options - Configuration options
 * @param options.period - The lookback period for rolling VWAP (default: 0 for cumulative)
 * @returns Generator yielding VWAP values as Dnum tuples
 *
 * @example
 * ```ts
 * // Cumulative VWAP
 * const vwapValues = collect(vwap(candles))
 *
 * // Rolling VWAP with 20-period window
 * const rollingVwap = collect(vwap(candles, { period: 20 }))
 * ```
 */
export const vwap = createSignal(
  ({ period }) => {
    assert(Number.isInteger(period) && period >= 0, new RangeError(`Expected period to be a non-negative integer, got ${period}`))

    // For rolling VWAP, use a windowed approach
    if (period > 0) {
      const typicalPrices: bigint[] = []
      const volumes: bigint[] = []
      let sumTPV = fp18.ZERO // Sum of Typical Price * Volume
      let sumVol = fp18.ZERO // Sum of Volume

      return (bar: RequiredProperties<CandleData, 'h' | 'l' | 'c' | 'v'>): readonly [bigint, number] => {
        const h = fp18.toFp18(bar.h)
        const l = fp18.toFp18(bar.l)
        const c = fp18.toFp18(bar.c)
        const v = fp18.toFp18(bar.v)

        // Typical Price = (High + Low + Close) / 3
        const typicalPrice = fp18.div(h + l + c, fp18.from(3))
        const tpv = fp18.mul(typicalPrice, v)

        // Add current values
        typicalPrices.push(tpv)
        volumes.push(v)
        sumTPV += tpv
        sumVol += v

        // Remove oldest values if window exceeds period
        if (typicalPrices.length > period) {
          sumTPV -= typicalPrices.shift()!
          sumVol -= volumes.shift()!
        }

        // VWAP = Σ(TPV) / Σ(Volume)
        const result = sumVol === fp18.ZERO ? fp18.ZERO : fp18.div(sumTPV, sumVol)
        return fp18.toDnum(result)
      }
    }

    // For cumulative VWAP (period = 0)
    let sumTPV = fp18.ZERO
    let sumVol = fp18.ZERO

    return (bar: RequiredProperties<CandleData, 'h' | 'l' | 'c' | 'v'>): readonly [bigint, number] => {
      const h = fp18.toFp18(bar.h)
      const l = fp18.toFp18(bar.l)
      const c = fp18.toFp18(bar.c)
      const v = fp18.toFp18(bar.v)

      // Typical Price = (High + Low + Close) / 3
      const typicalPrice = fp18.div(h + l + c, fp18.from(3))
      const tpv = fp18.mul(typicalPrice, v)

      // Accumulate
      sumTPV += tpv
      sumVol += v

      // VWAP = Σ(TPV) / Σ(Volume)
      const result = sumVol === fp18.ZERO ? fp18.ZERO : fp18.div(sumTPV, sumVol)
      return fp18.toDnum(result)
    }
  },
  defaultVWAPOptions,
)

export { vwap as volumeWeightedAveragePrice }
