import type { KlineData, RequiredProperties } from '~/types'
import { sub } from 'dnum'
import { createSignal } from '~/base'
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
export const cmo = createSignal(
  ({ fastPeriod, slowPeriod }: Required<ChaikinOscillatorOptions>) => {
    const adProc = ad.create()
    const fastProc = ema.create({ period: fastPeriod })
    const slowProc = ema.create({ period: slowPeriod })
    return (bar: RequiredProperties<KlineData, 'h' | 'l' | 'c' | 'v'>) => {
      const adVal = adProc(bar)
      return sub(fastProc(adVal), slowProc(adVal))
    }
  },
  defaultChaikinOscillatorOptions,
)

export { cmo as chaikinOscillator }
