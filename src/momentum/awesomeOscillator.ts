import type { KlineData, RequiredProperties } from '~/types'
import { from } from 'dnum'
import { createSignal } from '~/base'
import { mapPick } from '~/helpers/array'
import { add, divide, subtract } from '~/helpers/operations'
import { sma } from '~/trend/simpleMovingAverage'

export interface AwesomeOscillatorOptions {
  fastPeriod: number
  slowPeriod: number
}

export const defaultAwesomeOscillatorOptions: AwesomeOscillatorOptions = {
  fastPeriod: 5,
  slowPeriod: 34,
}

export const ao = createSignal((
  data: RequiredProperties<KlineData, 'h' | 'l'>[],
  { fastPeriod, slowPeriod },
) => {
  const lows = mapPick(data, 'l', v => from(v))
  const highs = mapPick(data, 'h', v => from(v))

  const medianPrice = divide(
    add(
      highs,
      lows,
    ),
    from(2),
    18,
  )
  const fastMA = sma(medianPrice, { period: fastPeriod })
  const slowMA = sma(medianPrice, { period: slowPeriod })

  return subtract(fastMA, slowMA, 18)
}, defaultAwesomeOscillatorOptions)

export { ao as awesomeOscillator }
