import type { Numberish } from 'dnum'
import { assert, createSignal, fp18 } from '@vulcan-js/core'
import * as prim from '../primitives'

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
    const ema1 = prim.ewma(prim.ewma.k(period))
    const ema2 = prim.ewma(prim.ewma.k(period))
    const ema3 = prim.ewma(prim.ewma.k(period))
    let prevEma3: bigint | null = null
    return (value: Numberish) => {
      const e1 = ema1(fp18.toFp18(value))
      const e2 = ema2(e1)
      const e3 = ema3(e2)
      if (prevEma3 === null) {
        prevEma3 = e3
        return fp18.toDnum(fp18.ZERO)
      }
      const result = fp18.div((e3 - prevEma3) * 100n, prevEma3)
      prevEma3 = e3
      return fp18.toDnum(result)
    }
  },
  defaultTripleExponentialAverageOptions,
)

export { trix as tripleExponentialAverage }
