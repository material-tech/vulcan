import type { KlineData, RequiredProperties } from '~/types'
import { divide, equal, from, subtract } from 'dnum'
import { createSignal } from '~/base'

export const bop = createSignal(() => {
  return (data: RequiredProperties<KlineData, 'o' | 'h' | 'l' | 'c'>) => {
    const high = from(data.h, 18)
    const low = from(data.l, 18)
    const open = from(data.o, 18)
    const close = from(data.c, 18)
    const range = subtract(high, low)
    if (equal(range, 0)) {
      return from(0, 18)
    }
    return divide(subtract(close, open), range, 18)
  }
})

export { bop as balanceOfPower }
