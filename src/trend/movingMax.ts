import type { Numberish } from 'dnum'
import { from, gt } from 'dnum'
import { createSignal } from '../base'

export interface MovingMaxOptions {
  /**
   * period
   */
  period: number
  /**
   * default decimals
   */
  decimals: number
}

export const defaultMovingMaxOptions: MovingMaxOptions = {
  period: 4,
  decimals: 18,
}

/**
 * Moving Maximum (MovingMax)
 */
export const mmax = createSignal(
  (values: Numberish[], { period, decimals }) => {
    // 将输入数据转换为Dnum类型
    const dnumValues = values.map(item => from(item, decimals))
    const result = Array.from({ length: values.length }, () => from(0, decimals))

    for (let i = 0; i < values.length; i++) {
      // 计算当前窗口的起始索引
      const startIndex = Math.max(0, i - period + 1)

      // 初始化最大值为当前窗口的第一个值
      let max = dnumValues[startIndex]

      // 在当前窗口中寻找最大值
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
