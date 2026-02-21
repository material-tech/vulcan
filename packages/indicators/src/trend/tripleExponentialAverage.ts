import type { Dnum, Numberish } from 'dnum'
import { assert, createSignal } from '@vulcan-js/core'
import { divide, from, multiply, subtract } from 'dnum'
import { ema } from './exponentialMovingAverage'

export interface TripleExponentialAverageOptions {
  period: number
}

export const defaultTripleExponentialAverageOptions: TripleExponentialAverageOptions = {
  period: 15,
}

/**
 * Triple Exponential Average (TRIX)
 *
 * TRIX is a momentum oscillator that displays the percentage rate of change
 * of a triple exponentially smoothed moving average. It oscillates around zero,
 * filtering out insignificant price movements.
 *
 * TRIX = (EMA3_current - EMA3_previous) / EMA3_previous * 100
 *
 * Where EMA3 = EMA(EMA(EMA(source, period), period), period)
 *
 * @param source - Iterable of input values
 * @param options - Configuration options
 * @param options.period - The lookback period (default: 15)
 * @returns Generator yielding TRIX values as percentages
 */
export const trix = createSignal(
  ({ period }) => {
    assert(Number.isInteger(period) && period >= 1, new RangeError(`Expected period to be a positive integer, got ${period}`))
    const ema1 = ema.create({ period })
    const ema2 = ema.create({ period })
    const ema3 = ema.create({ period })
    let prevEma3: Dnum | null = null
    return (value: Numberish) => {
      const e1 = ema1(value)
      const e2 = ema2(e1)
      const e3 = ema3(e2)
      if (prevEma3 === null) {
        prevEma3 = e3
        return from(0, 18)
      }
      const result = multiply(divide(subtract(e3, prevEma3), prevEma3, 18), 100, 18)
      prevEma3 = e3
      return result
    }
  },
  defaultTripleExponentialAverageOptions,
)

export { trix as tripleExponentialAverage }
