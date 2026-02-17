import type { Dnum, Numberish } from 'dnum'
import { createSignal } from '@material-tech/alloy-core'
import { sub } from 'dnum'
import { ema } from './exponentialMovingAverage'

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
    const fastProc = ema.create({ period: fastPeriod })
    const slowProc = ema.create({ period: slowPeriod })
    const signalProc = ema.create({ period: signalPeriod })
    return (value: Numberish) => {
      const fast = fastProc(value)
      const slow = slowProc(value)
      const m = sub(fast, slow)
      const sig = signalProc(m)
      return { macd: m, signal: sig, histogram: sub(m, sig) }
    }
  },
  defaultMACDOptions,
)

export { macd as movingAverageConvergenceDivergence }
