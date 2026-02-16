import type { KlineData, RequiredProperties } from '~/types'
import { add, div, from, sub } from 'dnum'
import { createGenerator } from '~/base'
import { sma } from '~/trend/simpleMovingAverage'

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
export const ao = createGenerator(
  ({ fastPeriod, slowPeriod }: Required<AwesomeOscillatorOptions>) => {
    const fastProc = sma.create({ period: fastPeriod })
    const slowProc = sma.create({ period: slowPeriod })
    return (bar: RequiredProperties<KlineData, 'h' | 'l'>) => {
      const median = div(add(from(bar.h), from(bar.l)), 2, 18)
      return sub(fastProc(median), slowProc(median))
    }
  },
  defaultAwesomeOscillatorOptions,
)

export { ao as awesomeOscillator }
