import type { Dnum } from 'dnum'
import type { KlineData, RequiredProperties } from '~/types'
import { divide, from, subtract } from 'dnum'
import { createSignal } from '~/base'
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
export const mi = createSignal(({ emaPeriod, miPeriod }: Required<MassIndexOptions>) => {
  const ema1 = ema.step({ period: emaPeriod })
  const ema2 = ema.step({ period: emaPeriod })
  const msumStream = msum.step({ period: miPeriod })
  return (data: RequiredProperties<KlineData, 'h' | 'l'>): Dnum => {
    const range = subtract(from(data.h, 18), from(data.l, 18))
    const e1 = ema1(range)
    const e2 = ema2(e1)
    const ratio = divide(e1, e2, 18)
    return msumStream(ratio)
  }
}, defaultMassIndexOptions)

export { mi as massIndex }
