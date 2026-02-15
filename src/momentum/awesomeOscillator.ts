import type { Dnum } from 'dnum'
import type { KlineData, RequiredProperties } from '~/types'
import { add, div, from, sub } from 'dnum'
import { createSignal } from '~/base'
import { sma } from '~/trend/simpleMovingAverage'

export interface AwesomeOscillatorOptions {
  fastPeriod: number
  slowPeriod: number
}

export const defaultAwesomeOscillatorOptions: AwesomeOscillatorOptions = {
  fastPeriod: 5,
  slowPeriod: 34,
}

export const ao = createSignal(({ fastPeriod, slowPeriod }) => {
  const fastSma = sma.stream({ period: fastPeriod })
  const slowSma = sma.stream({ period: slowPeriod })
  return (data: RequiredProperties<KlineData, 'h' | 'l'>): Dnum => {
    const median = div(add(from(data.h, 18), from(data.l, 18)), 2, 18)
    const fast = fastSma(median)
    const slow = slowSma(median)
    return sub(fast, slow)
  }
}, defaultAwesomeOscillatorOptions)

export { ao as awesomeOscillator }
