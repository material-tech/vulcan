import type { Dnum } from 'dnum'
import type { KlineData, RequiredProperties } from '~/types'
import { divide, equal, from, subtract } from 'dnum'
import { createSignal } from '~/base'
import { mapPick } from '~/helpers/array'

export const bop = createSignal({
  compute: (data: RequiredProperties<KlineData, 'o' | 'h' | 'l' | 'c'>[]) => {
    const opens = mapPick(data, 'o', v => from(v))
    const highs = mapPick(data, 'h', v => from(v))
    const lows = mapPick(data, 'l', v => from(v))
    const closings = mapPick(data, 'c', v => from(v))

    return data.map((_, i): Dnum => {
      const range = subtract(highs[i], lows[i])
      if (equal(range, 0)) {
        return from(0, 18)
      }
      return divide(subtract(closings[i], opens[i]), range, 18)
    })
  },
  stream: () => {
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
  },
})

export { bop as balanceOfPower }
