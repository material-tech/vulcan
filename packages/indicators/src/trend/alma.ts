import type { Numberish } from 'dnum'
import { assert, createSignal, fp18 } from '@vulcan-js/core'

export interface ALMAOptions {
  /**
   * The lookback period (window size)
   * @default 9
   */
  period: number
  /**
   * Controls the Gaussian distribution center position (0 to 1).
   * Higher values shift weight toward the most recent prices.
   * @default 0.85
   */
  offset: number
  /**
   * Controls the Gaussian distribution width.
   * Higher values produce a narrower (more concentrated) curve.
   * @default 6
   */
  sigma: number
}

export const defaultALMAOptions: ALMAOptions = {
  period: 9,
  offset: 0.85,
  sigma: 6,
}

/**
 * Arnaud Legoux Moving Average (ALMA)
 *
 * A Gaussian distribution-weighted moving average that reduces lag and noise.
 * The Gaussian curve center and width are controlled by `offset` and `sigma`,
 * allowing fine-tuned balance between responsiveness and smoothness.
 *
 * Formula:
 *   m = offset * (period - 1)
 *   s = period / sigma
 *   w[i] = exp(-((i - m)^2) / (2 * s^2))
 *   ALMA = SUM(w[i] * price[i]) / SUM(w[i])
 *
 * @param source - Iterable of price values
 * @param options - Configuration options
 * @param options.period - The lookback period (default: 9)
 * @param options.offset - Gaussian center offset, 0 to 1 (default: 0.85)
 * @param options.sigma - Gaussian width control (default: 6)
 * @returns Generator yielding ALMA values
 */
export const alma = createSignal(
  ({ period, offset, sigma }) => {
    assert(Number.isInteger(period) && period >= 1, new RangeError(`Expected period to be a positive integer, got ${period}`))
    assert(offset >= 0 && offset <= 1, new RangeError(`Expected offset to be between 0 and 1, got ${offset}`))
    assert(sigma > 0, new RangeError(`Expected sigma to be positive, got ${sigma}`))

    // Pre-compute Gaussian weights (only depends on fixed parameters)
    const m = offset * (period - 1)
    const s = period / sigma
    const weights: bigint[] = Array.from({ length: period })
    let norm = fp18.ZERO

    for (let i = 0; i < period; i++) {
      const wt = Math.exp(-(((i - m) * (i - m)) / (2 * s * s)))
      const wtFp18 = fp18.toFp18(wt)
      weights[i] = wtFp18
      norm += wtFp18
    }

    // Rolling buffer for price values
    const buffer: bigint[] = Array.from({ length: period })
    let head = 0
    let count = 0

    return (value: Numberish) => {
      const v = fp18.toFp18(value)

      buffer[head] = v
      head = (head + 1) % period
      if (count < period)
        count++

      // During warmup, compute weighted average over available data
      if (count < period) {
        let weightedSum = fp18.ZERO
        let partialNorm = fp18.ZERO
        for (let i = 0; i < count; i++) {
          // Map buffer position to weight index (align to end of weight array)
          const wi = period - count + i
          const bufIdx = (head - count + i + period) % period
          weightedSum += fp18.mul(weights[wi], buffer[bufIdx])
          partialNorm += weights[wi]
        }
        return fp18.toDnum(fp18.div(weightedSum, partialNorm))
      }

      // Full window: compute weighted sum
      let weightedSum = fp18.ZERO
      for (let i = 0; i < period; i++) {
        // head points to the oldest value in the circular buffer
        const bufIdx = (head + i) % period
        weightedSum += fp18.mul(weights[i], buffer[bufIdx])
      }

      return fp18.toDnum(fp18.div(weightedSum, norm))
    }
  },
  defaultALMAOptions,
)

export { alma as arnaudLegouxMovingAverage }
