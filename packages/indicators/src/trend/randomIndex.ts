import type { CandleData, RequiredProperties } from '@vulcan-js/core'
import type { Dnum } from 'dnum'
import { assert, createSignal } from '@vulcan-js/core'
import { add, div, eq, from, mul, sub } from 'dnum'
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

    const HUNDRED = from(100, 18)
    const INITIAL = from(50, 18)
    const THREE = from(3, 18)
    const TWO = from(2, 18)

    let prevK: Dnum = INITIAL
    let prevD: Dnum = INITIAL
    let isFirst = true

    return (bar: RequiredProperties<CandleData, 'h' | 'l' | 'c'>) => {
      const h = from(bar.h, 18)
      const l = from(bar.l, 18)
      const c = from(bar.c, 18)

      const highestHigh = mmaxProc(h)
      const lowestLow = mminProc(l)

      const range = sub(highestHigh, lowestLow, 18)
      const rsv = eq(range, 0) ? from(0, 18) : mul(div(sub(c, lowestLow, 18), range, 18), HUNDRED, 18)

      let k: Dnum
      let d: Dnum

      if (isFirst) {
        // First bar: K = (2/3)*50 + (1/3)*RSV, D = (2/3)*50 + (1/3)*K
        k = add(mul(div(from(kPeriod - 1, 18), kPeriod, 18), INITIAL, 18), mul(div(from(1, 18), kPeriod, 18), rsv, 18))
        d = add(mul(div(from(dPeriod - 1, 18), dPeriod, 18), INITIAL, 18), mul(div(from(1, 18), dPeriod, 18), k, 18))
        isFirst = false
      }
      else {
        k = add(mul(div(from(kPeriod - 1, 18), kPeriod, 18), prevK, 18), mul(div(from(1, 18), kPeriod, 18), rsv, 18))
        d = add(mul(div(from(dPeriod - 1, 18), dPeriod, 18), prevD, 18), mul(div(from(1, 18), dPeriod, 18), k, 18))
      }

      const j = sub(mul(THREE, k, 18), mul(TWO, d, 18), 18)

      prevK = k
      prevD = d

      return { k, d, j }
    }
  },
  defaultRandomIndexOptions,
)

export { kdj as randomIndex }
