import type { KlineData, RequiredProperties } from '~/types'
import { divide, from, subtract } from 'dnum'
import { createSignal } from '~/base'
import { mapPick } from '~/helpers/array'
import { ema } from './exponentialMovingAverage'
import { msum } from './movingSum'

export interface MassIndexOptions {
  /**
   * The period for EMA smoothing of the high-low range
   * @default 9
   */
  emaPeriod: number
  /**
   * The period for the moving sum of the EMA ratio
   * @default 25
   */
  miPeriod: number
}

export const defaultMassIndexOptions: MassIndexOptions = {
  emaPeriod: 9,
  miPeriod: 25,
}

/**
 * Mass Index (MI)
 *
 * Developed by Donald Dorsey, the Mass Index uses the high-low range
 * to identify trend reversals based on range expansions. A "reversal bulge"
 * occurs when the Mass Index rises above 27 and then falls below 26.5.
 *
 * Formula:
 *   Range = High - Low
 *   EMA1 = EMA(Range, emaPeriod)
 *   EMA2 = EMA(EMA1, emaPeriod)
 *   Ratio = EMA1 / EMA2
 *   MI = MovingSum(Ratio, miPeriod)
 *
 * @param data - Array of OHLC candle data (requires high and low)
 * @param options - Configuration options
 * @param options.emaPeriod - The EMA smoothing period (default: 9)
 * @param options.miPeriod - The moving sum period (default: 25)
 * @returns Array of Mass Index values
 */
export const mi = createSignal(
  (data: RequiredProperties<KlineData, 'h' | 'l'>[], { emaPeriod, miPeriod }: Required<MassIndexOptions>) => {
    const highs = mapPick(data, 'h', v => from(v, 18))
    const lows = mapPick(data, 'l', v => from(v, 18))

    // Range = High - Low
    const ranges = data.map((_, i) => subtract(highs[i], lows[i]))

    // EMA1 = EMA(Range, emaPeriod)
    const ema1 = ema(ranges, { period: emaPeriod })

    // EMA2 = EMA(EMA1, emaPeriod)
    const ema2 = ema(ema1, { period: emaPeriod })

    // Ratio = EMA1 / EMA2
    const ratios = ema1.map((_, i) => divide(ema1[i], ema2[i], 18))

    // MI = MovingSum(Ratio, miPeriod)
    return msum(ratios, { period: miPeriod })
  },
  defaultMassIndexOptions,
)

export { mi as massIndex }
