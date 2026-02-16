import type { KlineData, RequiredProperties } from '~/types'
import { divide, equal, from, subtract } from 'dnum'
import { createSignal } from '~/base'

export const bop = createSignal(
  () => {
    return (bar: RequiredProperties<KlineData, 'o' | 'h' | 'l' | 'c'>) => {
      const o = from(bar.o)
      const h = from(bar.h)
      const l = from(bar.l)
      const c = from(bar.c)
      const range = subtract(h, l)
      if (equal(range, 0)) {
        return from(0, 18)
      }
      return divide(subtract(c, o), range, 18)
    }
  },
)

export { bop as balanceOfPower }
