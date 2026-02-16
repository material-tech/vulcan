import type { Dnum } from 'dnum'
import type { KlineData, RequiredProperties } from '~/types'
import { add, divide, equal, from, subtract } from 'dnum'
import { createSignal } from '~/base'

export interface CommodityChannelIndexOptions {
  /**
   * The period for CCI calculation
   * @default 20
   */
  period: number
}

export const defaultCCIOptions: CommodityChannelIndexOptions = {
  period: 20,
}

/**
 * Multiply a Dnum value by 0.015 (the Lambert constant)
 */
function multiply015(value: Dnum): Dnum {
  // 0.015 = 15/1000, use integer math to avoid precision issues
  return divide(
    [value[0] * 15n, value[1]],
    [1000n, 0],
    18,
  )
}

/**
 * Commodity Channel Index (CCI)
 *
 * Developed by Donald Lambert in 1980, CCI measures the deviation of the
 * typical price from its simple moving average, normalized by mean deviation.
 * The constant 0.015 ensures approximately 70-80% of CCI values fall between
 * +100 and -100.
 *
 * Formula:
 *   TP = (High + Low + Close) / 3
 *   CCI = (TP - SMA(TP, period)) / (0.015 * Mean Deviation)
 *   Mean Deviation = SUM(|TP_i - SMA|) / period
 *
 * @param source - Iterable of OHLC candle data
 * @param options - Configuration options
 * @param options.period - The period for CCI calculation (default: 20)
 * @returns Generator yielding CCI values
 */
export const cci = createSignal(
  ({ period }: Required<CommodityChannelIndexOptions>) => {
    const buffer: Dnum[] = []

    return (bar: RequiredProperties<KlineData, 'h' | 'l' | 'c'>) => {
      const h = from(bar.h, 18)
      const l = from(bar.l, 18)
      const c = from(bar.c, 18)
      const tp = divide(add(add(h, l), c), 3, 18)

      buffer.push(tp)
      if (buffer.length > period)
        buffer.shift()

      const n = buffer.length
      if (n < period) {
        return from(0, 18)
      }

      // SMA of typical prices in the window
      let sum: Dnum = from(0, 18)
      for (const v of buffer) {
        sum = add(sum, v)
      }
      const smaVal = divide(sum, n, 18)

      // Mean Deviation
      let devSum: Dnum = from(0, 18)
      for (const v of buffer) {
        const diff = subtract(v, smaVal)
        const absDiff: Dnum = diff[0] < 0n ? [-diff[0], diff[1]] : diff
        devSum = add(devSum, absDiff)
      }
      const meanDev = divide(devSum, n, 18)

      if (equal(meanDev, 0)) {
        return from(0, 18)
      }

      const currentTP = buffer[n - 1]
      const numerator = subtract(currentTP, smaVal)
      return divide(numerator, multiply015(meanDev), 18)
    }
  },
  defaultCCIOptions,
)

export { cci as commodityChannelIndex }
