import type { Numberish } from 'dnum'
import { createSignal, fp18 } from '@vulcan-js/core'
import * as prim from '../primitives'

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
    const proc = prim.sma(period)
    return (value: Numberish) => fp18.toDnum(proc(fp18.toFp18(value)))
  },
  defaultSMAOptions,
)

export { sma as simpleMovingAverage }
