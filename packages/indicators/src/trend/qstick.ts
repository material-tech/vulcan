import type { CandleData, RequiredProperties } from '@vulcan-js/core'
import { assert, createSignal } from '@vulcan-js/core'
import { from, subtract } from 'dnum'
import { sma } from './simpleMovingAverage'

export interface QstickOptions {
  /**
   * The period for Qstick calculation
   * @default 5
   */
  period: number
}

export const defaultQstickOptions: QstickOptions = {
  period: 5,
}

/**
 * Qstick Indicator
 *
 * Developed by Tushar Chande, Qstick quantifies candlestick patterns by
 * computing the moving average of the difference between close and open prices.
 * It measures the dominance of buying or selling pressure over a given period.
 *
 * Formula:
 *   Qstick = SMA(Close - Open, period)
 *
 * Interpretation:
 * - Positive values indicate buying pressure (closes above opens)
 * - Negative values indicate selling pressure (closes below opens)
 * - Zero-line crossovers signal potential trend changes
 *
 * @param source - Iterable of OHLC candle data
 * @param options - Configuration options
 * @param options.period - The period for SMA smoothing (default: 5)
 * @returns Generator yielding Qstick values as Dnum
 */
export const qstick = createSignal(
  ({ period }) => {
    assert(Number.isInteger(period) && period >= 1, new RangeError(`Expected period to be a positive integer, got ${period}`))
    const smaProc = sma.create({ period })

    return (bar: RequiredProperties<CandleData, 'o' | 'c'>) => {
      const o = from(bar.o, 18)
      const c = from(bar.c, 18)
      const diff = subtract(c, o)
      return smaProc(diff)
    }
  },
  defaultQstickOptions,
)

export { qstick as qstickIndicator }
