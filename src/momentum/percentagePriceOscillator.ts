import type { Numberish } from 'dnum'
import { from } from 'dnum'
import { createSignal } from '~/base'
import { divide, multiply, subtract } from '../helpers/operator'
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
  ppo: Numberish[]
  signal: Numberish[]
  histogram: Numberish[]
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
 * @param options.decimals - Number of decimal places for precision
 * @param options.rounding - Rounding mode for calculations
 * @returns Object containing ppo, signal, and histogram arrays
 */
export const ppo = createSignal((
  data: Numberish[],
  { fastPeriod, slowPeriod, signalPeriod, decimals, rounding },
): PercentagePriceOscillatorResult => {
  const closes = data.map(v => from(v, decimals))

  const fastEMA = ema(closes, { period: fastPeriod, decimals, rounding })
  const slowEMA = ema(closes, { period: slowPeriod, decimals, rounding })

  // Calculate PPO = ((Fast EMA - Slow EMA) / Slow EMA) * 100
  const ppoValues = multiply(
    divide(
      subtract(
        fastEMA,
        slowEMA,
        decimals,
      ),
      slowEMA,
      decimals,
    ),
    100,
    decimals,
  )

  // Calculate Signal = EMA(signalPeriod, PPO)
  const signal = ema(ppoValues, { period: signalPeriod, decimals, rounding })

  // Calculate Histogram = PPO - Signal
  const histogram = subtract(ppoValues, signal, decimals)

  return {
    ppo: ppoValues,
    signal,
    histogram,
  }
}, defaultPercentagePriceOscillatorOptions)

export { ppo as percentagePriceOscillator }
