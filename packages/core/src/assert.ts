/**
 * Assert that a condition is truthy, throwing an error if it is not.
 *
 * @param condition - The condition to assert
 * @param messageOrError - A string message (throws generic Error) or a custom Error instance
 * @throws {Error} if condition is falsy
 */
export function assert(condition: unknown, messageOrError: string | Error): asserts condition {
  if (!condition) {
    throw typeof messageOrError === 'string' ? new Error(messageOrError) : messageOrError
  }
}
