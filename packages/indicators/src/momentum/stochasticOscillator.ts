import type { CandleData, RequiredProperties } from '@material-tech/vulcan-core'
import type { Dnum } from 'dnum'
import { assert, createSignal } from '@material-tech/vulcan-core'
import { div, eq, from, mul, sub } from 'dnum'
import { mmax } from '../trend/movingMax'
import { mmin } from '../trend/movingMin'
import { sma } from '../trend/simpleMovingAverage'

export interface StochasticOscillatorOptions {
  /** The %k period */
  kPeriod: number
  /** The %k slowing period */
  slowingPeriod: number
  /** The %d period  */
  dPeriod: number
}

export const defaultStochasticOscillatorOptions: StochasticOscillatorOptions = {
  kPeriod: 14,
  slowingPeriod: 1,
  dPeriod: 3,
}

export interface StochPoint {
  k: Dnum
  d: Dnum
}

/**
 * Stochastic Oscillator
 *
 * %K = ((Close - Lowest Low) / (Highest High - Lowest Low)) * 100
 * %D = SMA(%K, dPeriod)
 */
export const stoch = createSignal(
  ({ kPeriod, slowingPeriod, dPeriod }) => {
    assert(Number.isInteger(kPeriod) && kPeriod >= 1, new RangeError(`Expected kPeriod to be a positive integer, got ${kPeriod}`))
    assert(Number.isInteger(slowingPeriod) && slowingPeriod >= 1, new RangeError(`Expected slowingPeriod to be a positive integer, got ${slowingPeriod}`))
    assert(Number.isInteger(dPeriod) && dPeriod >= 1, new RangeError(`Expected dPeriod to be a positive integer, got ${dPeriod}`))
    const mmaxProc = mmax.create({ period: kPeriod })
    const mminProc = mmin.create({ period: kPeriod })
    const slowingProc = slowingPeriod > 1 ? sma.create({ period: slowingPeriod }) : null
    const dProc = sma.create({ period: dPeriod })
    return (bar: RequiredProperties<CandleData, 'h' | 'l' | 'c'>) => {
      const h = from(bar.h, 18)
      const l = from(bar.l, 18)
      const c = from(bar.c, 18)

      const highestHigh = mmaxProc(h)
      const lowestLow = mminProc(l)

      const range = sub(highestHigh, lowestLow, 18)
      const rawK = eq(range, 0) ? from(0, 18) : mul(div(sub(c, lowestLow, 18), range, 18), 100, 18)
      const k = slowingProc ? slowingProc(rawK) : rawK
      return { k, d: dProc(k) }
    }
  },
  defaultStochasticOscillatorOptions,
)

export { stoch as stochasticOscillator }
