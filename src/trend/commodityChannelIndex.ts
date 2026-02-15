import type { Dnum } from 'dnum'
import type { KlineData, RequiredProperties } from '~/types'
import { add, divide, equal, from, subtract } from 'dnum'
import { createSignal } from '~/base'
import { mapPick } from '~/helpers/array'
import { movingAction } from '~/helpers/operations'

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

function computeCCIFromWindow(window: Dnum[], period: number): Dnum {
  const n = window.length
  if (n < period) {
    return from(0, 18)
  }

  // SMA of typical prices in the window
  let sum: Dnum = from(0, 18)
  for (const tp of window) {
    sum = add(sum, tp)
  }
  const smaValue = divide(sum, n, 18)

  // Mean Deviation = SUM(|TP_i - SMA|) / period
  let devSum: Dnum = from(0, 18)
  for (const tp of window) {
    const diff = subtract(tp, smaValue)
    // Absolute value: if diff is negative, negate it
    const absDiff: Dnum = diff[0] < 0n ? [-diff[0], diff[1]] : diff
    devSum = add(devSum, absDiff)
  }
  const meanDev = divide(devSum, n, 18)

  if (equal(meanDev, 0)) {
    return from(0, 18)
  }

  // CCI = (TP - SMA) / (0.015 * meanDev)
  const currentTP = window[n - 1]
  const numerator = subtract(currentTP, smaValue)
  return divide(numerator, multiply015(meanDev), 18)
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
 *   CCI = (TP - SMA(TP, period)) / (0.015 x Mean Deviation)
 *   Mean Deviation = SUM(|TP_i - SMA|) / period
 *
 * @param data - Array of OHLC candle data
 * @param options - Configuration options
 * @param options.period - The period for CCI calculation (default: 20)
 * @returns Array of CCI values
 */
export const cci = createSignal({
  compute: (data: RequiredProperties<KlineData, 'h' | 'l' | 'c'>[], { period }: Required<CommodityChannelIndexOptions>) => {
    const highs = mapPick(data, 'h', v => from(v, 18))
    const lows = mapPick(data, 'l', v => from(v, 18))
    const closings = mapPick(data, 'c', v => from(v, 18))

    // TP = (High + Low + Close) / 3
    const typicalPrices = data.map((_, i): Dnum =>
      divide(add(add(highs[i], lows[i]), closings[i]), 3, 18),
    )

    return movingAction(
      typicalPrices,
      (window): Dnum => computeCCIFromWindow(window, period),
      period,
    )
  },
  stream: ({ period }: Required<CommodityChannelIndexOptions>) => {
    const buffer: Dnum[] = []
    return (data: RequiredProperties<KlineData, 'h' | 'l' | 'c'>) => {
      const tp = divide(add(add(from(data.h, 18), from(data.l, 18)), from(data.c, 18)), 3, 18)
      buffer.push(tp)
      if (buffer.length > period)
        buffer.shift()
      return computeCCIFromWindow(buffer, period)
    }
  },
  defaultOptions: defaultCCIOptions,
})

export { cci as commodityChannelIndex }
