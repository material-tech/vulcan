import type { CandleData, RequiredProperties } from '@vulcan-js/core'
import { assert, createSignal, fp18 } from '@vulcan-js/core'
import { createEmaFp18 } from '../trend/exponentialMovingAverage'
import { createAdFp18 } from '../volume/accumulationDistribution'

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
  ({ fastPeriod, slowPeriod }) => {
    assert(Number.isInteger(fastPeriod) && fastPeriod >= 1, new RangeError(`Expected fastPeriod to be a positive integer, got ${fastPeriod}`))
    assert(Number.isInteger(slowPeriod) && slowPeriod >= 1, new RangeError(`Expected slowPeriod to be a positive integer, got ${slowPeriod}`))
    const adProc = createAdFp18()
    const fastProc = createEmaFp18({ period: fastPeriod })
    const slowProc = createEmaFp18({ period: slowPeriod })
    return (bar: RequiredProperties<CandleData, 'h' | 'l' | 'c' | 'v'>) => {
      const adVal = adProc(
        fp18.toFp18(bar.h),
        fp18.toFp18(bar.l),
        fp18.toFp18(bar.c),
        fp18.toFp18(bar.v),
      )
      return fp18.toDnum(fastProc(adVal) - slowProc(adVal))
    }
  },
  defaultChaikinOscillatorOptions,
)

export { cmo as chaikinOscillator }
