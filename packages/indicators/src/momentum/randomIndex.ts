import type { CandleData, RequiredProperties } from '@vulcan-js/core'
import type { Dnum } from 'dnum'
import { assert, createSignal, fp18 } from '@vulcan-js/core'
import * as prim from '../primitives'

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
 *   RSV = (Close - LowestLow(period)) / (HighestHigh(period) - LowestLow(period)) * 100
 *   K = ((kPeriod - 1) / kPeriod) * prevK + (1 / kPeriod) * RSV
 *   D = ((dPeriod - 1) / dPeriod) * prevD + (1 / dPeriod) * K
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

    const mmaxProc = prim.mmax(period)
    const mminProc = prim.mmin(period)

    const INITIAL = 50n * fp18.SCALE
    const kPeriodBig = BigInt(kPeriod)
    const dPeriodBig = BigInt(dPeriod)

    let prevK = INITIAL
    let prevD = INITIAL
    let isFirst = true

    return (bar: RequiredProperties<CandleData, 'h' | 'l' | 'c'>) => {
      const h = fp18.toFp18(bar.h)
      const l = fp18.toFp18(bar.l)
      const c = fp18.toFp18(bar.c)

      const highestHigh = mmaxProc(h)
      const lowestLow = mminProc(l)

      const range = highestHigh - lowestLow
      const rsv = range === fp18.ZERO ? fp18.ZERO : fp18.div((c - lowestLow) * 100n, range)

      let k: bigint
      let d: bigint

      if (isFirst) {
        k = INITIAL * (kPeriodBig - 1n) / kPeriodBig + rsv / kPeriodBig
        d = INITIAL * (dPeriodBig - 1n) / dPeriodBig + k / dPeriodBig
        isFirst = false
      }
      else {
        k = prevK * (kPeriodBig - 1n) / kPeriodBig + rsv / kPeriodBig
        d = prevD * (dPeriodBig - 1n) / dPeriodBig + k / dPeriodBig
      }

      const j = k * 3n - d * 2n

      prevK = k
      prevD = d

      return { k: fp18.toDnum(k), d: fp18.toDnum(d), j: fp18.toDnum(j) }
    }
  },
  defaultRandomIndexOptions,
)

export { kdj as randomIndex }
