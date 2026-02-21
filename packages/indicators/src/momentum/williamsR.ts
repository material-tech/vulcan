import type { CandleData, RequiredProperties } from '@vulcan-js/core'
import { assert, createSignal } from '@vulcan-js/core'
import { div, eq, from, mul, sub } from 'dnum'
import { mmax } from '../trend/movingMax'
import { mmin } from '../trend/movingMin'

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
 * - %R = -100 × (Highest High - Close) / (Highest High - Lowest Low)
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
    const mmaxProc = mmax.create({ period })
    const mminProc = mmin.create({ period })
    return (bar: RequiredProperties<CandleData, 'h' | 'l' | 'c'>) => {
      const h = from(bar.h, 18)
      const l = from(bar.l, 18)
      const c = from(bar.c, 18)

      const highestHigh = mmaxProc(h)
      const lowestLow = mminProc(l)

      const range = sub(highestHigh, lowestLow, 18)
      return eq(range, 0)
        ? from(0, 18)
        : mul(div(sub(highestHigh, c, 18), range, 18), -100, 18)
    }
  },
  defaultWilliamsROptions,
)

export { willr as williamsR }
