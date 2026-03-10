import type { CandleData, RequiredProperties } from '@vulcan-js/core'
import { assert, createSignal, fp18 } from '@vulcan-js/core'
import * as prim from '../primitives'

export interface EaseOfMovementOptions {
  /**
   * The lookback period for SMA smoothing of Raw EOM
   * @default 14
   */
  period: number
  /**
   * Divisor to scale down volume for Box Ratio calculation
   * @default 10000
   */
  volumeDivisor: number
}

export const defaultEaseOfMovementOptions: EaseOfMovementOptions = {
  period: 14,
  volumeDivisor: 10000,
}

export interface EaseOfMovementResult {
  /**
   * Raw Ease of Movement value (not smoothed)
   */
  raw: readonly [bigint, number]
  /**
   * Smoothed Ease of Movement value (SMA of Raw EOM)
   */
  smoothed: readonly [bigint, number]
}

/**
 * Ease of Movement (EOM)
 *
 * A volume-based oscillator that measures the relationship between price change
 * and volume. It quantifies how easily price can move - large price moves on
 * light volume generate high EOM values, while small price moves on heavy
 * volume generate low EOM values.
 *
 * Formula:
 *   Distance Moved = ((High + Low) / 2) - ((Prior High + Prior Low) / 2)
 *   Box Ratio = (Volume / volumeDivisor) / (High - Low)
 *   Raw EOM = Distance Moved / Box Ratio
 *   EOM = SMA(Raw EOM, period)
 *
 * @param source - Iterable of OHLCV candle data (requires high, low, volume)
 * @param options - Configuration options
 * @param options.period - The lookback period for SMA smoothing (default: 14)
 * @param options.volumeDivisor - Divisor to scale volume (default: 10000)
 * @returns Generator yielding EOM values (smoothed values only)
 *
 * @example
 * ```ts
 * const eomValues = collect(eom(candles, { period: 14 }))
 * // Each value is a Dnum tuple: [bigint, number]
 * ```
 */
export const eom = createSignal(
  ({ period, volumeDivisor }) => {
    assert(Number.isInteger(period) && period >= 1, new RangeError(`Expected period to be a positive integer, got ${period}`))
    assert(volumeDivisor > 0, new RangeError(`Expected volumeDivisor to be positive, got ${volumeDivisor}`))

    const smaProc = prim.sma(period)
    let prevMidpoint: bigint | undefined
    const volumeDivisorFp = fp18.toFp18(volumeDivisor)

    return (bar: RequiredProperties<CandleData, 'h' | 'l' | 'v'>): readonly [bigint, number] => {
      const h = fp18.toFp18(bar.h)
      const l = fp18.toFp18(bar.l)
      const v = fp18.toFp18(bar.v)

      const midpoint = fp18.div(h + l, fp18.TWO)

      // First bar: no distance moved
      if (prevMidpoint === undefined) {
        prevMidpoint = midpoint
        const rawEom = fp18.ZERO
        const smoothed = smaProc(rawEom)
        return fp18.toDnum(smoothed)
      }

      const distanceMoved = midpoint - prevMidpoint
      prevMidpoint = midpoint

      const highLowDiff = h - l

      // Handle zero range to avoid division by zero
      if (highLowDiff === fp18.ZERO) {
        const rawEom = fp18.ZERO
        const smoothed = smaProc(rawEom)
        return fp18.toDnum(smoothed)
      }

      // Box Ratio = (Volume / volumeDivisor) / (High - Low)
      // = Volume / (volumeDivisor * (High - Low))
      const boxRatio = fp18.div(fp18.div(v, volumeDivisorFp), highLowDiff)

      // Raw EOM = Distance Moved / Box Ratio
      const rawEom = fp18.div(distanceMoved, boxRatio)

      // Smoothed EOM = SMA(Raw EOM, period)
      const smoothed = smaProc(rawEom)

      return fp18.toDnum(smoothed)
    }
  },
  defaultEaseOfMovementOptions,
)

/**
 * Ease of Movement with detailed output (raw + smoothed values)
 *
 * Same calculation as `eom` but returns both raw and smoothed values
 * for each data point.
 *
 * @param source - Iterable of OHLCV candle data (requires high, low, volume)
 * @param options - Configuration options
 * @param options.period - The lookback period for SMA smoothing (default: 14)
 * @param options.volumeDivisor - Divisor to scale volume (default: 10000)
 * @returns Generator yielding { raw, smoothed } objects
 *
 * @example
 * ```ts
 * const results = collect(eomDetailed(candles))
 * // Each result: { raw: [bigint, number], smoothed: [bigint, number] }
 * ```
 */
export const eomDetailed = createSignal(
  ({ period, volumeDivisor }) => {
    assert(Number.isInteger(period) && period >= 1, new RangeError(`Expected period to be a positive integer, got ${period}`))
    assert(volumeDivisor > 0, new RangeError(`Expected volumeDivisor to be positive, got ${volumeDivisor}`))

    const smaProc = prim.sma(period)
    let prevMidpoint: bigint | undefined
    const volumeDivisorFp = fp18.toFp18(volumeDivisor)

    return (bar: RequiredProperties<CandleData, 'h' | 'l' | 'v'>): EaseOfMovementResult => {
      const h = fp18.toFp18(bar.h)
      const l = fp18.toFp18(bar.l)
      const v = fp18.toFp18(bar.v)

      const midpoint = fp18.div(h + l, fp18.TWO)

      // First bar: no distance moved
      if (prevMidpoint === undefined) {
        prevMidpoint = midpoint
        const rawEom = fp18.ZERO
        const smoothed = smaProc(rawEom)
        return {
          raw: fp18.toDnum(rawEom),
          smoothed: fp18.toDnum(smoothed),
        }
      }

      const distanceMoved = midpoint - prevMidpoint
      prevMidpoint = midpoint

      const highLowDiff = h - l

      // Handle zero range to avoid division by zero
      if (highLowDiff === fp18.ZERO) {
        const rawEom = fp18.ZERO
        const smoothed = smaProc(rawEom)
        return {
          raw: fp18.toDnum(rawEom),
          smoothed: fp18.toDnum(smoothed),
        }
      }

      // Box Ratio = (Volume / volumeDivisor) / (High - Low)
      const boxRatio = fp18.div(fp18.div(v, volumeDivisorFp), highLowDiff)

      // Raw EOM = Distance Moved / Box Ratio
      const rawEom = fp18.div(distanceMoved, boxRatio)

      // Smoothed EOM = SMA(Raw EOM, period)
      const smoothed = smaProc(rawEom)

      return {
        raw: fp18.toDnum(rawEom),
        smoothed: fp18.toDnum(smoothed),
      }
    }
  },
  defaultEaseOfMovementOptions,
)

export { eom as easeOfMovement, eomDetailed as easeOfMovementDetailed }
