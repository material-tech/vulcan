import type { Numberish } from 'dnum'
import { createSignal, fp18 } from '@vulcan-js/core'

/**
 * Since Change
 *
 * Counts the number of periods since the input value last changed.
 * When the value changes, the counter resets to 0. When the value
 * remains the same, the counter increments by 1 each period.
 *
 * Example:
 *   Input:  [1, 1, 1, 2, 2, 3, 3, 3, 3]
 *   Output: [0, 1, 2, 0, 1, 0, 1, 2, 3]
 *
 * @param source - Iterable of values
 * @returns Generator yielding the number of periods since the last change
 */
export const since = createSignal(
  () => {
    let last: bigint | undefined
    let count = fp18.ZERO

    return (value: Numberish) => {
      const v = fp18.toFp18(value)

      if (last === undefined || last !== v) {
        last = v
        count = fp18.ZERO
      }
      else {
        count += fp18.ONE
      }

      return fp18.toDnum(count)
    }
  },
)

export { since as sinceChange }
