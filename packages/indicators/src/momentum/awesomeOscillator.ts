import type { CandleData, RequiredProperties } from '@vulcan-js/core'
import { assert, constants, createSignal, toDnum } from '@vulcan-js/core'
import { add, div, sub } from 'dnum'
import { sma } from '../trend/simpleMovingAverage'

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
    const fastProc = sma.create({ period: fastPeriod })
    const slowProc = sma.create({ period: slowPeriod })
    return (bar: RequiredProperties<CandleData, 'h' | 'l'>) => {
      const median = div(add(toDnum(bar.h), toDnum(bar.l)), 2, constants.DECIMALS)
      return sub(fastProc(median), slowProc(median))
    }
  },
  defaultAwesomeOscillatorOptions,
)

export { ao as awesomeOscillator }
