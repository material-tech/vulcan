import type { CandleData, RequiredProperties } from '@vulcan-js/core'
import type { Dnum } from 'dnum'
import { assert, createSignal, fp18 } from '@vulcan-js/core'

export interface ZigZagOptions {
  /**
   * Minimum percentage deviation required to confirm a reversal.
   * For example, `5` means a 5% retracement from the current extreme
   * within the tracked range triggers a pivot.
   * @default 5
   */
  deviation: number
}

export const defaultZigZagOptions: ZigZagOptions = {
  deviation: 5,
}

export interface ZigZagPivot {
  /** Pivot price */
  price: Dnum
  /** Pivot type: 'high' = swing high (local maximum), 'low' = swing low (local minimum) */
  type: 'high' | 'low'
}

export interface ZigZagPoint {
  /** Current trend direction: 'up' = tracking higher highs, 'down' = tracking lower lows */
  trend: 'up' | 'down'
  /** The last confirmed pivot point, or null if no reversal has occurred yet */
  pivot: ZigZagPivot | null
  /** Current tentative extreme being tracked (not yet confirmed as pivot) */
  extreme: Dnum
}

/**
 * ZigZag Indicator
 *
 * A trend-filtering overlay that connects significant swing highs and
 * swing lows, ignoring price movements smaller than a given percentage
 * deviation. Useful for identifying major price swings, support/resistance
 * levels, and Elliott Wave analysis.
 *
 * Algorithm:
 *   Track the current range [lowestLow, highestHigh] as price evolves.
 *   In an uptrend, update highestHigh when a new high exceeds it.
 *   A reversal to downtrend is confirmed when:
 *     low < lowestLow + (highestHigh − lowestLow) × (100 − deviation) / 100
 *   In a downtrend, update lowestLow when a new low undercuts it.
 *   A reversal to uptrend is confirmed when:
 *     high > lowestLow + (highestHigh − lowestLow) × deviation / 100
 *
 * Note: ZigZag is inherently lagging — a pivot is confirmed only when
 * the reversal threshold is met, not at the actual extreme bar. The
 * `extreme` field shows the current tentative extreme being tracked.
 *
 * @param source - Iterable of OHLC candle data (requires high, low)
 * @param options - Configuration options
 * @param options.deviation - Minimum reversal deviation in percent (default: 5)
 * @returns Generator yielding ZigZagPoint values with trend, pivot, and extreme
 */
export const zigZag = createSignal(
  ({ deviation }) => {
    assert(deviation > 0 && deviation < 100, new RangeError(`Expected deviation to be between 0 and 100 (exclusive), got ${deviation}`))

    const dev = fp18.toFp18(deviation)

    let highestHigh = fp18.ZERO
    let lowestLow = fp18.ZERO
    let trend: 'up' | 'down' = 'up'
    let lastPivot: { price: bigint, type: 'high' | 'low' } | null = null
    let count = 0

    return (bar: RequiredProperties<CandleData, 'h' | 'l'>): ZigZagPoint => {
      const h = fp18.toFp18(bar.h)
      const l = fp18.toFp18(bar.l)

      if (count === 0) {
        highestHigh = h
        lowestLow = l
        count++
        return { trend, pivot: null, extreme: fp18.toDnum(h) }
      }

      // Update extremes and determine initial direction on second bar
      if (count === 1) {
        if (h > highestHigh)
          highestHigh = h
        if (l < lowestLow)
          lowestLow = l

        // Set initial trend based on which extreme moved more
        trend = (h - highestHigh === fp18.ZERO && h > lowestLow) ? 'up' : (l < lowestLow ? 'down' : 'up')
        if (h >= highestHigh)
          trend = 'up'
        if (l <= lowestLow)
          trend = 'down'

        count++
        const extreme = trend === 'up' ? highestHigh : lowestLow
        return { trend, pivot: null, extreme: fp18.toDnum(extreme) }
      }

      const pivotBefore = lastPivot

      if (trend === 'up') {
        if (h > highestHigh) {
          highestHigh = h
        }
        else {
          // Check reversal: low drops below the (100 - deviation)% level of range
          const range = highestHigh - lowestLow
          const threshold = lowestLow + fp18.div(fp18.mul(range, fp18.HUNDRED - dev), fp18.HUNDRED)
          if (l < threshold) {
            lastPivot = { price: highestHigh, type: 'high' }
            trend = 'down'
            lowestLow = l
          }
        }
      }
      else {
        if (l < lowestLow) {
          lowestLow = l
        }
        else {
          // Check reversal: high rises above the deviation% level of range
          const range = highestHigh - lowestLow
          const threshold = lowestLow + fp18.div(fp18.mul(range, dev), fp18.HUNDRED)
          if (h > threshold) {
            lastPivot = { price: lowestLow, type: 'low' }
            trend = 'up'
            highestHigh = h
          }
        }
      }

      // After a reversal, reset the range tracking for the new trend
      if (lastPivot !== pivotBefore) {
        // Range resets: the new extreme starts from this bar
        if (trend === 'up') {
          lowestLow = l
        }
        else {
          highestHigh = h
        }
      }

      const extreme = trend === 'up' ? highestHigh : lowestLow
      const pivot: ZigZagPivot | null = lastPivot
        ? { price: fp18.toDnum(lastPivot.price), type: lastPivot.type }
        : null

      count++
      return { trend, pivot, extreme: fp18.toDnum(extreme) }
    }
  },
  defaultZigZagOptions,
)

export { zigZag as zigZagIndicator }
