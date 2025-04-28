import type { Rounding } from 'dnum'
import type { KlineData, RequiredProperties } from '../types'
import { add, div, from, sub } from 'dnum'
import { createSignal } from '../base'
import { mapOperator } from '../helpers/operator'
import { sma } from '../trend/simpleMovingAverage'

export interface AwesomeOscillatorOptions {
  fastPeriod: number
  slowPeriod: number
  decimals: number
  rounding: Rounding
}

export const defaultAwesomeOscillatorOptions: AwesomeOscillatorOptions = {
  fastPeriod: 5,
  slowPeriod: 34,
  decimals: 18,
  rounding: 'ROUND_HALF',
}

export const ao = createSignal((
  data: RequiredProperties<KlineData, 'h' | 'l'>[],
  { fastPeriod, slowPeriod, decimals, rounding },
) => {
  const lows = data.map(item => from(item.l, decimals))
  const highs = data.map(item => from(item.h, decimals))

  const medianPrice = mapOperator(div)(
    mapOperator(add)(
      highs,
      lows,
    ),
    from(2, decimals),
    { decimals, rounding },
  )
  const fastMA = sma(medianPrice, { period: fastPeriod, decimals })
  const slowMA = sma(medianPrice, { period: slowPeriod, decimals })

  return mapOperator(sub)(fastMA, slowMA)
}, defaultAwesomeOscillatorOptions)

export { ao as awesomeOscillator }
