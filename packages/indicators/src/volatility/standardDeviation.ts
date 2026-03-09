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
 * Measures the amount of variation or dispersion of a set of values.
 * A low standard deviation indicates that the values tend to be close to the mean,
 * while a high standard deviation indicates that the values are spread out over a wider range.
 *
 * Formula: σ = sqrt(Σ(xi - μ)² / n)
 * Where:
 *   σ = Standard Deviation
 *   xi = Individual data points
 *   μ = Mean (average)
 *   n = Number of data points (period)
 *
 * Common use cases:
 * - Bollinger Bands (middle band ± 2 standard deviations)
 * - Volatility measurement
 * - Risk assessment in finance
 *
 * @param source - Iterable of price values
 * @param options - Configuration options
 * @param options.period - The period for calculating the standard deviation (default: 20)
 * @returns Generator yielding Standard Deviation values
 */
export const stdDev = createSignal(
  ({ period }) => {
    const proc = prim.stdDev(period)
    return (value: Numberish) => fp18.toDnum(proc(fp18.toFp18(value)))
  },
  defaultStandardDeviationOptions,
)

export { stdDev as standardDeviation }
