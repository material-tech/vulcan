import type { Numberish } from 'dnum'
import { assert, createSignal, fp18 } from '@vulcan-js/core'

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

export function createSmaFp18({ period }: { period: number }) {
  assert(Number.isInteger(period) && period >= 1, new RangeError(`Expected period to be a positive integer, got ${period}`))
  const buffer: bigint[] = Array.from({ length: period })
  let head = 0
  let count = 0
  let runningSum = fp18.ZERO

  return (value: bigint): bigint => {
    if (count < period) {
      buffer[count] = value
      runningSum += value
      count++
    }
    else {
      runningSum = runningSum - buffer[head] + value
      buffer[head] = value
      head = (head + 1) % period
    }
    return runningSum / BigInt(count)
  }
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
    const proc = createSmaFp18({ period })
    return (value: Numberish) => fp18.toDnum(proc(fp18.toFp18(value)))
  },
  defaultSMAOptions,
)

export { sma as simpleMovingAverage }
