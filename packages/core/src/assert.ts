/**
 * Assert that a condition is truthy, throwing an error if it is not.
 *
 * @throws {Error} if condition is falsy
 */
export function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message)
  }
}

/**
 * Assert that a value is a positive integer (>= 1).
 *
 * @throws {RangeError} if value is not a positive integer
 */
export function assertPositiveInteger(value: number, name = 'value'): void {
  if (!Number.isInteger(value) || value < 1) {
    throw new RangeError(`Expected ${name} to be a positive integer, got ${value}`)
  }
}
