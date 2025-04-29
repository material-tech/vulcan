import type { Numberish } from 'dnum'
import { createSignal } from '../base'
import { sma } from './simpleMovingAverage'

export interface TriangularMovingAverageOptions {
  period: number
}

export const defaultTriangularMovingAverageOptions: TriangularMovingAverageOptions = {
  period: 4,
}

export const trima = createSignal(
  (values: Numberish[], { period }) => {
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

    const result = sma(sma(values, { period: n2 }), { period: n1 })

    return result
  },
  defaultTriangularMovingAverageOptions,
)

export { trima as triangularMovingAverage }
