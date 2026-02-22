import type { Numberish } from 'dnum'
import { assert, createSignal, fp18 } from '@vulcan-js/core'
import * as prim from '../primitives'

export interface RSIOptions {
  period: number
}

export const defaultRSIOptions: RSIOptions = {
  period: 14,
}

/**
 * Relative Strength Index (RSI). It is a momentum indicator that measures the magnitude of
 * recent price changes to evaluate overbought and oversold conditions
 * using the given window period.
 *
 * RS = Average Gain / Average Loss
 *
 * RSI = 100 - (100 / (1 + RS))
 */
export const rsi = createSignal(
  ({ period }) => {
    assert(Number.isInteger(period) && period >= 1, new RangeError(`Expected period to be a positive integer, got ${period}`))
    const gainProc = prim.rma(period)
    const lossProc = prim.rma(period)
    let prev: bigint | undefined

    return (value: Numberish) => {
      const price = fp18.toFp18(value)

      if (prev === undefined) {
        prev = price
        gainProc(fp18.ZERO)
        lossProc(fp18.ZERO)
        return fp18.toDnum(fp18.ZERO)
      }

      const change = price - prev
      prev = price

      const gain = change > fp18.ZERO ? change : fp18.ZERO
      const loss = change > fp18.ZERO ? fp18.ZERO : -change

      const avgGain = gainProc(gain)
      const avgLoss = lossProc(loss)

      if (avgLoss === fp18.ZERO) {
        return fp18.toDnum(fp18.HUNDRED)
      }

      const rs = fp18.div(avgGain, avgLoss)
      return fp18.toDnum(fp18.HUNDRED - fp18.div(fp18.HUNDRED, fp18.ONE + rs))
    }
  },
  defaultRSIOptions,
)

export { rsi as relativeStrengthIndex }
