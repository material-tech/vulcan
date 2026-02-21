import type { Dnum, Numberish } from 'dnum'
import { assert, createSignal } from '@material-tech/vulcan-core'
import { div, eq, from, mul, sub } from 'dnum'
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
export const ppo = createSignal(
  ({ fastPeriod, slowPeriod, signalPeriod }) => {
    assert(Number.isInteger(fastPeriod) && fastPeriod >= 1, new RangeError(`Expected fastPeriod to be a positive integer, got ${fastPeriod}`))
    assert(Number.isInteger(slowPeriod) && slowPeriod >= 1, new RangeError(`Expected slowPeriod to be a positive integer, got ${slowPeriod}`))
    assert(Number.isInteger(signalPeriod) && signalPeriod >= 1, new RangeError(`Expected signalPeriod to be a positive integer, got ${signalPeriod}`))
    const fastProc = ema.create({ period: fastPeriod })
    const slowProc = ema.create({ period: slowPeriod })
    const signalProc = ema.create({ period: signalPeriod })
    return (value: Numberish) => {
      const fast = fastProc(from(value, 18))
      const slow = slowProc(from(value, 18))
      const ppoVal = eq(slow, 0) ? from(0, 18) : mul(div(sub(fast, slow), slow, 18), 100, 18)
      const sig = signalProc(ppoVal)
      return { ppo: ppoVal, signal: sig, histogram: sub(ppoVal, sig) }
    }
  },
  defaultPercentagePriceOscillatorOptions,
)

export { ppo as percentagePriceOscillator }
