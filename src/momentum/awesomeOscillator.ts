import type { KlineData, RequiredProperties } from '~/types'
import { add, div, from, sub } from 'dnum'
import { createSignal } from '~/base'
import { mapPick } from '~/helpers/array'
import { mapOperator } from '../helpers/operator'
import { sma } from '../trend/simpleMovingAverage'

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
  { fastPeriod, slowPeriod, decimals, rounding },
) => {
  const lows = mapPick(data, 'l', v => from(v, decimals))
  const highs = mapPick(data, 'h', v => from(v, decimals))

  const medianPrice = mapOperator(div)(
    mapOperator(add)(
      highs,
      lows,
    ),
    from(2, decimals),
    { decimals, rounding },
  )
  const fastMA = sma(medianPrice, { period: fastPeriod })
  const slowMA = sma(medianPrice, { period: slowPeriod })

  return mapOperator(sub)(fastMA, slowMA, decimals)
}, defaultAwesomeOscillatorOptions)

export { ao as awesomeOscillator }
