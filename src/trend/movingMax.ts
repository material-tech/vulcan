import type { Dnum, Numberish } from 'dnum'
import { from, gt } from 'dnum'
import { createSignal } from '~/base'
import { max, movingAction } from '~/helpers/operations'

export interface MovingMaxOptions {
  /**
   * period
   */
  period: number
}

export const defaultMovingMaxOptions: MovingMaxOptions = {
  period: 4,
}

/**
 * Moving Maximum (MovingMax)
 */
export const mmax = createSignal({
  compute: (values: Numberish[], { period }) => {
    const dnumValues = values.map(item => from(item))

    return movingAction(
      dnumValues,
      window => max(window),
      period,
    )
  },
  stream: ({ period }) => {
    const buffer: Dnum[] = []
    return (value: Numberish) => {
      buffer.push(from(value))
      if (buffer.length > period)
        buffer.shift()
      return buffer.reduce((m, cur) => gt(cur, m) ? cur : m, buffer[0])
    }
  },
  defaultOptions: defaultMovingMaxOptions,
})

export { mmax as movingMax }
