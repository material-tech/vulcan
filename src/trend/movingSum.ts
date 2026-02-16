import type { Dnum, Numberish } from 'dnum'
import { add, from } from 'dnum'
import { createGenerator } from '~/base'

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
export const msum = createGenerator(
  ({ period }: Required<MovingSumOptions>) => {
    const buffer: Dnum[] = []
    return (value: Numberish) => {
      buffer.push(from(value))
      if (buffer.length > period)
        buffer.shift()
      return buffer.reduce((sum, cur) => add(sum, cur), from(0))
    }
  },
  defaultMovingSumOptions,
)
