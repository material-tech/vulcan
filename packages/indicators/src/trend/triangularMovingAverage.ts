import type { Numberish } from 'dnum'
import { assert, createSignal, fp18 } from '@vulcan-js/core'
import * as prim from '../primitives'

export interface TriangularMovingAverageOptions {
  period: number
}

export const defaultTriangularMovingAverageOptions: TriangularMovingAverageOptions = {
  period: 4,
}

export const trima = createSignal(
  ({ period }) => {
    assert(Number.isInteger(period) && period >= 1, new RangeError(`Expected period to be a positive integer, got ${period}`))
    let n1: number
    let n2: number

    if (period % 2 === 0) {
      n1 = period / 2
      n2 = n1 + 1
    }
    else {
      n1 = (period + 1) / 2
      n2 = n1
    }

    const sma1 = prim.sma(n2)
    const sma2 = prim.sma(n1)

    return (value: Numberish) => {
      const s1 = sma1(fp18.toFp18(value))
      return fp18.toDnum(sma2(s1))
    }
  },
  defaultTriangularMovingAverageOptions,
)

export { trima as triangularMovingAverage }
