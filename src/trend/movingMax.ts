import type { Numberish } from 'dnum'
import { from } from 'dnum'
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
export const mmax = createSignal(
  (values: Numberish[], { period }) => {
    const dnumValues = values.map(item => from(item))

    return movingAction(
      dnumValues,
      window => max(window),
      period,
    )
  },
  defaultMovingMaxOptions,
)

export { mmax as movingMax }
