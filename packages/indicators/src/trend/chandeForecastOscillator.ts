import type { Numberish } from 'dnum'
import { assert, createSignal, fp18 } from '@vulcan-js/core'

export interface ChandeForecastOscillatorOptions {
  /**
   * The period for linear regression
   * @default 14
   */
  period: number
}

export const defaultCFOOptions: ChandeForecastOscillatorOptions = {
  period: 14,
}

/**
 * Chande Forecast Oscillator (CFO)
 *
 * Measures the percentage difference between the actual close price and the
 * n-period linear regression forecast price. Positive values indicate bullish
 * momentum (price above forecast), negative values indicate bearish momentum.
 *
 * Formula: CFO = ((Close - Forecast) / Close) * 100
 * Where: Forecast = Linear regression value at current point
 *
 * @param source - Iterable of price values
 * @param options - Configuration options
 * @param options.period - The period for linear regression (default: 14)
 * @returns Generator yielding CFO values as percentages
 */
export const cfo = createSignal(
  ({ period }) => {
    assert(Number.isInteger(period) && period >= 1, new RangeError(`Expected period to be a positive integer, got ${period}`))
    const buffer: bigint[] = []

    return (value: Numberish) => {
      buffer.push(fp18.toFp18(value))
      if (buffer.length > period)
        buffer.shift()

      const n = buffer.length
      if (n < 2) {
        return fp18.toDnum(fp18.ZERO)
      }

      // Precompute X-related sums as plain integers
      const xSum = BigInt(n * (n + 1) / 2)
      const x2Sum = BigInt(n * (n + 1) * (2 * n + 1) / 6)
      const denom = BigInt(n) * x2Sum - xSum * xSum

      // Compute Y-dependent sums
      let sumY = fp18.ZERO
      let sumXY = fp18.ZERO
      for (let i = 0; i < n; i++) {
        sumY += buffer[i]
        sumXY += buffer[i] * BigInt(i + 1)
      }

      // slope = (n * SUM(XY) - SUM(X) * SUM(Y)) / denom
      const num = sumXY * BigInt(n) - sumY * xSum
      const slope = num / denom

      // intercept = (SUM(Y) - slope * SUM(X)) / n
      const intercept = (sumY - slope * xSum) / BigInt(n)

      // forecast = slope * n + intercept
      const forecast = slope * BigInt(n) + intercept

      const close = buffer[n - 1]
      if (close === fp18.ZERO) {
        return fp18.toDnum(fp18.ZERO)
      }

      return fp18.toDnum(fp18.div((close - forecast) * 100n, close))
    }
  },
  defaultCFOOptions,
)

export { cfo as chandeForecastOscillator }
