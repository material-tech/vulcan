import type { Dnum, Numberish } from 'dnum'
import type { Processor } from '~/types'
import { createGenerator } from '~/base'
import { sma } from './simpleMovingAverage'

export interface TriangularMovingAverageOptions {
  period: number
}

export const defaultTriangularMovingAverageOptions: TriangularMovingAverageOptions = {
  period: 4,
}

function createTrimaProcessor({ period }: Required<TriangularMovingAverageOptions>): Processor<Numberish, Dnum> {
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

  const sma1 = sma.create({ period: n2 })
  const sma2 = sma.create({ period: n1 })

  return (value: Numberish) => {
    const s1 = sma1(value)
    return sma2(s1)
  }
}

export const trima = createGenerator(createTrimaProcessor, defaultTriangularMovingAverageOptions)

export { trima as triangularMovingAverage }
