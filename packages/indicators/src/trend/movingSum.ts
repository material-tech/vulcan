import type { Dnum, Numberish } from 'dnum'
import { createSignal } from '@material-tech/alloy-core'
import { add, from, subtract } from 'dnum'

export interface MovingSumOptions {
  period: number
}

export const defaultMovingSumOptions: MovingSumOptions = {
  period: 4,
}

/**
 * Moving Sum
 *
 * Calculates the sum of values in a sliding window of the specified period.
 */
export const msum = createSignal(
  ({ period }) => {
    const buffer: Dnum[] = Array.from({ length: period })
    let head = 0
    let count = 0
    let runningSum: Dnum = from(0, 18)

    return (value: Numberish) => {
      const v = from(value, 18)
      if (count < period) {
        buffer[count] = v
        runningSum = add(runningSum, v)
        count++
      }
      else {
        runningSum = subtract(runningSum, buffer[head])
        runningSum = add(runningSum, v)
        buffer[head] = v
        head = (head + 1) % period
      }
      return runningSum
    }
  },
  defaultMovingSumOptions,
)
