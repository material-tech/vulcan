import type { Dnum } from 'dnum'
import type { KlineData, RequiredProperties } from '~/types'
import { defu } from 'defu'
import { sub } from 'dnum'
import { collect } from '~/base'
import { ema } from '~/trend/exponentialMovingAverage'
import { ad } from '~/volume/accumulationDistribution'

export interface ChaikinOscillatorOptions {
  fastPeriod: number
  slowPeriod: number
}

export const defaultChaikinOscillatorOptions: ChaikinOscillatorOptions = {
  fastPeriod: 3,
  slowPeriod: 10,
}

/**
 * The ChaikinOscillator function measures the momentum of the
 * Accumulation/Distribution (A/D) using the Moving Average
 * Convergence Divergence (MACD) formula. It takes the
 * difference between fast and slow periods EMA of the A/D.
 * Cross above the A/D line indicates bullish.
 *
 * CO = Ema(fastPeriod, AD) - Ema(slowPeriod, AD)
 */
export function* cmo(
  source: Iterable<RequiredProperties<KlineData, 'h' | 'l' | 'c' | 'v'>>,
  options?: Partial<ChaikinOscillatorOptions>,
): Generator<Dnum> {
  const { fastPeriod, slowPeriod } = defu(options, defaultChaikinOscillatorOptions) as Required<ChaikinOscillatorOptions>

  const adValues = collect(ad(source))

  const fastProc = ema.createProcessor({ period: fastPeriod })
  const slowProc = ema.createProcessor({ period: slowPeriod })

  for (const adVal of adValues) {
    yield sub(fastProc(adVal), slowProc(adVal))
  }
}

export { cmo as chaikinOscillator }
