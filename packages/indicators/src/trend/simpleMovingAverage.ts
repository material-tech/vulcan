import type { Dnum, Numberish } from 'dnum'
import { assertPositiveInteger, createSignal } from '@material-tech/vulcan-core'
import { add, div, from, subtract } from 'dnum'

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
export const sma = createSignal(
  ({ period }) => {
    assertPositiveInteger(period)
    const buffer: Dnum[] = Array.from({ length: period })
    let head = 0
    let count = 0
    let runningSum: Dnum = from(0, 18)

    return (value: Numberish) => {
      const v = from(value, 18)
      if (count < period) {
        buffer[count] = v
        runningSum = add(runningSum, v)
        count++
      }
      else {
        runningSum = subtract(runningSum, buffer[head])
        runningSum = add(runningSum, v)
        buffer[head] = v
        head = (head + 1) % period
      }
      return div(runningSum, count, 18)
    }
  },
  defaultSMAOptions,
)

export { sma as simpleMovingAverage }
