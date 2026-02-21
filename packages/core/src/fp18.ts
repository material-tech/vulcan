/* eslint-disable ts/no-namespace */
import type { Dnum, Numberish } from 'dnum'
import { from } from 'dnum'

export namespace fp18 {
  const DECIMALS = 18

  export const SCALE = 10n ** 18n
  export const ZERO = 0n
  export const ONE = SCALE
  export const TWO = 2n * SCALE
  export const HUNDRED = 100n * SCALE

  export const mul = (a: bigint, b: bigint): bigint => (a * b) / SCALE
  export const div = (a: bigint, b: bigint): bigint => (a * SCALE) / b
  export const abs = (a: bigint): bigint => (a < 0n ? -a : a)

  export function toFp18(value: Numberish): bigint {
    if (typeof value === 'number') {
      // Fast path: direct numeric conversion avoids dnum.from() string parsing
      return BigInt(Math.round(value * 1e9)) * 1000000000n
    }
    if (typeof value === 'bigint') {
      return value * SCALE
    }
    return from(value, DECIMALS)[0]
  }

  export function toDnum(value: bigint): Dnum {
    return [value, DECIMALS]
  }

  /**
   * Create an exponentially weighted moving average (EWMA) processor.
   *
   * new = value * k + prev * (1 - k)
   *
   * @param k - Smoothing factor as fp18 bigint
   */
  export function ewma(k: bigint): (value: bigint) => bigint {
    const m = ONE - k
    let prev: bigint | undefined
    return (value: bigint): bigint => {
      if (prev === undefined) {
        prev = value
        return prev
      }
      prev = (value * k + prev * m) / SCALE
      return prev
    }
  }

  /** Compute EMA smoothing factor: k = 2 / (period + 1) */
  ewma.k = (period: number): bigint => div(TWO, BigInt(1 + period) * SCALE)
}
