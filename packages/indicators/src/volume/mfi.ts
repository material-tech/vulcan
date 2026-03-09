import type { CandleData, RequiredProperties } from '@vulcan-js/core'
import { assert, createSignal, fp18 } from '@vulcan-js/core'
import * as prim from '../primitives'

export interface MFIOptions {
  /**
   * The lookback period for summing positive and negative money flows
   * @default 14
   */
  period: number
}

export const defaultMFIOptions: MFIOptions = {
  period: 14,
}

/**
 * Money Flow Index (MFI)
 *
 * A volume-weighted momentum indicator that measures the flow of money
 * into and out of a security over a specified period. Often referred to
 * as the volume-weighted RSI.
 *
 * Formula:
 *   Typical Price (TP) = (High + Low + Close) / 3
 *   Raw Money Flow = TP × Volume
 *   Positive Money Flow = Sum of Raw MF when TP > previous TP over N periods
 *   Negative Money Flow = Sum of Raw MF when TP < previous TP over N periods
 *   Money Flow Ratio = Positive MF / Negative MF
 *   MFI = 100 - (100 / (1 + Money Flow Ratio))
 *
 * @param source - Iterable of OHLCV candle data (requires high, low, close, volume)
 * @param options - Configuration options
 * @param options.period - The lookback period (default: 14)
 * @returns Generator yielding MFI values as Dnum tuples
 */
export const mfi = createSignal(
  ({ period }) => {
    assert(Number.isInteger(period) && period >= 1, new RangeError(`Expected period to be a positive integer, got ${period}`))
    const posSumProc = prim.msum(period)
    const negSumProc = prim.msum(period)
    let prevTp: bigint | undefined

    return (bar: RequiredProperties<CandleData, 'h' | 'l' | 'c' | 'v'>) => {
      const h = fp18.toFp18(bar.h)
      const l = fp18.toFp18(bar.l)
      const c = fp18.toFp18(bar.c)
      const v = fp18.toFp18(bar.v)

      const tp = fp18.div(h + l + c, fp18.toFp18(3))
      const rawMf = fp18.mul(tp, v)

      let posMf = fp18.ZERO
      let negMf = fp18.ZERO

      if (prevTp !== undefined) {
        if (tp > prevTp) {
          posMf = rawMf
        }
        else if (tp < prevTp) {
          negMf = rawMf
        }
      }

      prevTp = tp

      const posSum = posSumProc(posMf)
      const negSum = negSumProc(negMf)

      if (negSum === fp18.ZERO) {
        return fp18.toDnum(fp18.HUNDRED)
      }

      const mfr = fp18.div(posSum, negSum)
      return fp18.toDnum(fp18.HUNDRED - fp18.div(fp18.HUNDRED, fp18.ONE + mfr))
    }
  },
  defaultMFIOptions,
)

export { mfi as moneyFlowIndex }
