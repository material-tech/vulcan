import type { CandleData, RequiredProperties } from '@vulcan-js/core'
import type { Dnum } from 'dnum'
import { assert, createSignal, fp18 } from '@vulcan-js/core'

export interface ParabolicSarOptions {
  start: number
  increment: number
  max: number
}

export const defaultParabolicSarOptions: ParabolicSarOptions = {
  start: 0.02,
  increment: 0.02,
  max: 0.2,
}

export interface PSARPoint {
  psar: Dnum
  isUptrend: boolean
}

/**
 * Parabolic SAR (Stop and Reverse)
 *
 * Developed by J. Welles Wilder Jr. in 1978, the Parabolic SAR is a
 * trend-following indicator that provides potential entry and exit points.
 * It appears as a series of dots above or below the price, indicating
 * the current trend direction and potential reversal points.
 *
 * Formula:
 *   SAR_new = SAR_prev + AF * (EP - SAR_prev)
 *
 * Where:
 *   AF = Acceleration Factor (starts at `start`, increments by `increment`
 *        on each new EP, capped at `max`)
 *   EP = Extreme Point (highest high in uptrend, lowest low in downtrend)
 *
 * The SAR is clamped to not exceed the two prior bars' price range.
 * A reversal occurs when price penetrates the SAR level.
 *
 * @param source - Iterable of candle data with high and low prices
 * @param options - Configuration options
 * @param options.start - Initial acceleration factor (default: 0.02)
 * @param options.increment - AF increment per new extreme (default: 0.02)
 * @param options.max - Maximum acceleration factor (default: 0.2)
 * @returns Generator yielding PSARPoint objects with `psar` value and `isUptrend` flag
 */
export const psar = createSignal(
  ({ start, increment, max }) => {
    assert(start > 0, new RangeError(`Expected start to be positive, got ${start}`))
    assert(increment > 0, new RangeError(`Expected increment to be positive, got ${increment}`))
    assert(max > 0 && max >= start, new RangeError(`Expected max to be positive and >= start, got ${max}`))

    let count = 0
    let isUptrend = true
    let sar: bigint
    let ep: bigint
    let af: bigint
    let prevHigh: bigint
    let prevLow: bigint
    let prevPrevHigh: bigint
    let prevPrevLow: bigint

    const afStart = fp18.toFp18(start)
    const afIncrement = fp18.toFp18(increment)
    const afMax = fp18.toFp18(max)

    return (bar: RequiredProperties<CandleData, 'h' | 'l'>) => {
      const h = fp18.toFp18(bar.h)
      const l = fp18.toFp18(bar.l)
      count++

      // Bar 1: initialization
      if (count === 1) {
        isUptrend = true
        sar = l
        ep = h
        af = afStart
        prevHigh = h
        prevLow = l
        prevPrevHigh = h
        prevPrevLow = l
        return { psar: fp18.toDnum(sar), isUptrend }
      }

      // Bar 2: determine initial trend
      if (count === 2) {
        if (h > prevHigh) {
          isUptrend = true
          sar = prevLow
          ep = h
        }
        else {
          isUptrend = false
          sar = prevHigh
          ep = l
        }
        af = afStart
        prevPrevHigh = prevHigh
        prevPrevLow = prevLow
        prevHigh = h
        prevLow = l
        return { psar: fp18.toDnum(sar), isUptrend }
      }

      // Bar 3+: standard computation
      // Step A: calculate next SAR
      let nextSar = sar + fp18.mul(af, ep - sar)

      // Step B: clamp SAR
      if (isUptrend) {
        if (nextSar > prevLow)
          nextSar = prevLow
        if (nextSar > prevPrevLow)
          nextSar = prevPrevLow
      }
      else {
        if (nextSar < prevHigh)
          nextSar = prevHigh
        if (nextSar < prevPrevHigh)
          nextSar = prevPrevHigh
      }

      sar = nextSar

      // Step C: check for reversal
      let reversed = false
      if (isUptrend && l < sar) {
        isUptrend = false
        sar = ep
        ep = l
        af = afStart
        reversed = true
      }
      else if (!isUptrend && h > sar) {
        isUptrend = true
        sar = ep
        ep = h
        af = afStart
        reversed = true
      }

      // Step D: update EP and AF (only if no reversal)
      if (!reversed) {
        if (isUptrend && h > ep) {
          ep = h
          const newAf = af + afIncrement
          af = newAf > afMax ? afMax : newAf
        }
        else if (!isUptrend && l < ep) {
          ep = l
          const newAf = af + afIncrement
          af = newAf > afMax ? afMax : newAf
        }
      }

      // Step E: update prev tracking
      prevPrevHigh = prevHigh
      prevPrevLow = prevLow
      prevHigh = h
      prevLow = l

      return { psar: fp18.toDnum(sar), isUptrend }
    }
  },
  defaultParabolicSarOptions,
)

export { psar as parabolicSar }
