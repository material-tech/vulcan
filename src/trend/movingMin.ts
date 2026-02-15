import type { Dnum, Numberish } from 'dnum'
import { from, lt } from 'dnum'
import { createSignal } from '~/base'
import { min, movingAction } from '~/helpers/operations'

export interface MovingMinOptions {
  /**
   * period
   */
  period: number
}

export const defaultMovingMinOptions: MovingMinOptions = {
  period: 4,
}

/**
 * Moving Minimum (MovingMin)
 */
export const mmin = createSignal({
  compute: (values: Numberish[], { period }) => {
    const dnumValues = values.map(item => from(item))

    return movingAction(
      dnumValues,
      window => min(window),
      period,
    )
  },
  stream: ({ period }) => {
    const buffer: Dnum[] = []
    return (value: Numberish) => {
      buffer.push(from(value))
      if (buffer.length > period)
        buffer.shift()
      return buffer.reduce((m, cur) => lt(cur, m) ? cur : m, buffer[0])
    }
  },
  defaultOptions: defaultMovingMinOptions,
})

export { mmin as movingMin }
