import type { CandleData, RequiredProperties } from '@vulcan-js/core'
import type { Dnum } from 'dnum'
import { assert, createSignal, fp18 } from '@vulcan-js/core'

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

    const vmPlusBuffer: bigint[] = Array.from({ length: period })
    const vmMinusBuffer: bigint[] = Array.from({ length: period })
    const trBuffer: bigint[] = Array.from({ length: period })

    let head = 0
    let count = 0
    let sumVmPlus = fp18.ZERO
    let sumVmMinus = fp18.ZERO
    let sumTr = fp18.ZERO

    let prevHigh: bigint | null = null
    let prevLow: bigint | null = null
    let prevClose: bigint | null = null

    return (bar: RequiredProperties<CandleData, 'h' | 'l' | 'c'>) => {
      const h = fp18.toFp18(bar.h)
      const l = fp18.toFp18(bar.l)
      const c = fp18.toFp18(bar.c)

      if (prevHigh === null || prevLow === null || prevClose === null) {
        prevHigh = h
        prevLow = l
        prevClose = c
        return { plus: fp18.toDnum(fp18.ZERO), minus: fp18.toDnum(fp18.ZERO) }
      }

      const vmPlus = fp18.abs(h - prevLow)
      const vmMinus = fp18.abs(l - prevHigh)

      const hl = h - l
      const hpc = fp18.abs(h - prevClose)
      const lpc = fp18.abs(l - prevClose)
      let tr = hl
      if (hpc > tr)
        tr = hpc
      if (lpc > tr)
        tr = lpc

      if (count < period) {
        vmPlusBuffer[count] = vmPlus
        vmMinusBuffer[count] = vmMinus
        trBuffer[count] = tr
        sumVmPlus += vmPlus
        sumVmMinus += vmMinus
        sumTr += tr
        count++
      }
      else {
        sumVmPlus = sumVmPlus - vmPlusBuffer[head] + vmPlus
        sumVmMinus = sumVmMinus - vmMinusBuffer[head] + vmMinus
        sumTr = sumTr - trBuffer[head] + tr
        vmPlusBuffer[head] = vmPlus
        vmMinusBuffer[head] = vmMinus
        trBuffer[head] = tr
        head = (head + 1) % period
      }

      prevHigh = h
      prevLow = l
      prevClose = c

      return {
        plus: fp18.toDnum(fp18.div(sumVmPlus, sumTr)),
        minus: fp18.toDnum(fp18.div(sumVmMinus, sumTr)),
      }
    }
  },
  defaultVortexOptions,
)

export { vortex as vortexIndicator }
