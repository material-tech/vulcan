import type { Numberish } from 'dnum'
import { from, lt } from 'dnum'
import { createSignal } from '../base'

export interface MovingMinOptions {
  /**
   * period
   */
  period: number
  /**
   * default decimals for all number if not specified
   */
  decimals: number
}

export const defaultMovingMinOptions: MovingMinOptions = {
  period: 4,
  decimals: 18,
}

/**
 * Moving Minimum (MovingMin)
 */
export const mmin = createSignal(
  (values: Numberish[], { period, decimals }) => {
    // Convert input data to Dnum type
    const dnumValues = values.map(item => from(item, decimals))
    const result = Array.from({ length: values.length }, () => from(0, decimals))

    for (let i = 0; i < values.length; i++) {
      // Calculate the starting index of the current window
      const startIndex = Math.max(0, i - period + 1)

      // 初始化最小值为当前窗口的第一个值
      let min = dnumValues[startIndex]

      // 在当前窗口中寻找最小值
      for (let j = startIndex + 1; j <= i; j++) {
        if (lt(dnumValues[j], min)) {
          min = dnumValues[j]
        }
      }

      result[i] = min
    }

    return result
  },
  defaultMovingMinOptions,
)

export { mmin as movingMin }
