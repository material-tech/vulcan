import type { Dnum, Numberish } from 'dnum'
import { createSignal } from '@material-tech/alloy-core'
import { add, from } from 'dnum'

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
    const buffer: Dnum[] = []
    return (value: Numberish) => {
      buffer.push(from(value, 18))
      if (buffer.length > period)
        buffer.shift()
      return buffer.reduce((sum, cur) => add(sum, cur), from(0, 18))
    }
  },
  defaultMovingSumOptions,
)
