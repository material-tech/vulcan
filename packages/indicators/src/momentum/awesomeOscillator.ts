import type { CandleData, RequiredProperties } from '@vulcan-js/core'
import { assert, createSignal, fp18 } from '@vulcan-js/core'
import { createSmaFp18 } from '../trend/simpleMovingAverage'

export interface AwesomeOscillatorOptions {
  fastPeriod: number
  slowPeriod: number
}

export const defaultAwesomeOscillatorOptions: AwesomeOscillatorOptions = {
  fastPeriod: 5,
  slowPeriod: 34,
}

/**
 * Awesome Oscillator (AO)
 *
 * AO = SMA(median, fastPeriod) - SMA(median, slowPeriod)
 * Where median = (high + low) / 2
 */
export const ao = createSignal(
  ({ fastPeriod, slowPeriod }) => {
    assert(Number.isInteger(fastPeriod) && fastPeriod >= 1, new RangeError(`Expected fastPeriod to be a positive integer, got ${fastPeriod}`))
    assert(Number.isInteger(slowPeriod) && slowPeriod >= 1, new RangeError(`Expected slowPeriod to be a positive integer, got ${slowPeriod}`))
    const fastProc = createSmaFp18({ period: fastPeriod })
    const slowProc = createSmaFp18({ period: slowPeriod })
    return (bar: RequiredProperties<CandleData, 'h' | 'l'>) => {
      const median = (fp18.toFp18(bar.h) + fp18.toFp18(bar.l)) / 2n
      return fp18.toDnum(fastProc(median) - slowProc(median))
    }
  },
  defaultAwesomeOscillatorOptions,
)

export { ao as awesomeOscillator }
