import type { Dnum } from 'dnum'
import type { KlineData, RequiredProperties } from '~/types'
import { add, div, from, sub } from 'dnum'
import { createSignal } from '~/base'
import { mapPick } from '~/helpers/array'
import { divide, add as mapAdd, subtract } from '~/helpers/operations'
import { sma } from '~/trend/simpleMovingAverage'

export interface AwesomeOscillatorOptions {
  fastPeriod: number
  slowPeriod: number
}

export const defaultAwesomeOscillatorOptions: AwesomeOscillatorOptions = {
  fastPeriod: 5,
  slowPeriod: 34,
}

export const ao = createSignal({
  compute: (
    data: RequiredProperties<KlineData, 'h' | 'l'>[],
    { fastPeriod, slowPeriod },
  ) => {
    const lows = mapPick(data, 'l', v => from(v))
    const highs = mapPick(data, 'h', v => from(v))

    const medianPrice = divide(
      mapAdd(
        highs,
        lows,
      ),
      from(2),
      18,
    )
    const fastMA = sma(medianPrice, { period: fastPeriod })
    const slowMA = sma(medianPrice, { period: slowPeriod })

    return subtract(fastMA, slowMA, 18)
  },
  stream: ({ fastPeriod, slowPeriod }) => {
    const fastSma = sma.stream({ period: fastPeriod })
    const slowSma = sma.stream({ period: slowPeriod })
    return (data: RequiredProperties<KlineData, 'h' | 'l'>): Dnum => {
      const median = div(add(from(data.h, 18), from(data.l, 18)), 2, 18)
      const fast = fastSma(median)
      const slow = slowSma(median)
      return sub(fast, slow)
    }
  },
  defaultOptions: defaultAwesomeOscillatorOptions,
})

export { ao as awesomeOscillator }
