import type { Dnum, Numberish } from 'dnum'
import { gt, isDnum, lt } from 'dnum'
import { assert } from 'vitest'

type ArraifyNumberish<T extends any[]> = {
  [K in keyof T]: T[K] extends Numberish ? Numberish[] : T[K]
}

type ArraifyDnum<T extends any[]> = {
  [K in keyof T]: T[K] extends Dnum ? Dnum[] : T[K]
}

export function mapOperator<
  Action extends (args0: Numberish, ...args: any[]) => any,
>(action: Action): (...args: ArraifyNumberish<Parameters<Action>>) => ReturnType<Action>[]
export function mapOperator<
  Action extends (args0: Numberish, args1: Numberish, ...args: any[]) => any,
>(action: Action): (...args: ArraifyNumberish<Parameters<Action>>) => ReturnType<Action>[]
export function mapOperator<
  Action extends (args0: Dnum, ...args: any[]) => any,
>(action: Action): (...args: ArraifyDnum<Parameters<Action>>) => ReturnType<Action>[]
export function mapOperator(action: any) {
  function impl(args0: Numberish[], ...args: any[]) {
    assert(typeof args0 !== 'undefined', 'First argument is required')
    // if the action has more than 2 arguments, the second argument will be required
    if (action.length > 2) {
      assert(args.length > 0, 'Should have at least one more argument')
    }
    const [args1, ...rest] = args
    // (number|string|bigint)[]
    if (Array.isArray(args1) && !isDnum(args1)) {
      assert(args0.length === args1.length, 'Should have two array length must be equal')
      return args0.map((num, index) => action(num, args1[index], ...rest))
    }
    return args0.map(num => action(num, args1, ...rest))
  }
  return impl
}

export interface PeriodCompareOptions {
  period?: number
  start?: number
}

export function max(
  numbers: Numberish[],
  { period = numbers.length, start = 0 }: PeriodCompareOptions = {},
) {
  const filtered = numbers.filter((_, index) => index >= start && index < start + period)
  return filtered.reduce(
    (max, current) => {
      return gt(max, current) ? max : current
    },
    numbers.at(0) as Numberish,
  )
}

export function min(
  numbers: Numberish[],
  { period = numbers.length, start = 0 }: PeriodCompareOptions = {},
) {
  const filtered = numbers.filter((_, index) => index >= start && index < start + period)
  return filtered.reduce(
    (min, current) => {
      return lt(min, current) ? min : current
    },
    numbers.at(0) as Numberish,
  )
}
