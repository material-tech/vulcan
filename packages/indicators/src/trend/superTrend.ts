import type { CandleData, RequiredProperties } from '@vulcan-js/core'
import type { Dnum } from 'dnum'
import { assert, createSignal, fp18 } from '@vulcan-js/core'
import { rma } from '../primitives/rma'

export interface SuperTrendOptions {
  /**
   * ATR smoothing period (Wilder's RMA)
   * @default 10
   */
  period: number
  /**
   * ATR multiplier controlling band width
   * @default 3
   */
  multiplier: number
}

export const defaultSuperTrendOptions: SuperTrendOptions = {
  period: 10,
  multiplier: 3,
}

export interface SuperTrendPoint {
  /** SuperTrend value — dynamic support (uptrend) or resistance (downtrend) */
  superTrend: Dnum
  /** Trend direction: 1 = uptrend (bullish), -1 = downtrend (bearish) */
  direction: 1 | -1
}

/**
 * SuperTrend Indicator
 *
 * A trend-following overlay that uses ATR to set trailing stop levels.
 * When price closes above the SuperTrend line the trend is bullish;
 * when below, bearish. Band levels are "ratcheted" — they only move
 * in the trend direction, preventing whipsaws.
 *
 * Formula:
 *   HL2 = (High + Low) / 2
 *   TR  = max(H − L, |H − prevClose|, |L − prevClose|)
 *   ATR = RMA(TR, period)
 *   Upper Basic = HL2 + multiplier × ATR
 *   Lower Basic = HL2 − multiplier × ATR
 *   Final Upper = min(Upper Basic, prev Final Upper)  if prevClose ≤ prev Final Upper
 *   Final Lower = max(Lower Basic, prev Final Lower)  if prevClose ≥ prev Final Lower
 *   SuperTrend  = Final Lower when bullish, Final Upper when bearish
 *
 * @param source - Iterable of OHLC candle data (requires high, low, close)
 * @param options - Configuration options
 * @param options.period - ATR smoothing period (default: 10)
 * @param options.multiplier - ATR multiplier for band width (default: 3)
 * @returns Generator yielding SuperTrendPoint values with superTrend and direction
 */
export const superTrend = createSignal(
  ({ period, multiplier }) => {
    assert(Number.isInteger(period) && period >= 1, new RangeError(`Expected period to be a positive integer, got ${period}`))
    assert(multiplier > 0, new RangeError(`Expected multiplier to be positive, got ${multiplier}`))

    const atrSmooth = rma(period)
    const mult = fp18.toFp18(multiplier)

    let prevC: bigint | null = null
    let prevFinalUpper = fp18.ZERO
    let prevFinalLower = fp18.ZERO
    let prevSuperTrend = fp18.ZERO
    let direction: 1 | -1 = 1

    return (bar: RequiredProperties<CandleData, 'h' | 'l' | 'c'>): SuperTrendPoint => {
      const h = fp18.toFp18(bar.h)
      const l = fp18.toFp18(bar.l)
      const c = fp18.toFp18(bar.c)
      const hl2 = (h + l) / 2n

      if (prevC === null) {
        // First bar: TR = H - L (no previous close available)
        const tr = h - l
        const atr = atrSmooth(tr)
        const upper = hl2 + fp18.mul(mult, atr)
        const lower = hl2 - fp18.mul(mult, atr)

        prevFinalUpper = upper
        prevFinalLower = lower
        direction = 1
        prevSuperTrend = lower
        prevC = c

        return { superTrend: fp18.toDnum(lower), direction }
      }

      // True Range
      const hl = h - l
      const hpc = fp18.abs(h - prevC)
      const lpc = fp18.abs(l - prevC)
      let tr = hl
      if (hpc > tr)
        tr = hpc
      if (lpc > tr)
        tr = lpc

      const atr = atrSmooth(tr)
      const basicUpper = hl2 + fp18.mul(mult, atr)
      const basicLower = hl2 - fp18.mul(mult, atr)

      // Ratchet: only allow upper to move down, lower to move up
      const finalUpper = (basicUpper < prevFinalUpper || prevC > prevFinalUpper)
        ? basicUpper
        : prevFinalUpper

      const finalLower = (basicLower > prevFinalLower || prevC < prevFinalLower)
        ? basicLower
        : prevFinalLower

      // Determine direction and SuperTrend value
      let st: bigint
      if (prevSuperTrend === prevFinalUpper) {
        // Previously in downtrend
        if (c > finalUpper) {
          direction = 1
          st = finalLower
        }
        else {
          direction = -1
          st = finalUpper
        }
      }
      else {
        // Previously in uptrend
        if (c < finalLower) {
          direction = -1
          st = finalUpper
        }
        else {
          direction = 1
          st = finalLower
        }
      }

      prevC = c
      prevFinalUpper = finalUpper
      prevFinalLower = finalLower
      prevSuperTrend = st

      return { superTrend: fp18.toDnum(st), direction }
    }
  },
  defaultSuperTrendOptions,
)

export { superTrend as superTrendIndicator }
