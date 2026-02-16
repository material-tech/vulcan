import type { Dnum, Numberish } from 'dnum'
import { defu } from 'defu'
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
export function* macd(
  source: Iterable<Numberish>,
  options?: Partial<MACDOptions>,
): Generator<MACDPoint> {
  const { fastPeriod, slowPeriod, signalPeriod } = defu(options, defaultMACDOptions) as Required<MACDOptions>
  const fastProc = ema.createProcessor({ period: fastPeriod })
  const slowProc = ema.createProcessor({ period: slowPeriod })
  const signalProc = ema.createProcessor({ period: signalPeriod })

  for (const value of source) {
    const fast = fastProc(value)
    const slow = slowProc(value)
    const m = sub(fast, slow)
    const sig = signalProc(m)
    yield { macd: m, signal: sig, histogram: sub(m, sig) }
  }
}

export { macd as movingAverageConvergenceDivergence }
