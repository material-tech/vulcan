import type { Dnum, Numberish } from 'dnum'
import { from } from 'dnum'
import { createSignal } from '~/base'
import { divide, multiply, subtract } from '../helpers/operations'
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
export const ppo = createSignal((
  data: Numberish[],
  { fastPeriod, slowPeriod, signalPeriod },
): PercentagePriceOscillatorResult => {
  const closes = data.map(v => from(v))

  const fastEMA = ema(closes, { period: fastPeriod })
  const slowEMA = ema(closes, { period: slowPeriod })

  // Calculate PPO = ((Fast EMA - Slow EMA) / Slow EMA) * 100
  const emaDiff = subtract(fastEMA, slowEMA, 18)
  const emaPercent = divide(emaDiff, slowEMA, 18)
  const ppoValues = multiply(emaPercent, 100, 18)

  // Calculate Signal = EMA(signalPeriod, PPO)
  const signal = ema(ppoValues, { period: signalPeriod })

  // Calculate Histogram = PPO - Signal
  const histogram = subtract(ppoValues, signal, 18)

  return {
    ppo: ppoValues,
    signal,
    histogram,
  }
}, defaultPercentagePriceOscillatorOptions)

export { ppo as percentagePriceOscillator }
