import type { Dnum } from 'dnum'
import type { KlineData, RequiredProperties } from '~/types'
import { div, from, mul, sub } from 'dnum'
import { createSignal } from '~/base'
import { mmin, sma } from '~/trend'
import { mmax } from '~/trend/movingMax'

export interface StochasticOscillatorOptions {
  /** The %k period */
  kPeriod: number
  /** The %k slowing period */
  slowingPeriod: number
  /** The %d period  */
  dPeriod: number
}

export const defaultStochasticOscillatorOptions: StochasticOscillatorOptions = {
  kPeriod: 14,
  slowingPeriod: 1,
  dPeriod: 3,
}

export interface StochResult {
  k: Dnum[]
  d: Dnum[]
}

export const stoch = createSignal({
  stream: ({ kPeriod, slowingPeriod, dPeriod }) => {
    const mmaxStream = mmax.stream({ period: kPeriod })
    const mminStream = mmin.stream({ period: kPeriod })
    const slowingSma = slowingPeriod > 1 ? sma.stream({ period: slowingPeriod }) : null
    const dSma = sma.stream({ period: dPeriod })
    return (data: RequiredProperties<KlineData, 'h' | 'l' | 'c'>) => {
      const high = from(data.h, 18)
      const low = from(data.l, 18)
      const close = from(data.c, 18)

      const highestHigh = mmaxStream(high)
      const lowestLow = mminStream(low)

      const range = sub(highestHigh, lowestLow)
      const rawK = mul(div(sub(close, lowestLow), range, 18), 100, 18)

      const k = slowingSma ? slowingSma(rawK) : rawK
      const d = dSma(k)

      return { k, d }
    }
  },
  defaultOptions: defaultStochasticOscillatorOptions,
})

export { stoch as stochasticOscillator }
