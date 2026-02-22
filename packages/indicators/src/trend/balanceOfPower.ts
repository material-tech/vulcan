import type { CandleData, RequiredProperties } from '@vulcan-js/core'
import { createSignal, fp18 } from '@vulcan-js/core'

export const bop = createSignal(
  () => {
    return (bar: RequiredProperties<CandleData, 'o' | 'h' | 'l' | 'c'>) => {
      const o = fp18.toFp18(bar.o)
      const h = fp18.toFp18(bar.h)
      const l = fp18.toFp18(bar.l)
      const c = fp18.toFp18(bar.c)
      const range = h - l
      if (range === fp18.ZERO) {
        return fp18.toDnum(fp18.ZERO)
      }
      return fp18.toDnum(fp18.div(c - o, range))
    }
  },
)

export { bop as balanceOfPower }
