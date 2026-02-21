import type { Dnum, Numberish } from 'dnum'
import { from } from 'dnum'

import { constants } from './constants'

export function toDnum(value: Numberish): Dnum {
  return from(value, constants.DECIMALS)
}
