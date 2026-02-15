import type { Dnum, Numberish } from 'dnum'
import { from, subtract } from 'dnum'
import { createSignal } from '~/base'
import { subtract as mapSubtract } from '~/helpers/operations'
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

export interface MACDResult {
  macd: Dnum[]
  signal: Dnum[]
  histogram: Dnum[]
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
 * @param data - Array of price values
 * @param options - Configuration options
 * @param options.fastPeriod - Period for the fast EMA (default: 12)
 * @param options.slowPeriod - Period for the slow EMA (default: 26)
 * @param options.signalPeriod - Period for the signal EMA (default: 9)
 * @returns Object containing macd, signal, and histogram arrays
 */
export const macd = createSignal({
  compute: (
    data: Numberish[],
    { fastPeriod, slowPeriod, signalPeriod },
  ): MACDResult => {
    const closes = data.map(v => from(v))

    const fastEMA = ema(closes, { period: fastPeriod })
    const slowEMA = ema(closes, { period: slowPeriod })

    // MACD Line = Fast EMA - Slow EMA
    const macdValues = mapSubtract(fastEMA, slowEMA, 18)

    // Signal Line = EMA(signalPeriod, MACD)
    const signal = ema(macdValues, { period: signalPeriod })

    // Histogram = MACD - Signal
    const histogram = mapSubtract(macdValues, signal, 18)

    return {
      macd: macdValues,
      signal,
      histogram,
    }
  },
  stream: ({ fastPeriod, slowPeriod, signalPeriod }) => {
    const fastEma = ema.stream({ period: fastPeriod })
    const slowEma = ema.stream({ period: slowPeriod })
    const signalEma = ema.stream({ period: signalPeriod })
    return (value: Numberish) => {
      const v = from(value)
      const fast = fastEma(v)
      const slow = slowEma(v)
      const macdValue = subtract(fast, slow)
      const signal = signalEma(macdValue)
      const histogram = subtract(macdValue, signal)
      return { macd: macdValue, signal, histogram }
    }
  },
  defaultOptions: defaultMACDOptions,
})

export { macd as movingAverageConvergenceDivergence }
