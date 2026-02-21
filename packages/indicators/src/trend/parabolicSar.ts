import type { CandleData, RequiredProperties } from '@vulcan-js/core'
import type { Dnum } from 'dnum'
import { assert, createSignal } from '@vulcan-js/core'
import { add, from, gt, lt, mul, sub } from 'dnum'

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
    let sar: Dnum
    let ep: Dnum
    let af: Dnum
    let prevHigh: Dnum
    let prevLow: Dnum
    let prevPrevHigh: Dnum
    let prevPrevLow: Dnum

    const afStart = from(start, 18)
    const afIncrement = from(increment, 18)
    const afMax = from(max, 18)

    return (bar: RequiredProperties<CandleData, 'h' | 'l'>) => {
      const h = from(bar.h, 18)
      const l = from(bar.l, 18)
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
        return { psar: sar, isUptrend }
      }

      // Bar 2: determine initial trend
      if (count === 2) {
        if (gt(h, prevHigh)) {
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
        return { psar: sar, isUptrend }
      }

      // Bar 3+: standard computation
      // Step A: calculate next SAR
      let nextSar = add(sar, mul(af, sub(ep, sar), 18))

      // Step B: clamp SAR
      if (isUptrend) {
        if (gt(nextSar, prevLow))
          nextSar = prevLow
        if (gt(nextSar, prevPrevLow))
          nextSar = prevPrevLow
      }
      else {
        if (lt(nextSar, prevHigh))
          nextSar = prevHigh
        if (lt(nextSar, prevPrevHigh))
          nextSar = prevPrevHigh
      }

      sar = nextSar

      // Step C: check for reversal
      let reversed = false
      if (isUptrend && lt(l, sar)) {
        isUptrend = false
        sar = ep
        ep = l
        af = afStart
        reversed = true
      }
      else if (!isUptrend && gt(h, sar)) {
        isUptrend = true
        sar = ep
        ep = h
        af = afStart
        reversed = true
      }

      // Step D: update EP and AF (only if no reversal)
      if (!reversed) {
        if (isUptrend && gt(h, ep)) {
          ep = h
          const newAf = add(af, afIncrement)
          af = gt(newAf, afMax) ? afMax : newAf
        }
        else if (!isUptrend && lt(l, ep)) {
          ep = l
          const newAf = add(af, afIncrement)
          af = gt(newAf, afMax) ? afMax : newAf
        }
      }

      // Step E: update prev tracking
      prevPrevHigh = prevHigh
      prevPrevLow = prevLow
      prevHigh = h
      prevLow = l

      return { psar: sar, isUptrend }
    }
  },
  defaultParabolicSarOptions,
)

export { psar as parabolicSar }
