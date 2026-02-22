import { fp18 } from '@vulcan-js/core'

/**
 * Create an exponentially weighted moving average (EWMA) processor.
 *
 * new = value * k + prev * (1 - k)
 *
 * @param k - Smoothing factor as fp18 bigint
 */
export function ewma(k: bigint): (value: bigint) => bigint {
  const m = fp18.ONE - k
  let prev: bigint | undefined
  return (value: bigint): bigint => {
    if (prev === undefined) {
      prev = value
      return prev
    }
    prev = (value * k + prev * m) / fp18.SCALE
    return prev
  }
}

/** Compute EMA smoothing factor: k = 2 / (period + 1) */
ewma.k = (period: number): bigint => fp18.div(fp18.TWO, BigInt(1 + period) * fp18.SCALE)
