export function assert(condition: boolean, message: string | Error): asserts condition {
  if (!condition) {
    throw message instanceof Error ? message : new Error(message)
  }
}
