import type { Numberish } from 'dnum'
import { createSignal } from '~/base'
import { multiply, subtract } from '~/helpers/operations'
import { ema } from './exponentialMovingAverage'

export interface DoubleExponentialMovingAverageOptions {
  period: number
}

export const defaultDoubleExponentialMovingAverageOptions: DoubleExponentialMovingAverageOptions = {
  period: 12,
}

/**
 * Double Exponential Moving Average (DEMA)
 *
 * DEMA reduces lag compared to a traditional EMA by applying the formula:
 * DEMA = 2 * EMA(data, period) - EMA(EMA(data, period), period)
 *
 * @param values - Array of input values
 * @param options - Configuration options
 * @param options.period - The lookback period (default: 12)
 * @returns Array of DEMA values
 */
export const dema = createSignal(
  (values: Numberish[], { period }) => {
    const ema1 = ema(values, { period })
    const ema2 = ema(ema1, { period })

    return subtract(multiply(ema1, 2, 18), ema2, 18)
  },
  defaultDoubleExponentialMovingAverageOptions,
)

export { dema as doubleExponentialMovingAverage }
