import type { Numberish } from 'dnum'
import { add, from, mul } from 'dnum'
import { createSignal } from '~/base'

export interface ExponentialMovingAverageOptions {
  period: number
}

export const defaultExponentialMovingAverageOptions: ExponentialMovingAverageOptions = {
  period: 12,
}

export const ema = createSignal(
  (values: Numberish[], { period }) => {
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
  defaultExponentialMovingAverageOptions,
)

export { ema as exponentialMovingAverage }
