import type { KlineData, RequiredProperties } from '~/types'
import { divide, equal, from, subtract } from 'dnum'
import { createSignal } from '~/base'

export const bop = createSignal(
  () => {
    return (bar: RequiredProperties<KlineData, 'o' | 'h' | 'l' | 'c'>) => {
      const o = from(bar.o, 18)
      const h = from(bar.h, 18)
      const l = from(bar.l, 18)
      const c = from(bar.c, 18)
      const range = subtract(h, l)
      if (equal(range, 0)) {
        return from(0, 18)
      }
      return divide(subtract(c, o), range, 18)
    }
  },
)

export { bop as balanceOfPower }
