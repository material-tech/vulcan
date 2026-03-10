import type { CandleData, RequiredProperties } from '@vulcan-js/core'
import { assert, createSignal, fp18 } from '@vulcan-js/core'
import * as prim from '../primitives'

export interface UltimateOscillatorOptions {
  /**
   * The short period for UO calculation
   * @default 7
   */
  shortPeriod: number
  /**
   * The medium period for UO calculation
   * @default 14
   */
  mediumPeriod: number
  /**
   * The long period for UO calculation
   * @default 28
   */
  longPeriod: number
  /**
   * The weight for short period
   * @default 4.0
   */
  weight1: number
  /**
   * The weight for medium period
   * @default 2.0
   */
  weight2: number
  /**
   * The weight for long period
   * @default 1.0
   */
  weight3: number
}

export const defaultUltimateOscillatorOptions: UltimateOscillatorOptions = {
  shortPeriod: 7,
  mediumPeriod: 14,
  longPeriod: 28,
  weight1: 4.0,
  weight2: 2.0,
  weight3: 1.0,
}

/**
 * Ultimate Oscillator (UO)
 *
 * Developed by Larry Williams in 1976, the Ultimate Oscillator attempts to
 * capture momentum across three different timeframes. It is a range-bound
 * indicator that fluctuates between 0 and 100.
 *
 * Unlike many oscillators that use a single timeframe, the Ultimate Oscillator
 * uses weighted sums of three different periods (typically 7, 14, and 28) to
 * smooth out fluctuations and reduce false signals.
 *
 * Key levels:
 * - Overbought: > 70
 * - Oversold: < 30
 *
 * Formula:
 *   BP = Close - Min(Low, Prior Close)
 *   TR = Max(High, Prior Close) - Min(Low, Prior Close)
 *   Average BP = SMA(BP, period)
 *   Average TR = SMA(TR, period)
 *   RawUO = 100 * ((w1*AvgBP_short/AvgTR_short) + (w2*AvgBP_medium/AvgTR_medium) + (w3*AvgBP_long/AvgTR_long)) / (w1+w2+w3)
 *
 * @param source - Iterable of OHLC candle data
 * @param options - Configuration options
 * @returns Generator yielding Ultimate Oscillator values (0-100)
 */
export const ultimateOscillator = createSignal(
  ({ shortPeriod, mediumPeriod, longPeriod, weight1, weight2, weight3 }) => {
    assert(Number.isInteger(shortPeriod) && shortPeriod >= 1, new RangeError(`Expected shortPeriod to be a positive integer, got ${shortPeriod}`))
    assert(Number.isInteger(mediumPeriod) && mediumPeriod >= 1, new RangeError(`Expected mediumPeriod to be a positive integer, got ${mediumPeriod}`))
    assert(Number.isInteger(longPeriod) && longPeriod >= 1, new RangeError(`Expected longPeriod to be a positive integer, got ${longPeriod}`))

    const bpShortProc = prim.sma(shortPeriod)
    const trShortProc = prim.sma(shortPeriod)
    const bpMediumProc = prim.sma(mediumPeriod)
    const trMediumProc = prim.sma(mediumPeriod)
    const bpLongProc = prim.sma(longPeriod)
    const trLongProc = prim.sma(longPeriod)

    const weight1Fp = fp18.toFp18(weight1)
    const weight2Fp = fp18.toFp18(weight2)
    const weight3Fp = fp18.toFp18(weight3)
    const totalWeight = weight1Fp + weight2Fp + weight3Fp

    let prevClose: bigint | null = null
    let count = 0

    return (bar: RequiredProperties<CandleData, 'h' | 'l' | 'c'>) => {
      const high = fp18.toFp18(bar.h)
      const low = fp18.toFp18(bar.l)
      const close = fp18.toFp18(bar.c)

      // Calculate Buying Pressure (BP) and True Range (TR)
      let bp: bigint
      let tr: bigint

      if (prevClose === null) {
        // First bar
        bp = close - low
        tr = high - low
      }
      else {
        const minLowPrevClose = low < prevClose ? low : prevClose
        const maxHighPrevClose = high > prevClose ? high : prevClose
        bp = close - minLowPrevClose
        tr = maxHighPrevClose - minLowPrevClose
      }

      prevClose = close
      count++

      // Calculate average BP and TR for each period
      const avgBpShort = bpShortProc(bp)
      const avgTrShort = trShortProc(tr)
      const avgBpMedium = bpMediumProc(bp)
      const avgTrMedium = trMediumProc(tr)
      const avgBpLong = bpLongProc(bp)
      const avgTrLong = trLongProc(tr)

      // Check if we have enough data for all periods
      // Return 0 during warm-up period (until we have at least longPeriod data points)
      // Note: count starts at 1 after first bar, so we need count <= longPeriod for warm-up
      if (count <= longPeriod) {
        return fp18.toDnum(fp18.ZERO)
      }

      // Calculate the ratio for each timeframe
      const ratioShort = fp18.div(avgBpShort, avgTrShort)
      const ratioMedium = fp18.div(avgBpMedium, avgTrMedium)
      const ratioLong = fp18.div(avgBpLong, avgTrLong)

      // Weighted average of ratios
      const weightedSum = fp18.mul(weight1Fp, ratioShort) + fp18.mul(weight2Fp, ratioMedium) + fp18.mul(weight3Fp, ratioLong)
      const avgRatio = fp18.div(weightedSum, totalWeight)

      // Convert to 0-100 scale
      const uo = fp18.mul(avgRatio, fp18.HUNDRED)

      return fp18.toDnum(uo)
    }
  },
  defaultUltimateOscillatorOptions,
)
