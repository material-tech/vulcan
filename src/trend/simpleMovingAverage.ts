import type { Numberish } from 'dnum'
import { add, div, from, sub } from 'dnum'
import { createSignal } from '../base'

export interface SimpleMovingAverageOptions {
  /**
   * period
   */
  period: number
}

export const defaultSMAOptions: SimpleMovingAverageOptions = {
  period: 2,
}

/**
 * Simple Moving Average (SMA)
 */
export const sma = createSignal(
  (values: Numberish[], { period, decimals, rounding }) => {
    const result = Array.from({ length: values.length }, () => from(0, decimals))

    // Calculate the average for data that is less than the period
    let sum = from(0, decimals)
    for (let i = 0; i < values.length; i++) {
      sum = add(sum, values[i], decimals)

      if (i < period - 1) {
        // For data less than one period, calculate the average of all current values
        result[i] = div(sum, from(i + 1, decimals), { decimals, rounding })
      }
      else {
        // For a complete period, calculate the average within the period
        if (i > period - 1) {
          // Remove the leftmost value of the window to prepare for the current calculation
          sum = sub(sum, values[i - period], decimals)
        }
        result[i] = div(sum, from(period, decimals), { decimals, rounding })
      }
    }

    return result
  },
  defaultSMAOptions,
)

export { sma as simpleMovingAverage }
