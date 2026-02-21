import type { CandleData, RequiredProperties } from '@vulcan-js/core'
import { assert, constants, createSignal, toDnum } from '@vulcan-js/core'
import { div, eq, mul, sub } from 'dnum'
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
      const h = toDnum(bar.h)
      const l = toDnum(bar.l)
      const c = toDnum(bar.c)

      const highestHigh = mmaxProc(h)
      const lowestLow = mminProc(l)

      const range = sub(highestHigh, lowestLow, constants.DECIMALS)
      return eq(range, 0)
        ? constants.ZERO
        : mul(div(sub(highestHigh, c, constants.DECIMALS), range, constants.DECIMALS), -100, constants.DECIMALS)
    }
  },
  defaultWilliamsROptions,
)

export { willr as williamsR }
