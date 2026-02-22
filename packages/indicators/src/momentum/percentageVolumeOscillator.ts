import type { Dnum, Numberish } from 'dnum'
import { assert, createSignal, fp18 } from '@vulcan-js/core'
import * as prim from '../primitives'

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
    const fastProc = prim.ewma(prim.ewma.k(fastPeriod))
    const slowProc = prim.ewma(prim.ewma.k(slowPeriod))
    const signalProc = prim.ewma(prim.ewma.k(signalPeriod))
    return (value: Numberish) => {
      const v = fp18.toFp18(value)
      const fast = fastProc(v)
      const slow = slowProc(v)
      const pvoVal = slow === fp18.ZERO ? fp18.ZERO : fp18.div((fast - slow) * 100n, slow)
      const sig = signalProc(pvoVal)
      return { pvo: fp18.toDnum(pvoVal), signal: fp18.toDnum(sig), histogram: fp18.toDnum(pvoVal - sig) }
    }
  },
  defaultPercentageVolumeOscillatorOptions,
)

export { pvo as percentageVolumeOscillator }
