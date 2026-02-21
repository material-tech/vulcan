import type { Dnum, Numberish } from 'dnum'
import { assert, createSignal, fp18 } from '@vulcan-js/core'
import { createEmaFp18 } from './exponentialMovingAverage'

export interface MACDOptions {
  fastPeriod: number
  slowPeriod: number
  signalPeriod: number
}

export const defaultMACDOptions: MACDOptions = {
  fastPeriod: 12,
  slowPeriod: 26,
  signalPeriod: 9,
}

export interface MACDPoint {
  macd: Dnum
  signal: Dnum
  histogram: Dnum
}

/**
 * Moving Average Convergence Divergence (MACD)
 *
 * MACD is a trend-following momentum indicator that shows the relationship
 * between two exponential moving averages of prices. It consists of three components:
 * - MACD Line: Fast EMA - Slow EMA
 * - Signal Line: EMA of the MACD line
 * - Histogram: MACD - Signal
 *
 * Formula:
 * - MACD = EMA(fastPeriod, prices) - EMA(slowPeriod, prices)
 * - Signal = EMA(signalPeriod, MACD)
 * - Histogram = MACD - Signal
 *
 * @param source - Iterable of price values
 * @param options - Configuration options
 * @param options.fastPeriod - Period for the fast EMA (default: 12)
 * @param options.slowPeriod - Period for the slow EMA (default: 26)
 * @param options.signalPeriod - Period for the signal EMA (default: 9)
 * @returns Generator yielding MACDPoint objects
 */
export const macd = createSignal(
  ({ fastPeriod, slowPeriod, signalPeriod }) => {
    assert(Number.isInteger(fastPeriod) && fastPeriod >= 1, new RangeError(`Expected fastPeriod to be a positive integer, got ${fastPeriod}`))
    assert(Number.isInteger(slowPeriod) && slowPeriod >= 1, new RangeError(`Expected slowPeriod to be a positive integer, got ${slowPeriod}`))
    assert(Number.isInteger(signalPeriod) && signalPeriod >= 1, new RangeError(`Expected signalPeriod to be a positive integer, got ${signalPeriod}`))
    const fastProc = createEmaFp18({ period: fastPeriod })
    const slowProc = createEmaFp18({ period: slowPeriod })
    const signalProc = createEmaFp18({ period: signalPeriod })
    return (value: Numberish) => {
      const v = fp18.toFp18(value)
      const fast = fastProc(v)
      const slow = slowProc(v)
      const m = fast - slow
      const sig = signalProc(m)
      return { macd: fp18.toDnum(m), signal: fp18.toDnum(sig), histogram: fp18.toDnum(m - sig) }
    }
  },
  defaultMACDOptions,
)

export { macd as movingAverageConvergenceDivergence }
