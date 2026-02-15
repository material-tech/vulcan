import type { Dnum } from 'dnum'
import type { KlineData, RequiredProperties } from '~/types'
import { subtract } from 'dnum'
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
export const cmo = createSignal(({ fastPeriod, slowPeriod }) => {
  const adStream = ad.stream()
  const fastEma = ema.stream({ period: fastPeriod })
  const slowEma = ema.stream({ period: slowPeriod })
  return (data: RequiredProperties<KlineData, 'h' | 'l' | 'c' | 'v'>): Dnum => {
    const adValue = adStream(data)
    const fast = fastEma(adValue)
    const slow = slowEma(adValue)
    return subtract(fast, slow)
  }
}, defaultChaikinOscillatorOptions)

export { cmo as chaikinOscillator }
