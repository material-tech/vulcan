import type { CandleData, RequiredProperties } from '@vulcan-js/core'
import type { Dnum } from 'dnum'
import { assert, constants, createSignal, toDnum } from '@vulcan-js/core'
import { abs, add, divide, equal, subtract } from 'dnum'

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
    const buffer: Dnum[] = []

    return (bar: RequiredProperties<CandleData, 'h' | 'l' | 'c'>) => {
      const h = toDnum(bar.h)
      const l = toDnum(bar.l)
      const c = toDnum(bar.c)
      const tp = divide(add(add(h, l), c), 3, constants.DECIMALS)

      buffer.push(tp)
      if (buffer.length > period)
        buffer.shift()

      const n = buffer.length
      if (n < period) {
        return constants.ZERO
      }

      // SMA and Mean Deviation in a single pass
      let sum: Dnum = constants.ZERO
      for (const v of buffer) {
        sum = add(sum, v)
      }
      const smaVal = divide(sum, n, constants.DECIMALS)

      let devSum: Dnum = constants.ZERO
      for (const v of buffer) {
        devSum = add(devSum, abs(subtract(v, smaVal)))
      }
      const meanDev = divide(devSum, n, constants.DECIMALS)

      if (equal(meanDev, 0)) {
        return constants.ZERO
      }

      const currentTP = buffer[n - 1]
      const numerator = subtract(currentTP, smaVal)
      // 0.015 = 15/1000, the Lambert constant
      const lambertMeanDev = divide(
        [meanDev[0] * 15n, meanDev[1]],
        [1000n, 0],
        constants.DECIMALS,
      )
      return divide(numerator, lambertMeanDev, constants.DECIMALS)
    }
  },
  defaultCCIOptions,
)

export { cci as commodityChannelIndex }
