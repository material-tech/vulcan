import type { Numberish } from 'dnum'
import { add, div, eq, from, gt, mul, sub } from 'dnum'
import { createSignal } from '~/base'
import { rma } from '~/trend/rollingMovingAverage'

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
  (closings: Numberish[], { period }) => {
    // Convert input data to Dnum type
    const prices = closings.map(item => from(item))

    // Initialize arrays for gains and losses
    const gains = Array.from({ length: prices.length }, () => from(0))
    const losses = Array.from({ length: prices.length }, () => from(0))

    // Calculate price changes and separate gains and losses
    for (let i = 1; i < prices.length; i++) {
      const change = sub(prices[i], prices[i - 1])

      if (gt(change, 0)) {
        // Gain
        gains[i] = change
      }
      else {
        // Loss, take absolute value
        losses[i] = mul(change, -1, 18)
      }
    }

    // Calculate average gains and losses using rma
    const avgGains = rma(gains, { period })
    const avgLosses = rma(losses, { period })

    // Calculate RSI
    const result = Array.from({ length: prices.length }, () => from(0))

    for (let i = 0; i < prices.length; i++) {
      // The first element is always 0 because there is no previous price point to calculate the change
      if (i === 0) {
        result[i] = from(0)
      }
      // Other elements are processed using the normal RSI calculation method
      else if (eq(avgLosses[i], 0)) {
        // If average loss is zero, RSI is 100
        result[i] = from(100)
      }
      else {
        // Calculate RS = average gain / average loss
        const rs = div(avgGains[i], avgLosses[i])
        // RSI = 100 - (100 / (1 + RS))
        result[i] = sub(
          100,
          div(
            100,
            add(1, rs),
            18,
          ),
        )
      }
    }

    return result
  },
  defaultRSIOptions,
)

export { rsi as relativeStrengthIndex }
