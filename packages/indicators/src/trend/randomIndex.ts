import type { CandleData, RequiredProperties } from '@vulcan-js/core'
import type { Dnum } from 'dnum'
import { assert, constants, createSignal, toDnum } from '@vulcan-js/core'
import { add, div, eq, mul, sub } from 'dnum'
import { mmax } from './movingMax'
import { mmin } from './movingMin'

export interface RandomIndexOptions {
  /**
   * The lookback period for calculating RSV (Raw Stochastic Value)
   * @default 9
   */
  period: number
  /**
   * The smoothing period for K line
   * @default 3
   */
  kPeriod: number
  /**
   * The smoothing period for D line
   * @default 3
   */
  dPeriod: number
}

export const defaultRandomIndexOptions: RandomIndexOptions = {
  period: 9,
  kPeriod: 3,
  dPeriod: 3,
}

export interface KDJPoint {
  k: Dnum
  d: Dnum
  j: Dnum
}

/**
 * Random Index (KDJ)
 *
 * An extension of the Stochastic Oscillator that adds a J line to amplify
 * divergence between K and D. Uses exponential-weighted smoothing with
 * initial K and D values set to 50.
 *
 * Formula:
 *   RSV = (Close - LowestLow(period)) / (HighestHigh(period) - LowestLow(period)) × 100
 *   K = ((kPeriod - 1) / kPeriod) × prevK + (1 / kPeriod) × RSV
 *   D = ((dPeriod - 1) / dPeriod) × prevD + (1 / dPeriod) × K
 *   J = 3K - 2D
 *
 * Interpretation:
 * - K crossing above D is a bullish signal (golden cross)
 * - K crossing below D is a bearish signal (death cross)
 * - J below 0 indicates oversold, J above 100 indicates overbought
 *
 * @param source - Iterable of candle data with high, low, and close prices
 * @param options - Configuration options
 * @param options.period - The lookback period for RSV calculation (default: 9)
 * @param options.kPeriod - The smoothing period for K line (default: 3)
 * @param options.dPeriod - The smoothing period for D line (default: 3)
 * @returns Generator yielding KDJPoint values with k, d, and j as Dnum
 */
export const kdj = createSignal(
  ({ period, kPeriod, dPeriod }) => {
    assert(Number.isInteger(period) && period >= 1, new RangeError(`Expected period to be a positive integer, got ${period}`))
    assert(Number.isInteger(kPeriod) && kPeriod >= 1, new RangeError(`Expected kPeriod to be a positive integer, got ${kPeriod}`))
    assert(Number.isInteger(dPeriod) && dPeriod >= 1, new RangeError(`Expected dPeriod to be a positive integer, got ${dPeriod}`))

    const mmaxProc = mmax.create({ period })
    const mminProc = mmin.create({ period })

    const INITIAL = toDnum(50)
    const THREE = toDnum(3)

    let prevK: Dnum = INITIAL
    let prevD: Dnum = INITIAL
    let isFirst = true

    return (bar: RequiredProperties<CandleData, 'h' | 'l' | 'c'>) => {
      const h = toDnum(bar.h)
      const l = toDnum(bar.l)
      const c = toDnum(bar.c)

      const highestHigh = mmaxProc(h)
      const lowestLow = mminProc(l)

      const range = sub(highestHigh, lowestLow, constants.DECIMALS)
      const rsv = eq(range, 0) ? constants.ZERO : mul(div(sub(c, lowestLow, constants.DECIMALS), range, constants.DECIMALS), constants.HUNDRED, constants.DECIMALS)

      let k: Dnum
      let d: Dnum

      if (isFirst) {
        // First bar: K = (2/3)*50 + (1/3)*RSV, D = (2/3)*50 + (1/3)*K
        k = add(mul(div(toDnum(kPeriod - 1), kPeriod, constants.DECIMALS), INITIAL, constants.DECIMALS), mul(div(constants.ONE, kPeriod, constants.DECIMALS), rsv, constants.DECIMALS))
        d = add(mul(div(toDnum(dPeriod - 1), dPeriod, constants.DECIMALS), INITIAL, constants.DECIMALS), mul(div(constants.ONE, dPeriod, constants.DECIMALS), k, constants.DECIMALS))
        isFirst = false
      }
      else {
        k = add(mul(div(toDnum(kPeriod - 1), kPeriod, constants.DECIMALS), prevK, constants.DECIMALS), mul(div(constants.ONE, kPeriod, constants.DECIMALS), rsv, constants.DECIMALS))
        d = add(mul(div(toDnum(dPeriod - 1), dPeriod, constants.DECIMALS), prevD, constants.DECIMALS), mul(div(constants.ONE, dPeriod, constants.DECIMALS), k, constants.DECIMALS))
      }

      const j = sub(mul(THREE, k, constants.DECIMALS), mul(constants.TWO, d, constants.DECIMALS), constants.DECIMALS)

      prevK = k
      prevD = d

      return { k, d, j }
    }
  },
  defaultRandomIndexOptions,
)

export { kdj as randomIndex }
