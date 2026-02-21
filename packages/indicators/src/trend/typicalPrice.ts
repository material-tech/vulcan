import type { CandleData, RequiredProperties } from '@vulcan-js/core'
import { createSignal } from '@vulcan-js/core'
import { add, divide, from } from 'dnum'

/**
 * Typical Price
 *
 * The Typical Price is a simple average of the high, low, and close prices
 * for a given period. It provides a single representative price for each bar
 * and is commonly used as input for other indicators such as CCI and MFI.
 *
 * Formula: Typical Price = (High + Low + Close) / 3
 *
 * @param source - Iterable of candle data with high, low, and close prices
 * @returns Generator yielding Typical Price values as Dnum
 */
export const typicalPrice = createSignal(
  () => {
    return (bar: RequiredProperties<CandleData, 'h' | 'l' | 'c'>) => {
      const h = from(bar.h, 18)
      const l = from(bar.l, 18)
      const c = from(bar.c, 18)

      return divide(add(add(h, l), c), 3, 18)
    }
  },
)

export { typicalPrice as typicalPriceIndicator }
