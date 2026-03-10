import type { Numberish } from 'dnum'
import { assert, createSignal, fp18 } from '@vulcan-js/core'
import * as prim from '../primitives'

export interface TrueStrengthIndexOptions {
  /**
   * The long period for the first EMA smoothing of price change
   * @default 25
   */
  longPeriod: number
  /**
   * The short period for the second EMA smoothing of price change
   * @default 13
   */
  shortPeriod: number
  /**
   * The signal period for the EMA of TSI
   * @default 7
   */
  signalPeriod: number
}

export interface TrueStrengthIndexResult {
  /** TSI value ranging from -100 to +100 */
  tsi: readonly [bigint, number]
  /** Signal line (EMA of TSI) */
  signal: readonly [bigint, number]
}

export const defaultTrueStrengthIndexOptions: TrueStrengthIndexOptions = {
  longPeriod: 25,
  shortPeriod: 13,
  signalPeriod: 7,
}

/**
 * True Strength Index (TSI)
 *
 * The True Strength Index is a momentum oscillator that measures the strength
 * of price movements. It is a double-smoothed version of the price change,
 * normalized by the double-smoothed absolute price change.
 *
 * Key levels:
 * - Overbought: > +25 (adjustable based on market)
 * - Oversold: < -25 (adjustable based on market)
 * - Centerline: 0 (neutral)
 *
 * Trading signals:
 * - TSI crossing above signal line: bullish
 * - TSI crossing below signal line: bearish
 * - TSI crossing above 0: bullish momentum
 * - TSI crossing below 0: bearish momentum
 *
 * Formula:
 *   PC = Current Close - Prior Close
 *   Double Smoothed PC = EMA(EMA(PC, longPeriod), shortPeriod)
 *   Double Smoothed Absolute PC = EMA(EMA(|PC|, longPeriod), shortPeriod)
 *   TSI = 100 * (Double Smoothed PC / Double Smoothed Absolute PC)
 *   Signal Line = EMA(TSI, signalPeriod)
 *
 * @param source - Iterable of closing prices
 * @param options - Configuration options
 * @returns Generator yielding TSI values with tsi and signal fields
 */
export const trueStrengthIndex = createSignal(
  ({ longPeriod, shortPeriod, signalPeriod }) => {
    assert(Number.isInteger(longPeriod) && longPeriod >= 1, new RangeError(`Expected longPeriod to be a positive integer, got ${longPeriod}`))
    assert(Number.isInteger(shortPeriod) && shortPeriod >= 1, new RangeError(`Expected shortPeriod to be a positive integer, got ${shortPeriod}`))
    assert(Number.isInteger(signalPeriod) && signalPeriod >= 1, new RangeError(`Expected signalPeriod to be a positive integer, got ${signalPeriod}`))

    // EMA processors for double smoothing
    const longK = prim.ewma.k(longPeriod)
    const shortK = prim.ewma.k(shortPeriod)
    const signalK = prim.ewma.k(signalPeriod)

    // First EMA of price change (long period)
    const pcLongEma1 = prim.ewma(longK)
    const absPcLongEma1 = prim.ewma(longK)

    // Second EMA of price change (short period)
    const pcLongEma2 = prim.ewma(shortK)
    const absPcLongEma2 = prim.ewma(shortK)

    // Signal line EMA
    const signalEma = prim.ewma(signalK)

    let prevClose: bigint | undefined

    return (value: Numberish): TrueStrengthIndexResult => {
      const close = fp18.toFp18(value)

      if (prevClose === undefined) {
        prevClose = close
        // Initialize EMAs with zero
        pcLongEma1(fp18.ZERO)
        absPcLongEma1(fp18.ZERO)
        pcLongEma2(fp18.ZERO)
        absPcLongEma2(fp18.ZERO)
        signalEma(fp18.ZERO)
        return {
          tsi: fp18.toDnum(fp18.ZERO),
          signal: fp18.toDnum(fp18.ZERO),
        }
      }

      // Calculate price change
      const pc = close - prevClose
      const absPc = pc < fp18.ZERO ? -pc : pc
      prevClose = close

      // Double smoothing of price change
      const smoothedPc1 = pcLongEma1(pc)
      const smoothedPc = pcLongEma2(smoothedPc1)

      // Double smoothing of absolute price change
      const smoothedAbsPc1 = absPcLongEma1(absPc)
      const smoothedAbsPc = absPcLongEma2(smoothedAbsPc1)

      // Calculate TSI
      // TSI = 100 * (Double Smoothed PC / Double Smoothed Absolute PC)
      let tsiValue: bigint
      if (smoothedAbsPc === fp18.ZERO) {
        tsiValue = fp18.ZERO
      }
      else {
        const ratio = fp18.div(smoothedPc, smoothedAbsPc)
        tsiValue = fp18.mul(ratio, fp18.HUNDRED)
      }

      // Calculate signal line
      const signalValue = signalEma(tsiValue)

      return {
        tsi: fp18.toDnum(tsiValue),
        signal: fp18.toDnum(signalValue),
      }
    }
  },
  defaultTrueStrengthIndexOptions,
)

export { trueStrengthIndex as tsi }
