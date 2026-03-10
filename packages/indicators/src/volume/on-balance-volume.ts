import type { CandleData, RequiredProperties } from '@vulcan-js/core'
import { createSignal, fp18 } from '@vulcan-js/core'

/**
 * On-Balance Volume (OBV)
 *
 * A cumulative momentum indicator that uses volume flow to predict changes in price.
 * OBV adds volume on days when the price goes up and subtracts volume on days when
 * the price goes down. The direction of OBV divergence from price can indicate
 * potential trend reversals.
 *
 * Formula:
 *   If Close > Prior Close: OBV = Prior OBV + Volume
 *   If Close < Prior Close: OBV = Prior OBV - Volume
 *   If Close = Prior Close: OBV = Prior OBV (no change)
 *
 * OBV is a cumulative indicator that starts from 0.
 *
 * @param source - Iterable of OHLCV candle data (requires close and volume)
 * @returns Generator yielding OBV values as Dnum tuples
 *
 * @example
 * ```ts
 * const obvValues = collect(obv(candles))
 * // Each value is a Dnum tuple: [bigint, number]
 * ```
 */
export const obv = createSignal(
  () => {
    let prevOBV = fp18.ZERO
    let prevClose: bigint | undefined

    return (bar: RequiredProperties<CandleData, 'c' | 'v'>): readonly [bigint, number] => {
      const close = fp18.toFp18(bar.c)
      const volume = fp18.toFp18(bar.v)

      if (prevClose !== undefined) {
        if (close > prevClose) {
          // Close > Prior Close: add volume
          prevOBV += volume
        }
        else if (close < prevClose) {
          // Close < Prior Close: subtract volume
          prevOBV -= volume
        }
        // If close === prevClose, OBV stays the same
      }
      // For the first bar, OBV starts at 0

      prevClose = close
      return fp18.toDnum(prevOBV)
    }
  },
)

export { obv as onBalanceVolume }
