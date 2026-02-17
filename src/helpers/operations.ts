import type { Dnum, Numberish } from 'dnum'
import {
  add as dnumAdd,
  divide as dnumDivide,
  multiply as dnumMultiply,
  subtract as dnumSubtract,
  isDnum,
} from 'dnum'
import { assert } from './assert'

type TransformOperatorParameters<T extends any[]> = {
  [K in keyof T]: K extends '1'
    ? T[K] extends Numberish
      ? Numberish[] | Numberish
      : T[K]
    : T[K] extends Numberish
      ? Numberish[]
      : T[K]
}

type TransformOperatorParametersDnum<T extends any[]> = {
  [K in keyof T]: T[K] extends Dnum ? Dnum[] : T[K]
}

export function mapOperator<
  Action extends (args0: Numberish, ...args: any[]) => any,
>(action: Action): (...args: TransformOperatorParameters<Parameters<Action>>) => ReturnType<Action>[]
export function mapOperator<
  Action extends (args0: Numberish, args1: Numberish, ...args: any[]) => any,
>(action: Action): (...args: TransformOperatorParameters<Parameters<Action>>) => ReturnType<Action>[]
export function mapOperator<
  Action extends (args0: Dnum, ...args: any[]) => any,
>(action: Action): (...args: TransformOperatorParametersDnum<Parameters<Action>>) => ReturnType<Action>[]
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

export const add = mapOperator(dnumAdd)
export const subtract = mapOperator(dnumSubtract)
export const multiply = mapOperator(dnumMultiply)
export const divide = mapOperator(dnumDivide)
export { divide as div, multiply as mul, subtract as sub }
