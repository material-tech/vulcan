import type { Dnum, Numberish } from 'dnum'
import { assert, constants, createSignal, toDnum } from '@vulcan-js/core'
import { div, eq, mul, sub } from 'dnum'

export interface PriceRateOfChangeOptions {
  period: number
}

export const defaultPriceRateOfChangeOptions: PriceRateOfChangeOptions = {
  period: 12,
}

/**
 * Price Rate of Change (ROC)
 *
 * The Price Rate of Change (ROC) is a momentum oscillator that measures the percentage change
 * in price between the current price and the price n periods ago.
 *
 * Formula:
 * - ROC = ((Current Price - Price n periods ago) / Price n periods ago) * 100
 *
 * @param source - Iterable of price values
 * @param options - Configuration options
 * @param options.period - Number of periods to look back (default: 12)
 * @returns Generator yielding ROC values as Dnum
 */
export const roc = createSignal(
  ({ period }) => {
    assert(Number.isInteger(period) && period >= 1, new RangeError(`Expected period to be a positive integer, got ${period}`))
    const buffer: Dnum[] = Array.from({ length: period })
    let head = 0
    let count = 0

    return (value: Numberish) => {
      const v = toDnum(value)
      if (count < period) {
        buffer[count] = v
        count++
        return constants.ZERO
      }
      else {
        const oldest = buffer[head]
        buffer[head] = v
        head = (head + 1) % period
        return eq(oldest, 0) ? constants.ZERO : mul(div(sub(v, oldest), oldest, constants.DECIMALS), 100, constants.DECIMALS)
      }
    }
  },
  defaultPriceRateOfChangeOptions,
)

export { roc as priceRateOfChange }
