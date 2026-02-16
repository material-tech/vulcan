import type { Dnum } from 'dnum'
import type { KlineData, RequiredProperties } from '~/types'
import { defu } from 'defu'
import { div, from, mul, sub } from 'dnum'
import { collect } from '~/base'
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
export function* stoch(
  source: Iterable<RequiredProperties<KlineData, 'h' | 'l' | 'c'>>,
  options?: Partial<StochasticOscillatorOptions>,
): Generator<StochPoint> {
  const { kPeriod, slowingPeriod, dPeriod } = defu(options, defaultStochasticOscillatorOptions) as Required<StochasticOscillatorOptions>

  const mmaxProc = mmax.createProcessor({ period: kPeriod })
  const mminProc = mmin.createProcessor({ period: kPeriod })

  // First pass: compute raw K values
  const rawKValues: Dnum[] = []
  const data = Array.isArray(source) ? source : [...source]

  for (const bar of data) {
    const h = from(bar.h)
    const l = from(bar.l)
    const c = from(bar.c)

    const highestHigh = mmaxProc(h)
    const lowestLow = mminProc(l)

    const rawK = mul(div(sub(c, lowestLow, 18), sub(highestHigh, lowestLow, 18), 18), 100, 18)
    rawKValues.push(rawK)
  }

  // Apply slowing (smoothing)
  const kValues = slowingPeriod > 1
    ? collect(sma(rawKValues, { period: slowingPeriod }))
    : rawKValues

  // Apply %D smoothing
  const dProc = sma.createProcessor({ period: dPeriod })
  for (const kVal of kValues) {
    yield { k: kVal, d: dProc(kVal) }
  }
}

export { stoch as stochasticOscillator }
