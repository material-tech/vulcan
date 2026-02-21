import type { CandleData, RequiredProperties } from '@vulcan-js/core'
import type { Dnum } from 'dnum'
import { assert, constants, createSignal, toDnum } from '@vulcan-js/core'
import { abs, add, divide, gt, subtract } from 'dnum'

export interface VortexOptions {
  period: number
}

export const defaultVortexOptions: VortexOptions = {
  period: 14,
}

export interface VortexPoint {
  plus: Dnum
  minus: Dnum
}

/**
 * Vortex Indicator (VI)
 *
 * Identifies trend direction and potential reversals using two oscillating lines (VI+ and VI-).
 *
 * VM+(i) = |High(i) - Low(i-1)|
 * VM-(i) = |Low(i) - High(i-1)|
 * TR(i) = max(High(i) - Low(i), |High(i) - Close(i-1)|, |Low(i) - Close(i-1)|)
 * VI+ = SUM(VM+, period) / SUM(TR, period)
 * VI- = SUM(VM-, period) / SUM(TR, period)
 */
export const vortex = createSignal(
  ({ period }) => {
    assert(Number.isInteger(period) && period >= 1, new RangeError(`Expected period to be a positive integer, got ${period}`))

    const vmPlusBuffer: Dnum[] = Array.from({ length: period })
    const vmMinusBuffer: Dnum[] = Array.from({ length: period })
    const trBuffer: Dnum[] = Array.from({ length: period })

    let head = 0
    let count = 0
    let sumVmPlus: Dnum = constants.ZERO
    let sumVmMinus: Dnum = constants.ZERO
    let sumTr: Dnum = constants.ZERO

    let prevHigh: Dnum | null = null
    let prevLow: Dnum | null = null
    let prevClose: Dnum | null = null

    return (bar: RequiredProperties<CandleData, 'h' | 'l' | 'c'>) => {
      const h = toDnum(bar.h)
      const l = toDnum(bar.l)
      const c = toDnum(bar.c)

      if (prevHigh === null || prevLow === null || prevClose === null) {
        prevHigh = h
        prevLow = l
        prevClose = c
        return { plus: constants.ZERO, minus: constants.ZERO }
      }

      const vmPlus = abs(subtract(h, prevLow))
      const vmMinus = abs(subtract(l, prevHigh))

      const hl = subtract(h, l)
      const hpc = abs(subtract(h, prevClose))
      const lpc = abs(subtract(l, prevClose))
      let tr = hl
      if (gt(hpc, tr))
        tr = hpc
      if (gt(lpc, tr))
        tr = lpc

      if (count < period) {
        vmPlusBuffer[count] = vmPlus
        vmMinusBuffer[count] = vmMinus
        trBuffer[count] = tr
        sumVmPlus = add(sumVmPlus, vmPlus)
        sumVmMinus = add(sumVmMinus, vmMinus)
        sumTr = add(sumTr, tr)
        count++
      }
      else {
        sumVmPlus = subtract(sumVmPlus, vmPlusBuffer[head])
        sumVmMinus = subtract(sumVmMinus, vmMinusBuffer[head])
        sumTr = subtract(sumTr, trBuffer[head])
        vmPlusBuffer[head] = vmPlus
        vmMinusBuffer[head] = vmMinus
        trBuffer[head] = tr
        sumVmPlus = add(sumVmPlus, vmPlus)
        sumVmMinus = add(sumVmMinus, vmMinus)
        sumTr = add(sumTr, tr)
        head = (head + 1) % period
      }

      prevHigh = h
      prevLow = l
      prevClose = c

      return {
        plus: divide(sumVmPlus, sumTr, constants.DECIMALS),
        minus: divide(sumVmMinus, sumTr, constants.DECIMALS),
      }
    }
  },
  defaultVortexOptions,
)

export { vortex as vortexIndicator }
