import type { Numberish } from 'dnum'
import { createSignal, fp18 } from '@vulcan-js/core'
import * as prim from '../primitives'

export interface StandardDeviationOptions {
  /**
   * The period for calculating the standard deviation
   * @default 20
   */
  period: number
}

export const defaultStandardDeviationOptions: StandardDeviationOptions = {
  period: 20,
}

/**
 * Standard Deviation (StdDev)
 *
 * Measures the dispersion of a dataset relative to its mean.
 * In trading, it's used to quantify volatility - higher standard deviation
 * indicates higher volatility.
 *
 * Formula (Population Standard Deviation):
 *   StdDev = sqrt( sum((x - mean)^2) / N )
 *
 * Where:
 *   x = individual price values
 *   mean = average of prices over the period
 *   N = period (number of values)
 *
 * Note: This uses population standard deviation (divides by N), not sample
 * standard deviation (which would divide by N-1), as is standard for technical indicators.
 *
 * @param source - Iterable of price values
 * @param options - Configuration options
 * @param options.period - The period for calculating standard deviation (default: 20)
 * @returns Generator yielding standard deviation values
 */
export const stdDev = createSignal(
  ({ period }) => {
    const proc = prim.stdDev(period)
    return (value: Numberish) => fp18.toDnum(proc(fp18.toFp18(value)))
  },
  defaultStandardDeviationOptions,
)

export { stdDev as standardDeviation }
