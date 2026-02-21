import type { CandleData, RequiredProperties } from '@vulcan-js/core'
import { createSignal, fp18 } from '@vulcan-js/core'

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
      const h = fp18.toFp18(bar.h)
      const l = fp18.toFp18(bar.l)
      const c = fp18.toFp18(bar.c)

      return fp18.toDnum((h + l + c) / 3n)
    }
  },
)

export { typicalPrice as typicalPriceIndicator }
