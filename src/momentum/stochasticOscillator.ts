import type { Dnum } from 'dnum'
import type { KlineData, Processor, RequiredProperties } from '~/types'
import { div, from, mul, sub } from 'dnum'
import { createGenerator } from '~/base'
import { mmax } from '~/trend/movingMax'
import { mmin } from '~/trend/movingMin'
import { sma } from '~/trend/simpleMovingAverage'

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
export const stoch = createGenerator(
  ({ kPeriod, slowingPeriod, dPeriod }: Required<StochasticOscillatorOptions>): Processor<RequiredProperties<KlineData, 'h' | 'l' | 'c'>, StochPoint> => {
    const mmaxProc = mmax.create({ period: kPeriod })
    const mminProc = mmin.create({ period: kPeriod })
    const slowingProc = slowingPeriod > 1 ? sma.create({ period: slowingPeriod }) : null
    const dProc = sma.create({ period: dPeriod })
    return (bar) => {
      const h = from(bar.h)
      const l = from(bar.l)
      const c = from(bar.c)

      const highestHigh = mmaxProc(h)
      const lowestLow = mminProc(l)

      const rawK = mul(div(sub(c, lowestLow, 18), sub(highestHigh, lowestLow, 18), 18), 100, 18)
      const k = slowingProc ? slowingProc(rawK) : rawK
      return { k, d: dProc(k) }
    }
  },
  defaultStochasticOscillatorOptions,
)

export { stoch as stochasticOscillator }
