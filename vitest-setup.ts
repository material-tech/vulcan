import type { Dnum } from 'dnum'
import { eq, format } from 'dnum'
import { expect } from 'vitest'

expect.extend({
  toMatchNumberArray(received: Dnum[], expected: number[]) {
    const { isNot } = this
    return {
      pass: received.length === expected.length && received.every((value, index) => eq(value, expected[index])),
      message: () => `${received.map(format)} is${isNot ? ' not' : ''} match ${expected}`,
    }
  },
  toMatchNumber(received: Dnum, expected: number) {
    const { isNot } = this
    return {
      pass: eq(received, expected),
      message: () => `${received} is${isNot ? ' not' : ''} match ${expected}`,
    }
  },
})
