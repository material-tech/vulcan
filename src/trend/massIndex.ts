import type { Dnum } from 'dnum'
import type { KlineData, Processor, RequiredProperties } from '~/types'
import { divide, from, subtract } from 'dnum'
import { createGenerator } from '~/base'
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

function createMiProcessor({ emaPeriod, miPeriod }: Required<MassIndexOptions>): Processor<RequiredProperties<KlineData, 'h' | 'l'>, Dnum> {
  const ema1Proc = ema.createProcessor({ period: emaPeriod })
  const ema2Proc = ema.createProcessor({ period: emaPeriod })
  const msumProc = msum.createProcessor({ period: miPeriod })

  return (bar) => {
    const range = subtract(from(bar.h, 18), from(bar.l, 18))
    const e1 = ema1Proc(range)
    const e2 = ema2Proc(e1)
    const ratio = divide(e1, e2, 18)
    return msumProc(ratio)
  }
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
 * @param source - Iterable of OHLC candle data (requires high and low)
 * @param options - Configuration options
 * @param options.emaPeriod - The EMA smoothing period (default: 9)
 * @param options.miPeriod - The moving sum period (default: 25)
 * @returns Generator yielding Mass Index values
 */
export const mi = createGenerator(createMiProcessor, defaultMassIndexOptions)

export { mi as massIndex }
