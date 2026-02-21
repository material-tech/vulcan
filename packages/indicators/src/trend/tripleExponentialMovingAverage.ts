import type { Numberish } from 'dnum'
import { assert, createSignal } from '@vulcan-js/core'
import { add, mul, sub } from 'dnum'
import { ema } from './exponentialMovingAverage'

export interface TripleExponentialMovingAverageOptions {
  period: number
}

export const defaultTripleExponentialMovingAverageOptions: TripleExponentialMovingAverageOptions = {
  period: 12,
}

/**
 * Triple Exponential Moving Average (TEMA)
 *
 * TEMA further reduces lag compared to DEMA by applying the formula:
 * TEMA = 3 * EMA(data, period) - 3 * EMA(EMA(data, period), period) + EMA(EMA(EMA(data, period), period), period)
 *
 * @param source - Iterable of input values
 * @param options - Configuration options
 * @param options.period - The lookback period (default: 12)
 * @returns Generator yielding TEMA values
 */
export const tema = createSignal(
  ({ period }) => {
    assert(Number.isInteger(period) && period >= 1, new RangeError(`Expected period to be a positive integer, got ${period}`))
    const ema1 = ema.create({ period })
    const ema2 = ema.create({ period })
    const ema3 = ema.create({ period })
    return (value: Numberish) => {
      const e1 = ema1(value)
      const e2 = ema2(e1)
      const e3 = ema3(e2)
      // TEMA = 3 * EMA1 - 3 * EMA2 + EMA3
      return add(sub(mul(e1, 3, 18), mul(e2, 3, 18)), e3)
    }
  },
  defaultTripleExponentialMovingAverageOptions,
)

export { tema as tripleExponentialMovingAverage }
