import type { Dnum, Numberish } from 'dnum'
import { add, divide, equal, from, multiply, subtract } from 'dnum'
import { createSignal } from '~/base'

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

function linearRegressionCFO(window: Dnum[]): Dnum {
  const n = window.length
  if (n < 2) {
    return from(0, 18)
  }

  // Precompute X-related sums as plain integers
  const xSum = n * (n + 1) / 2
  const x2Sum = n * (n + 1) * (2 * n + 1) / 6
  const denom = n * x2Sum - xSum * xSum

  // Compute Y-dependent sums (keep all Dnum at 18 decimals)
  let sumY: Dnum = from(0, 18)
  let sumXY: Dnum = from(0, 18)
  for (let i = 0; i < n; i++) {
    sumY = add(sumY, window[i])
    sumXY = add(sumXY, multiply(window[i], i + 1))
  }

  // slope = (n * SUM(XY) - SUM(X) * SUM(Y)) / denom
  const num = subtract(multiply(sumXY, n), multiply(sumY, xSum))
  const slope = divide(num, denom, 18)

  // intercept = (SUM(Y) - slope * SUM(X)) / n
  const intercept = divide(subtract(sumY, multiply(slope, xSum)), n, 18)

  // forecast = slope * n + intercept
  const forecast = add(multiply(slope, n), intercept)

  const close = window[n - 1]
  if (equal(close, 0)) {
    return from(0, 18)
  }

  return divide(multiply(subtract(close, forecast), 100), close, 18)
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
 * @param values - Array of price values
 * @param options - Configuration options
 * @param options.period - The period for linear regression (default: 14)
 * @returns Array of CFO values as percentages
 */
export const cfo = createSignal(({ period }: Required<ChandeForecastOscillatorOptions>) => {
  const buffer: Dnum[] = []
  return (value: Numberish) => {
    buffer.push(from(value, 18))
    if (buffer.length > period)
      buffer.shift()
    return linearRegressionCFO(buffer)
  }
}, defaultCFOOptions)

export { cfo as chandeForecastOscillator }
