import type { Dnum, Numberish } from 'dnum'
import { divide, from, mul, sub, subtract } from 'dnum'
import { createSignal } from '~/base'
import { ema } from '../trend/exponentialMovingAverage'

export interface PercentagePriceOscillatorOptions {
  fastPeriod: number
  slowPeriod: number
  signalPeriod: number
}

export const defaultPercentagePriceOscillatorOptions: PercentagePriceOscillatorOptions = {
  fastPeriod: 12,
  slowPeriod: 26,
  signalPeriod: 9,
}

export interface PercentagePriceOscillatorResult {
  ppo: Dnum[]
  signal: Dnum[]
  histogram: Dnum[]
}

/**
 * Percentage Price Oscillator (PPO)
 *
 * The Percentage Price Oscillator (PPO) is a momentum oscillator that measures the difference
 * between two moving averages as a percentage of the slower moving average. It consists of three components:
 * - PPO Line: ((Fast EMA - Slow EMA) / Slow EMA) * 100
 * - Signal Line: EMA of the PPO line
 * - Histogram: PPO - Signal
 *
 * Formula:
 * - PPO = ((EMA(fastPeriod, prices) - EMA(slowPeriod, prices)) / EMA(slowPeriod, prices)) * 100
 * - Signal = EMA(signalPeriod, PPO)
 * - Histogram = PPO - Signal
 *
 * @param data - Array of price values
 * @param options - Configuration options
 * @param options.fastPeriod - Period for the fast EMA (default: 12)
 * @param options.slowPeriod - Period for the slow EMA (default: 26)
 * @param options.signalPeriod - Period for the signal EMA (default: 9)
 * @returns Object containing ppo, signal, and histogram arrays
 */
export const ppo = createSignal(({ fastPeriod, slowPeriod, signalPeriod }) => {
  const fastEma = ema.step({ period: fastPeriod })
  const slowEma = ema.step({ period: slowPeriod })
  const signalEma = ema.step({ period: signalPeriod })
  return (value: Numberish) => {
    const v = from(value)
    const fast = fastEma(v)
    const slow = slowEma(v)
    const diff = subtract(fast, slow)
    const ppoValue = mul(divide(diff, slow, 18), 100, 18)
    const signal = signalEma(ppoValue)
    const histogram = sub(ppoValue, signal)
    return { ppo: ppoValue, signal, histogram }
  }
}, defaultPercentagePriceOscillatorOptions)

export { ppo as percentagePriceOscillator }
