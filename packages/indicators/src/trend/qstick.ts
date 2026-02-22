import type { CandleData, RequiredProperties } from '@vulcan-js/core'
import { assert, createSignal, fp18 } from '@vulcan-js/core'

export interface QstickOptions {
  /**
   * The period for calculating the moving average of (Close - Open)
   * @default 14
   */
  period: number
}

export const defaultQstickOptions: QstickOptions = {
  period: 14,
}

/**
 * Qstick Indicator
 *
 * Developed by Tushar Chande, the Qstick indicator measures the average
 * difference between closing and opening prices over a specified period.
 * It quantifies buying and selling pressure using a simple moving average
 * of (Close - Open).
 *
 * Formula: Qstick = SMA(Close - Open, period)
 *
 * Interpretation:
 * - Positive values indicate buying pressure (closes above opens)
 * - Negative values indicate selling pressure (closes below opens)
 * - Zero-line crossovers can signal trend changes
 *
 * @param source - Iterable of candle data with open and close prices
 * @param options - Configuration options
 * @param options.period - The period for the SMA calculation (default: 14)
 * @returns Generator yielding Qstick values as Dnum
 */
export const qstick = createSignal(
  ({ period }) => {
    assert(Number.isInteger(period) && period >= 1, new RangeError(`Expected period to be a positive integer, got ${period}`))

    const buffer: bigint[] = Array.from({ length: period })
    let head = 0
    let count = 0
    let runningSum = fp18.ZERO

    return (bar: RequiredProperties<CandleData, 'o' | 'c'>) => {
      const diff = fp18.toFp18(bar.c) - fp18.toFp18(bar.o)

      if (count < period) {
        buffer[count] = diff
        runningSum += diff
        count++
      }
      else {
        runningSum = runningSum - buffer[head] + diff
        buffer[head] = diff
        head = (head + 1) % period
      }

      return fp18.toDnum(runningSum / BigInt(count))
    }
  },
  defaultQstickOptions,
)

export { qstick as qstickIndicator }
