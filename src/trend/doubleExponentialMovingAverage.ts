import type { Dnum, Numberish } from 'dnum'
import { mul, sub } from 'dnum'
import { createSignal } from '~/base'
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
export const dema = createSignal(({ period }) => {
  const ema1 = ema.next({ period })
  const ema2 = ema.next({ period })
  return (value: Numberish): Dnum => {
    const e1 = ema1(value)
    const e2 = ema2(e1)
    return sub(mul(e1, 2, 18), e2)
  }
}, defaultDoubleExponentialMovingAverageOptions)

export { dema as doubleExponentialMovingAverage }
