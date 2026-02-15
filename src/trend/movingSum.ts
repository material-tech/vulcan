import type { Dnum, Numberish } from 'dnum'
import { add, from } from 'dnum'
import { createSignal } from '~/base'

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
export const msum = createSignal({
  stream: ({ period }) => {
    const buffer: Dnum[] = []
    return (value: Numberish) => {
      buffer.push(from(value))
      if (buffer.length > period)
        buffer.shift()
      return buffer.reduce((sum, cur) => add(sum, cur), from(0))
    }
  },
  defaultOptions: defaultMovingSumOptions,
})
