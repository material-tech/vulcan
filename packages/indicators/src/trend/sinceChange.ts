import type { Dnum, Numberish } from 'dnum'
import { constants, createSignal, toDnum } from '@vulcan-js/core'
import { add, equal } from 'dnum'

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
    let count: Dnum = constants.ZERO

    return (value: Numberish) => {
      const v = toDnum(value)

      if (last === undefined || !equal(last, v)) {
        last = v
        count = constants.ZERO
      }
      else {
        count = add(count, constants.ONE)
      }

      return count
    }
  },
)

export { since as sinceChange }
