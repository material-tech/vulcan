import type { CandleData, RequiredProperties } from '@vulcan-js/core'
import { assert, createSignal, fp18 } from '@vulcan-js/core'

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
 * Formula: VWMA = Sum(Close * Volume, period) / Sum(Volume, period)
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

    const pvBuffer: bigint[] = Array.from({ length: period })
    const vBuffer: bigint[] = Array.from({ length: period })
    let head = 0
    let count = 0
    let pvSum = fp18.ZERO
    let vSum = fp18.ZERO

    return (bar: RequiredProperties<CandleData, 'c' | 'v'>) => {
      const close = fp18.toFp18(bar.c)
      const volume = fp18.toFp18(bar.v)
      const pv = fp18.mul(close, volume)

      if (count < period) {
        pvBuffer[count] = pv
        vBuffer[count] = volume
        pvSum += pv
        vSum += volume
        count++
      }
      else {
        pvSum -= pvBuffer[head]
        vSum -= vBuffer[head]
        pvBuffer[head] = pv
        vBuffer[head] = volume
        pvSum += pv
        vSum += volume
        head = (head + 1) % period
      }

      return fp18.toDnum(fp18.div(pvSum, vSum))
    }
  },
  defaultVwmaOptions,
)

export { vwma as volumeWeightedMovingAverage }
