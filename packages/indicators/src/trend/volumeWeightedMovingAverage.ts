import type { CandleData, RequiredProperties } from '@vulcan-js/core'
import type { Dnum } from 'dnum'
import { assert, createSignal } from '@vulcan-js/core'
import { add, divide, from, multiply, subtract } from 'dnum'

export interface VwmaOptions {
  /**
   * The number of periods for calculating the volume weighted moving average
   * @default 20
   */
  period: number
}

export const defaultVwmaOptions: VwmaOptions = {
  period: 20,
}

/**
 * Volume Weighted Moving Average (VWMA)
 *
 * VWMA weights each price by its corresponding volume, giving more
 * influence to prices with higher trading activity. It is useful for
 * confirming trends and identifying divergences between price and volume.
 *
 * Formula: VWMA = Sum(Close × Volume, period) / Sum(Volume, period)
 *
 * Interpretation:
 * - When VWMA is below price, it suggests bullish sentiment (higher volume at higher prices)
 * - When VWMA is above price, it suggests bearish sentiment (higher volume at lower prices)
 * - Crossovers with SMA can signal volume-confirmed trend changes
 *
 * @param source - Iterable of candle data with close price and volume
 * @param options - Configuration options
 * @param options.period - The number of periods (default: 20)
 * @returns Generator yielding VWMA values as Dnum
 */
export const vwma = createSignal(
  ({ period }) => {
    assert(Number.isInteger(period) && period >= 1, new RangeError(`Expected period to be a positive integer, got ${period}`))

    const pvBuffer: Dnum[] = Array.from({ length: period })
    const vBuffer: Dnum[] = Array.from({ length: period })
    let head = 0
    let count = 0
    let pvSum: Dnum = from(0, 18)
    let vSum: Dnum = from(0, 18)

    return (bar: RequiredProperties<CandleData, 'c' | 'v'>) => {
      const close = from(bar.c, 18)
      const volume = from(bar.v, 18)
      const pv = multiply(close, volume, 18)

      if (count < period) {
        pvBuffer[count] = pv
        vBuffer[count] = volume
        pvSum = add(pvSum, pv)
        vSum = add(vSum, volume)
        count++
      }
      else {
        pvSum = subtract(pvSum, pvBuffer[head])
        vSum = subtract(vSum, vBuffer[head])
        pvBuffer[head] = pv
        vBuffer[head] = volume
        pvSum = add(pvSum, pv)
        vSum = add(vSum, volume)
        head = (head + 1) % period
      }

      return divide(pvSum, vSum, 18)
    }
  },
  defaultVwmaOptions,
)

export { vwma as volumeWeightedMovingAverage }
