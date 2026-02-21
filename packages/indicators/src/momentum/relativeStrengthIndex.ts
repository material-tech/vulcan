import type { Dnum, Numberish } from 'dnum'
import { assertPositiveInteger, createSignal } from '@material-tech/vulcan-core'
import { add, div, eq, from, gt, mul, sub } from 'dnum'
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
    assertPositiveInteger(period)
    const gainProc = rma.create({ period })
    const lossProc = rma.create({ period })
    let prev: Dnum | undefined

    return (value: Numberish) => {
      const price = from(value, 18)

      if (prev === undefined) {
        prev = price
        gainProc(from(0, 18))
        lossProc(from(0, 18))
        return from(0, 18)
      }

      const change = sub(price, prev)
      prev = price

      const gain = gt(change, 0) ? change : from(0, 18)
      const loss = gt(change, 0) ? from(0, 18) : mul(change, -1, 18)

      const avgGain = gainProc(gain)
      const avgLoss = lossProc(loss)

      if (eq(avgLoss, 0)) {
        return from(100, 18)
      }

      const rs = div(avgGain, avgLoss, 18)
      return sub(100, div(100, add(1, rs), 18))
    }
  },
  defaultRSIOptions,
)

export { rsi as relativeStrengthIndex }
