import type { CandleData, RequiredProperties } from '@vulcan-js/core'
import { assert, createSignal, fp18 } from '@vulcan-js/core'
import { createMmaxFp18 } from '../trend/movingMax'
import { createMminFp18 } from '../trend/movingMin'

export interface WilliamsROptions {
  /** Lookback period */
  period: number
}

export const defaultWilliamsROptions: WilliamsROptions = {
  period: 14,
}

/**
 * Williams %R (WILLR)
 *
 * A momentum indicator that measures overbought and oversold conditions.
 * It shows the relationship between the closing price and the highest high / lowest low
 * over a specified period.
 *
 * Formula:
 * - %R = -100 * (Highest High - Close) / (Highest High - Lowest Low)
 *
 * Range: -100 to 0
 * - Above -20: Overbought
 * - Below -80: Oversold
 *
 * @param source - Iterable of candle data with high, low, and close
 * @param options - Configuration options
 * @param options.period - Lookback period (default: 14)
 * @returns Generator yielding Williams %R values as Dnum
 */
export const willr = createSignal(
  ({ period }) => {
    assert(Number.isInteger(period) && period >= 1, new RangeError(`Expected period to be a positive integer, got ${period}`))
    const mmaxProc = createMmaxFp18({ period })
    const mminProc = createMminFp18({ period })
    return (bar: RequiredProperties<CandleData, 'h' | 'l' | 'c'>) => {
      const h = fp18.toFp18(bar.h)
      const l = fp18.toFp18(bar.l)
      const c = fp18.toFp18(bar.c)

      const highestHigh = mmaxProc(h)
      const lowestLow = mminProc(l)

      const range = highestHigh - lowestLow
      if (range === fp18.ZERO)
        return fp18.toDnum(fp18.ZERO)
      return fp18.toDnum(fp18.div((highestHigh - c) * -100n, range))
    }
  },
  defaultWilliamsROptions,
)

export { willr as williamsR }
