import type { Dnum, Numberish } from 'dnum'
import { from } from 'dnum'

import { DECIMALS } from './constants'

export function toDnum(value: Numberish): Dnum {
  return from(value, DECIMALS)
}
