import type { Numberish } from 'dnum'
import { add, from, mul } from 'dnum'
import { createSignal } from '../base'

export interface MovingSumOptions {
  period: number
}

export const defaultMovingSumOptions: MovingSumOptions = {
  period: 4,
}

/**
 * moving sum
 * calculate the sum of the values in the specified period
 */
export const msum = createSignal(
  (values: Numberish[], { period, decimals }) => {
    // convert the input data to Dnum type
    const dnumValues = values.map(item => from(item, decimals))
    const result = Array.from({ length: values.length }, () => from(0, decimals))

    // calculate the sum of the first window
    let sum = from(0, decimals)
    for (let i = 0; i < values.length; i++) {
      sum = add(sum, dnumValues[i])

      if (i < period - 1) {
        // before the first complete window, calculate the sum of all current values
        result[i] = sum
      }
      else {
        // after the first complete window, remove the value on the left side of the window
        if (i >= period) {
          sum = add(sum, mul(from(-1, decimals), dnumValues[i - period]))
        }
        result[i] = sum
      }
    }

    return result
  },
  defaultMovingSumOptions,
)
