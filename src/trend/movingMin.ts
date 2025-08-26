import type { Numberish } from 'dnum'
import { from } from 'dnum'
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
export const mmin = createSignal(
  (values: Numberish[], { period }) => {
    const dnumValues = values.map(item => from(item))

    return movingAction(
      dnumValues,
      window => min(window),
      period,
    )
  },
  defaultMovingMinOptions,
)

export { mmin as movingMin }
