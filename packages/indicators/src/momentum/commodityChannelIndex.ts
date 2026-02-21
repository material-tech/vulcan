import type { CandleData, RequiredProperties } from '@vulcan-js/core'
import { assert, createSignal, fp18 } from '@vulcan-js/core'

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

// Lambert constant: 0.015 = 15 * SCALE / 1000
const LAMBERT = 15n * fp18.SCALE / 1000n

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
  ({ period }) => {
    assert(Number.isInteger(period) && period >= 1, new RangeError(`Expected period to be a positive integer, got ${period}`))
    const buffer: bigint[] = []
    const periodBig = BigInt(period)

    return (bar: RequiredProperties<CandleData, 'h' | 'l' | 'c'>) => {
      const h = fp18.toFp18(bar.h)
      const l = fp18.toFp18(bar.l)
      const c = fp18.toFp18(bar.c)
      const tp = (h + l + c) / 3n

      buffer.push(tp)
      if (buffer.length > period)
        buffer.shift()

      const n = buffer.length
      if (n < period) {
        return fp18.toDnum(fp18.ZERO)
      }

      // SMA and Mean Deviation in a single pass
      let sum = fp18.ZERO
      for (const v of buffer) {
        sum += v
      }
      const smaVal = sum / periodBig

      let devSum = fp18.ZERO
      for (const v of buffer) {
        devSum += fp18.abs(v - smaVal)
      }
      const meanDev = devSum / periodBig

      if (meanDev === fp18.ZERO) {
        return fp18.toDnum(fp18.ZERO)
      }

      const currentTP = buffer[n - 1]
      const numerator = currentTP - smaVal
      // CCI = numerator / (0.015 * meanDev)
      const lambertMeanDev = fp18.mul(LAMBERT, meanDev)
      return fp18.toDnum(fp18.div(numerator, lambertMeanDev))
    }
  },
  defaultCCIOptions,
)

export { cci as commodityChannelIndex }
