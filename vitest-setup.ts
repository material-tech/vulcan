import type { Dnum } from 'dnum'
import { toNumber } from 'dnum'
import { expect } from 'vitest'

expect.extend({
  toMatchNumberArray(received: Dnum[], expected: number[], options?: { digits?: number }) {
    const { isNot, utils } = this
    const receivedNumbers = received.map(v => toNumber(v, { digits: options?.digits }))
    const pass = this.equals(receivedNumbers, expected)
    return {
      pass,
      message: () => {
        return `expected ${JSON.stringify(receivedNumbers)} to ${isNot ? 'not' : ''} match ${JSON.stringify(expected)}\n${utils.printDiffOrStringify(receivedNumbers, expected)}`
      },
    }
  },
  toMatchNumber(received: Dnum, expected: number, options?: { digits?: number }) {
    const { isNot, utils } = this
    const receivedNumber = toNumber(received, { digits: options?.digits })
    return {
      pass: this.equals(receivedNumber, expected),
      message: () => `expected ${receivedNumber} is${isNot ? ' not' : ''} to match ${expected}\n${utils.printDiffOrStringify(receivedNumber, expected)}`,
    }
  },
})

interface CustomMatchers<R = unknown> {
  /** match Dnum[] with number[] */
  toMatchNumberArray: (expected: number[], options?: { digits?: number }) => R
  /** match Dnum with number */
  toMatchNumber: (expected: number, options?: { digits?: number }) => R
}

declare module 'vitest' {
  interface Assertion<T = any> extends CustomMatchers<T> {}
  interface AsymmetricMatchersContaining extends CustomMatchers {}
}
