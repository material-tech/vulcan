import type { Dnum, Numberish } from 'dnum'
import { add, div, from } from 'dnum'
import { createGenerator } from '~/base'

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
 * @param source - Iterable of price values
 * @param options - Configuration options
 * @param options.period - The period for calculating the moving average (default: 2)
 * @returns Generator yielding SMA values
 */
export const sma = createGenerator(
  ({ period }: Required<SimpleMovingAverageOptions>) => {
    const buffer: Dnum[] = []
    return (value: Numberish) => {
      buffer.push(from(value, 18))
      if (buffer.length > period)
        buffer.shift()
      const sum = buffer.reduce((acc, cur) => add(acc, cur), from(0, 18))
      return div(sum, buffer.length, 18)
    }
  },
  defaultSMAOptions,
)

export { sma as simpleMovingAverage }
