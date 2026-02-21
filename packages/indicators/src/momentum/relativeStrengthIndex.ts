import type { Dnum, Numberish } from 'dnum'
import { assert, constants, createSignal, toDnum } from '@vulcan-js/core'
import { add, div, eq, gt, mul, sub } from 'dnum'
import { rma } from '../trend/rollingMovingAverage'

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
    const gainProc = rma.create({ period })
    const lossProc = rma.create({ period })
    let prev: Dnum | undefined

    return (value: Numberish) => {
      const price = toDnum(value)

      if (prev === undefined) {
        prev = price
        gainProc(constants.ZERO)
        lossProc(constants.ZERO)
        return constants.ZERO
      }

      const change = sub(price, prev)
      prev = price

      const gain = gt(change, 0) ? change : constants.ZERO
      const loss = gt(change, 0) ? constants.ZERO : mul(change, -1, constants.DECIMALS)

      const avgGain = gainProc(gain)
      const avgLoss = lossProc(loss)

      if (eq(avgLoss, 0)) {
        return constants.HUNDRED
      }

      const rs = div(avgGain, avgLoss, constants.DECIMALS)
      return sub(100, div(100, add(1, rs), constants.DECIMALS))
    }
  },
  defaultRSIOptions,
)

export { rsi as relativeStrengthIndex }
