import type { Numberish } from 'dnum'
import { assert, createSignal, fp18 } from '@vulcan-js/core'
import * as prim from '../primitives'

export interface BollingerBandsOptions {
  /**
   * The period for calculating the moving average and standard deviation
   * @default 20
   */
  period: number
  /**
   * The number of standard deviations to use for the bands
   * @default 2
   */
  stdDevMultiplier: number
}

export const defaultBollingerBandsOptions: BollingerBandsOptions = {
  period: 20,
  stdDevMultiplier: 2,
}

export interface BollingerBandsResult {
  /** The middle band (SMA) */
  middle: [bigint, number]
  /** The upper band (SMA + k * StdDev) */
  upper: [bigint, number]
  /** The lower band (SMA - k * StdDev) */
  lower: [bigint, number]
  /** The bandwidth: (upper - lower) / middle */
  bandwidth: [bigint, number]
  /** The %B indicator: (price - lower) / (upper - lower) */
  percentB: [bigint, number]
}

/**
 * Bollinger Bands
 *
 * A volatility indicator developed by John Bollinger. It consists of:
 * - Middle Band: Simple Moving Average (SMA) of the price
 * - Upper Band: SMA + (k × Standard Deviation)
 * - Lower Band: SMA - (k × Standard Deviation)
 *
 * Where k is typically 2 (configurable via stdDevMultiplier).
 *
 * Additional outputs:
 * - Bandwidth: Measures the width of the bands relative to the middle band
 *   Bandwidth = (Upper - Lower) / Middle
 * - %B: Shows where the price is relative to the bands
 *   %B = (Price - Lower) / (Upper - Lower)
 *   %B > 1: Price above upper band
 *   %B < 0: Price below lower band
 *   %B = 0.5: Price at middle band
 *
 * Formula:
 *   Middle = SMA(price, period)
 *   StdDev = Population Standard Deviation(price, period)
 *   Upper = Middle + (stdDevMultiplier × StdDev)
 *   Lower = Middle - (stdDevMultiplier × StdDev)
 *
 * @param source - Iterable of price values
 * @param options - Configuration options
 * @param options.period - The period for calculations (default: 20)
 * @param options.stdDevMultiplier - Number of standard deviations (default: 2)
 * @returns Generator yielding BollingerBandsResult with middle, upper, lower, bandwidth, and percentB
 */
export const bb = createSignal(
  ({ period, stdDevMultiplier }) => {
    assert(Number.isInteger(period) && period >= 1, new RangeError(`Expected period to be a positive integer, got ${period}`))
    assert(stdDevMultiplier > 0, new RangeError(`Expected stdDevMultiplier to be positive, got ${stdDevMultiplier}`))

    const smaProc = prim.sma(period)
    const stdDevProc = prim.stdDev(period)
    const multiplierFp18 = fp18.toFp18(stdDevMultiplier)

    return (value: Numberish): BollingerBandsResult => {
      const price = fp18.toFp18(value)
      const middle = smaProc(price)
      const stdDev = stdDevProc(price)

      // Upper = Middle + (multiplier × StdDev)
      const upper = middle + fp18.mul(multiplierFp18, stdDev)

      // Lower = Middle - (multiplier × StdDev)
      const lower = middle - fp18.mul(multiplierFp18, stdDev)

      // Bandwidth = (Upper - Lower) / Middle
      // If middle is 0, bandwidth is 0
      let bandwidth = fp18.ZERO
      if (middle !== fp18.ZERO) {
        bandwidth = fp18.div(upper - lower, middle)
      }

      // %B = (Price - Lower) / (Upper - Lower)
      // If upper === lower (flat bands), %B = 0.5
      let percentB = fp18.toFp18(0.5)
      if (upper !== lower) {
        percentB = fp18.div(price - lower, upper - lower)
      }

      return {
        middle: fp18.toDnum(middle),
        upper: fp18.toDnum(upper),
        lower: fp18.toDnum(lower),
        bandwidth: fp18.toDnum(bandwidth),
        percentB: fp18.toDnum(percentB),
      }
    }
  },
  defaultBollingerBandsOptions,
)

export { bb as bollingerBands }
