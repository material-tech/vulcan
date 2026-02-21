import type { Dnum, Numberish } from 'dnum'
import { from } from 'dnum'

const DECIMALS = 18
const SCALE = 10n ** 18n

export { SCALE }
export const ZERO = 0n
export const ONE = SCALE
export const TWO = 2n * SCALE
export const HUNDRED = 100n * SCALE

export const mul = (a: bigint, b: bigint): bigint => (a * b) / SCALE
export const div = (a: bigint, b: bigint): bigint => (a * SCALE) / b
export const abs = (a: bigint): bigint => (a < 0n ? -a : a)

export function toFp18(value: Numberish): bigint {
  return from(value, DECIMALS)[0]
}

export function toDnum(value: bigint): Dnum {
  return [value, DECIMALS]
}
