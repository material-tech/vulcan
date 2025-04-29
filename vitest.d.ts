import 'vitest'

interface CustomMatchers<R = unknown> {
  toMatchNumberArray: (expected: number[]) => R
  toMatchNumber: (expected: number) => R
}

declare module 'vitest' {
  interface Assertion<T = any> extends CustomMatchers<T> {}
  interface AsymmetricMatchersContaining extends CustomMatchers {}
}
