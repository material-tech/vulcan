import type { CandleData, RequiredProperties } from '@vulcan-js/core'
import type { Dnum } from 'dnum'
import { assert, createSignal, fp18 } from '@vulcan-js/core'
import { rma } from '../primitives/rma'

export interface ADXOptions {
  /**
   * The smoothing period for DI and ADX calculation
   * @default 14
   */
  period: number
}

export const defaultADXOptions: ADXOptions = {
  period: 14,
}

export interface ADXPoint {
  /** Average Directional Index — overall trend strength (0–100) */
  adx: Dnum
  /** Plus Directional Indicator (+DI) — upward trend strength (0–100) */
  pdi: Dnum
  /** Minus Directional Indicator (-DI) — downward trend strength (0–100) */
  mdi: Dnum
}

/**
 * Average Directional Index / Directional Movement Index (ADX/DMI)
 *
 * Developed by J. Welles Wilder, ADX measures trend strength while +DI and -DI
 * indicate trend direction. ADX ranges from 0 to 100, where values above 25
 * suggest a strong trend.
 *
 * Formula:
 *   TR = max(H-L, |H-prevC|, |L-prevC|)
 *   +DM = (H-prevH > prevL-L && H-prevH > 0) ? H-prevH : 0
 *   -DM = (prevL-L > H-prevH && prevL-L > 0) ? prevL-L : 0
 *   +DI = RMA(+DM, period) / RMA(TR, period) × 100
 *   -DI = RMA(-DM, period) / RMA(TR, period) × 100
 *   DX = |+DI - -DI| / (+DI + -DI) × 100
 *   ADX = RMA(DX, period)
 *
 * @param source - Iterable of OHLC candle data (requires high, low, close)
 * @param options - Configuration options
 * @param options.period - The smoothing period (default: 14)
 * @returns Generator yielding ADXPoint values with adx, pdi, and mdi
 */
export const adx = createSignal(
  ({ period }) => {
    assert(Number.isInteger(period) && period >= 1, new RangeError(`Expected period to be a positive integer, got ${period}`))

    const trSmooth = rma(period)
    const pdmSmooth = rma(period)
    const mdmSmooth = rma(period)
    const dxSmooth = rma(period)

    let prevH: bigint | null = null
    let prevL: bigint | null = null
    let prevC: bigint | null = null

    return (bar: RequiredProperties<CandleData, 'h' | 'l' | 'c'>): ADXPoint => {
      const h = fp18.toFp18(bar.h)
      const l = fp18.toFp18(bar.l)
      const c = fp18.toFp18(bar.c)

      if (prevH === null || prevL === null || prevC === null) {
        prevH = h
        prevL = l
        prevC = c
        return { adx: fp18.toDnum(fp18.ZERO), pdi: fp18.toDnum(fp18.ZERO), mdi: fp18.toDnum(fp18.ZERO) }
      }

      // True Range
      const hl = h - l
      const hpc = fp18.abs(h - prevC)
      const lpc = fp18.abs(l - prevC)
      let tr = hl
      if (hpc > tr)
        tr = hpc
      if (lpc > tr)
        tr = lpc

      // Directional Movement
      const upMove = h - prevH
      const downMove = prevL - l
      const pdm = (upMove > downMove && upMove > fp18.ZERO) ? upMove : fp18.ZERO
      const mdm = (downMove > upMove && downMove > fp18.ZERO) ? downMove : fp18.ZERO

      // Wilder smoothing via RMA
      const smoothTr = trSmooth(tr)
      const smoothPdm = pdmSmooth(pdm)
      const smoothMdm = mdmSmooth(mdm)

      // Directional Indicators
      let pdi: bigint
      let mdi: bigint
      if (smoothTr === fp18.ZERO) {
        pdi = fp18.ZERO
        mdi = fp18.ZERO
      }
      else {
        pdi = fp18.mul(fp18.div(smoothPdm, smoothTr), fp18.HUNDRED)
        mdi = fp18.mul(fp18.div(smoothMdm, smoothTr), fp18.HUNDRED)
      }

      // DX and ADX
      const diSum = pdi + mdi
      const dx = diSum === fp18.ZERO ? fp18.ZERO : fp18.mul(fp18.div(fp18.abs(pdi - mdi), diSum), fp18.HUNDRED)
      const adxVal = dxSmooth(dx)

      prevH = h
      prevL = l
      prevC = c

      return {
        adx: fp18.toDnum(adxVal),
        pdi: fp18.toDnum(pdi),
        mdi: fp18.toDnum(mdi),
      }
    }
  },
  defaultADXOptions,
)

export { adx as averageDirectionalIndex }
