import type { Dnum } from 'dnum'
import type { KlineData, RequiredProperties } from '~/types'
import { defu } from 'defu'
import { add, div, from, sub } from 'dnum'
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
export function* ao(
  source: Iterable<RequiredProperties<KlineData, 'h' | 'l'>>,
  options?: Partial<AwesomeOscillatorOptions>,
): Generator<Dnum> {
  const { fastPeriod, slowPeriod } = defu(options, defaultAwesomeOscillatorOptions) as Required<AwesomeOscillatorOptions>
  const fastProc = sma.createProcessor({ period: fastPeriod })
  const slowProc = sma.createProcessor({ period: slowPeriod })

  for (const bar of source) {
    const median = div(add(from(bar.h), from(bar.l)), 2, 18)
    const fast = fastProc(median)
    const slow = slowProc(median)
    yield sub(fast, slow)
  }
}

export { ao as awesomeOscillator }
