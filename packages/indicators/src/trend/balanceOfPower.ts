import type { CandleData, RequiredProperties } from '@vulcan-js/core'
import { constants, createSignal, toDnum } from '@vulcan-js/core'
import { divide, equal, subtract } from 'dnum'

export const bop = createSignal(
  () => {
    return (bar: RequiredProperties<CandleData, 'o' | 'h' | 'l' | 'c'>) => {
      const o = toDnum(bar.o)
      const h = toDnum(bar.h)
      const l = toDnum(bar.l)
      const c = toDnum(bar.c)
      const range = subtract(h, l)
      if (equal(range, 0)) {
        return constants.ZERO
      }
      return divide(subtract(c, o), range, constants.DECIMALS)
    }
  },
)

export { bop as balanceOfPower }
