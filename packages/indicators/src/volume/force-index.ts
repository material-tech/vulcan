import type { CandleData, RequiredProperties } from '@vulcan-js/core'
import { assert, createSignal, fp18 } from '@vulcan-js/core'
import * as prim from '../primitives'

export interface ForceIndexOptions {
  /**
   * The EMA smoothing period for Force Index.
   * @default 13
   */
  period: number
}

export const defaultForceIndexOptions: ForceIndexOptions = {
  period: 13,
}

/**
 * Force Index
 *
 * A technical indicator that measures the amount of power used to move the price
 * of an asset. It combines price change and volume to assess the force behind
 * price movements. Positive values indicate buying pressure, negative values
 * indicate selling pressure.
 *
 * Formula:
 *   Raw Force Index = (Current Close - Prior Close) × Volume
 *   Force Index = EMA(Raw Force Index, period)
 *
 * @param source - Iterable of OHLCV candle data (requires close and volume)
 * @param options - Configuration options
 * @param options.period - The EMA smoothing period (default: 13)
 * @returns Generator yielding Force Index values as Dnum tuples
 *
 * @example
 * ```ts
 * const fiValues = collect(forceIndex(candles))
 * // Each value is a Dnum tuple: [bigint, number]
 * ```
 */
export const forceIndex = createSignal(
  ({ period }) => {
    assert(Number.isInteger(period) && period > 0, new RangeError(`Expected period to be a positive integer, got ${period}`))

    const ema = prim.ema({ period })
    let prevClose: bigint | undefined

    return (bar: RequiredProperties<CandleData, 'c' | 'v'>): readonly [bigint, number] => {
      const close = fp18.toFp18(bar.c)
      const volume = fp18.toFp18(bar.v)

      let rawFI = fp18.ZERO

      if (prevClose !== undefined) {
        // Raw Force Index = (Close - Prior Close) × Volume
        const priceChange = close - prevClose
        rawFI = fp18.mul(priceChange, volume)
      }

      prevClose = close

      // Apply EMA smoothing
      const smoothedFI = ema(rawFI)
      return fp18.toDnum(smoothedFI)
    }
  },
  defaultForceIndexOptions,
)

export { forceIndex as fi }
