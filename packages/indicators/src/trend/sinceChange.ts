import type { Dnum, Numberish } from 'dnum'
import { createSignal } from '@vulcan-js/core'
import { add, equal, from } from 'dnum'

const ONE: Dnum = from(1, 18)

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
    let last: Dnum | undefined
    let count: Dnum = from(0, 18)

    return (value: Numberish) => {
      const v = from(value, 18)

      if (last === undefined || !equal(last, v)) {
        last = v
        count = from(0, 18)
      }
      else {
        count = add(count, ONE)
      }

      return count
    }
  },
)

export { since as sinceChange }
