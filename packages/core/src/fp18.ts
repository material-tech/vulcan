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
}
