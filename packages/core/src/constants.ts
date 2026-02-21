/* eslint-disable ts/no-namespace */
import type { Dnum } from 'dnum'
import { from } from 'dnum'

export namespace constants {
  export const DECIMALS = 18

  export const ZERO: Dnum = from(0, DECIMALS)
  export const ONE: Dnum = from(1, DECIMALS)
  export const TWO: Dnum = from(2, DECIMALS)
  export const HUNDRED: Dnum = from(100, DECIMALS)
}
