/**
 * Assert that a value is a positive integer (>= 1).
 *
 * @throws {RangeError} if value is not a positive integer
 */
export function assertPositiveInteger(value: number, name = 'period'): void {
  if (!Number.isInteger(value) || value < 1) {
    throw new RangeError(`Expected ${name} to be a positive integer, got ${value}`)
  }
}
