import type { Dnum, toParts } from 'dnum'
import defu from 'defu'
import { isDnum, toNumber } from 'dnum'
import { expect } from 'vitest'

expect.extend({
  toMatchNumberArray(received: Dnum[], expected: number[], options?: Parameters<typeof toParts>[1]) {
    if (received.some(v => !isDnum(v))) {
      throw new Error('Received value is not a Dnum')
    }
    const { isNot, utils } = this
    const receivedNumbers = received.map(v => toNumber(v, defu(options, { digits: 2 })))
    const pass = this.equals(receivedNumbers, expected)
    return {
      pass,
      message: () => {
        return `expected ${JSON.stringify(receivedNumbers)} to ${isNot ? 'not' : ''} match ${JSON.stringify(expected)}\n${utils.printDiffOrStringify(receivedNumbers, expected)}`
      },
    }
  },
  toMatchNumber(received: Dnum, expected: number, options?: Parameters<typeof toParts>[1]) {
    if (!isDnum(received)) {
      throw new Error('Received value is not a Dnum')
    }
    const { isNot, utils } = this
    const receivedNumber = toNumber(received, defu(options, { digits: 2 }))
    return {
      pass: this.equals(receivedNumber, expected),
      message: () => `expected ${receivedNumber} is${isNot ? ' not' : ''} to match ${expected}\n${utils.printDiffOrStringify(receivedNumber, expected)}`,
    }
  },
})

interface CustomMatchers<R = unknown> {
  /**
   * Checks if the received `Dnum[]` matches the expected `number[]`
   *
   * @param expected - expected number array
   * @param options - Optional `toNumber` options include `digits`
   *
   * @example
   * ```ts
   * expect(result).toMatchNumberArray(expected)
   * expect(result).toMatchNumberArray(expected, { digits: 2 })
   * ```
   */
  toMatchNumberArray: (expected: number[], options?: Parameters<typeof toParts>[1]) => R
  /**
   * Checks if the received `Dnum` matches the expected `number`
   *
   * @param expected - expected number
   * @param options - Optional `toNumber` options include `digits`
   *
   * @example
   * ```ts
   * expect(result).toMatchNumber(expected)
   * expect(result).toMatchNumber(expected, { digits: 2 })
   * ```
   */
  toMatchNumber: (expected: number, options?: Parameters<typeof toParts>[1]) => R
}

declare module 'vitest' {
  interface Assertion<T = any> extends CustomMatchers<T> { }
  interface AsymmetricMatchersContaining extends CustomMatchers { }
}
