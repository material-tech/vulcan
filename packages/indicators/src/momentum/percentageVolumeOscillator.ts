import type { Dnum, Numberish } from 'dnum'
import { assert, createSignal } from '@vulcan-js/core'
import { div, eq, from, mul, sub } from 'dnum'
import { ema } from '../trend/exponentialMovingAverage'

export interface PercentageVolumeOscillatorOptions {
  fastPeriod: number
  slowPeriod: number
  signalPeriod: number
}

export const defaultPercentageVolumeOscillatorOptions: PercentageVolumeOscillatorOptions = {
  fastPeriod: 12,
  slowPeriod: 26,
  signalPeriod: 9,
}

export interface PercentageVolumeOscillatorPoint {
  pvo: Dnum
  signal: Dnum
  histogram: Dnum
}

/**
 * Percentage Volume Oscillator (PVO)
 *
 * The Percentage Volume Oscillator (PVO) is a momentum oscillator that measures the difference
 * between two volume-based moving averages as a percentage of the slower moving average.
 * It consists of three components:
 * - PVO Line: ((Fast EMA - Slow EMA) / Slow EMA) * 100
 * - Signal Line: EMA of the PVO line
 * - Histogram: PVO - Signal
 *
 * The PVO is essentially the same as the Percentage Price Oscillator (PPO), but applied
 * to volume data instead of price data.
 *
 * Formula:
 * - PVO = ((EMA(fastPeriod, volume) - EMA(slowPeriod, volume)) / EMA(slowPeriod, volume)) * 100
 * - Signal = EMA(signalPeriod, PVO)
 * - Histogram = PVO - Signal
 *
 * @param source - Iterable of volume values
 * @param options - Configuration options
 * @param options.fastPeriod - Period for the fast EMA (default: 12)
 * @param options.slowPeriod - Period for the slow EMA (default: 26)
 * @param options.signalPeriod - Period for the signal EMA (default: 9)
 * @returns Generator yielding PVO point objects
 */
export const pvo = createSignal(
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
      const pvoVal = eq(slow, 0) ? from(0, 18) : mul(div(sub(fast, slow), slow, 18), 100, 18)
      const sig = signalProc(pvoVal)
      return { pvo: pvoVal, signal: sig, histogram: sub(pvoVal, sig) }
    }
  },
  defaultPercentageVolumeOscillatorOptions,
)

export { pvo as percentageVolumeOscillator }
