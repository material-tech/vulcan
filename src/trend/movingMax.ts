import type { Numberish } from 'dnum'
import { from, gt } from 'dnum'
import { createSignal } from '~/base'

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
  (values: Numberish[], { period, decimals }) => {
    const dnumValues = values.map(item => from(item, decimals))
    const result = Array.from({ length: values.length }, () => from(0, decimals))

    for (let i = 0; i < values.length; i++) {
      const startIndex = Math.max(0, i - period + 1)

      let max = dnumValues[startIndex]

      for (let j = startIndex + 1; j <= i; j++) {
        if (gt(dnumValues[j], max)) {
          max = dnumValues[j]
        }
      }

      result[i] = max
    }

    return result
  },
  defaultMovingMaxOptions,
)

export { mmax as movingMax }
