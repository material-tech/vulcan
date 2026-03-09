import type { CandleData, RequiredProperties } from '@vulcan-js/core'
import { assert, createSignal, fp18 } from '@vulcan-js/core'
import * as prim from '../primitives'

export interface AverageTrueRangeOptions {
  /**
   * The period for calculating the ATR
   * @default 14
   */
  period: number
}

export const defaultAverageTrueRangeOptions: AverageTrueRangeOptions = {
  period: 14,
}

/**
 * Average True Range (ATR)
 *
 * A volatility indicator developed by J. Welles Wilder. ATR measures
 * market volatility by decomposing the entire range of an asset price
 * for that period.
 *
 * True Range is the greatest of:
 *   1. Current High - Current Low
 *   2. |Current High - Previous Close|
 *   3. |Current Low - Previous Close|
 *
 * ATR is then calculated as the RMA (Rolling Moving Average) of True Range.
 *
 * Formula:
 *   TR = max(high - low, |high - prevClose|, |low - prevClose|)
 *   ATR = RMA(TR, period)
 *
 * @param source - Iterable of OHLC candle data (requires high, low, close)
 * @param options - Configuration options
 * @param options.period - The period for calculating ATR (default: 14)
 * @returns Generator yielding ATR values
 */
export const atr = createSignal(
  ({ period }) => {
    assert(Number.isInteger(period) && period >= 1, new RangeError(`Expected period to be a positive integer, got ${period}`))
    const rmaProc = prim.rma(period)
    let prevClose: bigint | null = null

    return (bar: RequiredProperties<CandleData, 'h' | 'l' | 'c'>) => {
      const high = fp18.toFp18(bar.h)
      const low = fp18.toFp18(bar.l)
      const close = fp18.toFp18(bar.c)

      const range1 = high - low
      let tr: bigint

      if (prevClose === null) {
        // First bar: true range is just high - low
        tr = range1
      }
      else {
        const range2 = high > prevClose ? high - prevClose : prevClose - high
        const range3 = low > prevClose ? low - prevClose : prevClose - low
        tr = range1 > range2 ? (range1 > range3 ? range1 : range3) : (range2 > range3 ? range2 : range3)
      }

      prevClose = close
      return fp18.toDnum(rmaProc(tr))
    }
  },
  defaultAverageTrueRangeOptions,
)

export { atr as averageTrueRange }
