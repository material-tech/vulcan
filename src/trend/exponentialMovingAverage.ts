import type { Dnum, Numberish } from 'dnum'
import { add, from, mul } from 'dnum'
import { createSignal } from '~/base'

export interface ExponentialMovingAverageOptions {
  period: number
}

export const defaultExponentialMovingAverageOptions: ExponentialMovingAverageOptions = {
  period: 12,
}

export const ema = createSignal({
  compute: (values: Numberish[], { period }) => {
    const result = Array.from({ length: values.length }, () => from(0))

    if (result.length > 0) {
      const kValue = 2 / (1 + period)
      const mValue = 1 - kValue

      result[0] = from(values[0])

      for (let i = 1; i < result.length; i++) {
        result[i] = add(
          mul(values[i], kValue, 18),
          mul(result[i - 1], mValue, 18),
        )
      }
    }

    return result
  },
  stream: ({ period }) => {
    const k = 2 / (1 + period)
    const m = 1 - k
    let prev: Dnum | null = null
    return (value: Numberish) => {
      if (prev === null) {
        prev = from(value)
      }
      else {
        prev = add(mul(value, k, 18), mul(prev, m, 18))
      }
      return prev
    }
  },
  defaultOptions: defaultExponentialMovingAverageOptions,
})

export { ema as exponentialMovingAverage }
