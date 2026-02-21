import type { CandleData, RequiredProperties } from '@vulcan-js/core'
import type { Dnum } from 'dnum'
import { assert, createSignal, fp18 } from '@vulcan-js/core'
import { createMmaxFp18 } from '../trend/movingMax'
import { createMminFp18 } from '../trend/movingMin'
import { createSmaFp18 } from '../trend/simpleMovingAverage'

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
    const mmaxProc = createMmaxFp18({ period: kPeriod })
    const mminProc = createMminFp18({ period: kPeriod })
    const slowingProc = slowingPeriod > 1 ? createSmaFp18({ period: slowingPeriod }) : null
    const dProc = createSmaFp18({ period: dPeriod })
    return (bar: RequiredProperties<CandleData, 'h' | 'l' | 'c'>) => {
      const h = fp18.toFp18(bar.h)
      const l = fp18.toFp18(bar.l)
      const c = fp18.toFp18(bar.c)

      const highestHigh = mmaxProc(h)
      const lowestLow = mminProc(l)

      const range = highestHigh - lowestLow
      const rawK = range === fp18.ZERO ? fp18.ZERO : fp18.div((c - lowestLow) * 100n, range)
      const k = slowingProc ? slowingProc(rawK) : rawK
      const d = dProc(k)
      return { k: fp18.toDnum(k), d: fp18.toDnum(d) }
    }
  },
  defaultStochasticOscillatorOptions,
)

export { stoch as stochasticOscillator }
