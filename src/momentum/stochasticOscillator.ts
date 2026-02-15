import type { Dnum } from 'dnum'
import type { KlineData, RequiredProperties } from '~/types'
import { div, from, mul, sub } from 'dnum'
import { createSignal } from '~/base'
import { mapPick } from '~/helpers/array'
import { divide, multiply, subtract } from '~/helpers/operations'
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
  compute: (data: RequiredProperties<KlineData, 'h' | 'l' | 'c'>[], { kPeriod, slowingPeriod, dPeriod }) => {
    const highs = mapPick(data, 'h', v => from(v))
    const lows = mapPick(data, 'l', v => from(v))
    const closings = mapPick(data, 'c', v => from(v))

    const highestHigh = mmax(highs, { period: kPeriod })
    const lowestLow = mmin(lows, { period: kPeriod })

    const rawK = multiply(
      divide(
        subtract(closings, lowestLow, 18),
        subtract(highestHigh, lowestLow, 18),
        18,
      ),
      100,
      18,
    )

    // Apply slowing
    const kValue = slowingPeriod > 1
      ? sma(rawK, { period: slowingPeriod })
      : rawK

    const dValue = sma(kValue, { period: dPeriod })

    return {
      k: kValue,
      d: dValue,
    } as StochResult
  },
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
