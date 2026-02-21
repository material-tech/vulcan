import type { CandleData, RequiredProperties } from '@vulcan-js/core'
import { assert, createSignal, fp18 } from '@vulcan-js/core'
import { createEmaFp18 } from '../trend/exponentialMovingAverage'
import { createMsumFp18 } from '../trend/movingSum'

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
 * @param source - Iterable of OHLC candle data (requires high and low)
 * @param options - Configuration options
 * @param options.emaPeriod - The EMA smoothing period (default: 9)
 * @param options.miPeriod - The moving sum period (default: 25)
 * @returns Generator yielding Mass Index values
 */
export const mi = createSignal(
  ({ emaPeriod, miPeriod }) => {
    assert(Number.isInteger(emaPeriod) && emaPeriod >= 1, new RangeError(`Expected emaPeriod to be a positive integer, got ${emaPeriod}`))
    assert(Number.isInteger(miPeriod) && miPeriod >= 1, new RangeError(`Expected miPeriod to be a positive integer, got ${miPeriod}`))
    const ema1Proc = createEmaFp18({ period: emaPeriod })
    const ema2Proc = createEmaFp18({ period: emaPeriod })
    const msumProc = createMsumFp18({ period: miPeriod })

    return (bar: RequiredProperties<CandleData, 'h' | 'l'>) => {
      const range = fp18.toFp18(bar.h) - fp18.toFp18(bar.l)
      const e1 = ema1Proc(range)
      const e2 = ema2Proc(e1)
      const ratio = fp18.div(e1, e2)
      return fp18.toDnum(msumProc(ratio))
    }
  },
  defaultMassIndexOptions,
)

export { mi as massIndex }
