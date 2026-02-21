import type { Numberish } from 'dnum'
import { assert, createSignal } from '@vulcan-js/core'
import { mul, sub } from 'dnum'
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
 * @param source - Iterable of input values
 * @param options - Configuration options
 * @param options.period - The lookback period (default: 12)
 * @returns Generator yielding DEMA values
 */
export const dema = createSignal(
  ({ period }) => {
    assert(Number.isInteger(period) && period >= 1, new RangeError(`Expected period to be a positive integer, got ${period}`))
    const ema1 = ema.create({ period })
    const ema2 = ema.create({ period })
    return (value: Numberish) => {
      const e1 = ema1(value)
      const e2 = ema2(e1)
      return sub(mul(e1, 2, 18), e2)
    }
  },
  defaultDoubleExponentialMovingAverageOptions,
)

export { dema as doubleExponentialMovingAverage }
