import type { Dnum, Numberish } from 'dnum'
import { defu } from 'defu'
import { div, from, mul, sub } from 'dnum'
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

export interface PercentagePriceOscillatorPoint {
  ppo: Dnum
  signal: Dnum
  histogram: Dnum
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
 * @param source - Iterable of price values
 * @param options - Configuration options
 * @param options.fastPeriod - Period for the fast EMA (default: 12)
 * @param options.slowPeriod - Period for the slow EMA (default: 26)
 * @param options.signalPeriod - Period for the signal EMA (default: 9)
 * @returns Generator yielding PPO point objects
 */
export function* ppo(
  source: Iterable<Numberish>,
  options?: Partial<PercentagePriceOscillatorOptions>,
): Generator<PercentagePriceOscillatorPoint> {
  const { fastPeriod, slowPeriod, signalPeriod } = defu(options, defaultPercentagePriceOscillatorOptions) as Required<PercentagePriceOscillatorOptions>
  const fastProc = ema.createProcessor({ period: fastPeriod })
  const slowProc = ema.createProcessor({ period: slowPeriod })
  const signalProc = ema.createProcessor({ period: signalPeriod })

  for (const value of source) {
    const fast = fastProc(from(value))
    const slow = slowProc(from(value))

    const ppoVal = mul(div(sub(fast, slow), slow, 18), 100, 18)
    const sig = signalProc(ppoVal)
    yield { ppo: ppoVal, signal: sig, histogram: sub(ppoVal, sig) }
  }
}

export { ppo as percentagePriceOscillator }
