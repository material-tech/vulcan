import type { Numberish, Rounding } from 'dnum'
import { createSignal } from '../base'
import { sma } from './simpleMovingAverage'

export interface TriangularMovingAverageOptions {
  period: number
  decimals: number
  rounding: Rounding
}

export const defaultTriangularMovingAverageOptions: TriangularMovingAverageOptions = {
  period: 4,
  decimals: 18,
  rounding: 'ROUND_HALF',
}

export const trima = createSignal(
  (values: Numberish[], { period, decimals, rounding }) => {
    let n1 = 0
    let n2 = 0

    if (period % 2 === 0) {
      n1 = period / 2
      n2 = n1 + 1
    }
    else {
      n1 = (period + 1) / 2
      n2 = n1
    }

    const result = sma(sma(values, { period: n2, decimals, rounding }), { period: n1, decimals, rounding })

    return result
  },
  defaultTriangularMovingAverageOptions,
)

export { trima as triangularMovingAverage }
