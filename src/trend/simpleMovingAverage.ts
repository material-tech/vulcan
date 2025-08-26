import type { Numberish } from 'dnum'
import { add, div, from } from 'dnum'
import { createSignal } from '~/base'
import { movingAction } from '~/helpers/operations'

export interface SimpleMovingAverageOptions {
  /**
   * The period for calculating the moving average
   * @default 2
   */
  period: number
}

export const defaultSMAOptions: SimpleMovingAverageOptions = {
  period: 2,
}

/**
 * Simple Moving Average (SMA)
 *
 * Calculates the arithmetic mean of a set of values over a specified period.
 * The SMA is calculated by summing all values in the period and dividing by the period length.
 *
 * Formula: SMA = (P1 + P2 + ... + Pn) / n
 * Where: P = Price values, n = Period
 *
 * @param values - Array of price values
 * @param options - Configuration options
 * @param options.period - The period for calculating the moving average (default: 2)
 * @returns Array of SMA values
 */
export const sma = createSignal(
  (values: Numberish[], { period }: Required<SimpleMovingAverageOptions>) => {
    if (values.length === 0) {
      return []
    }

    return movingAction(
      values,
      (window) => {
        const sum = window.reduce((acc, cur) => add(acc, cur), from(0, 18))
        return div(sum, window.length, 18)
      },
      period,
    )
  },
  defaultSMAOptions,
)

export { sma as simpleMovingAverage }
