import type { Numberish } from 'dnum'
import { isDnum } from 'dnum'

function assertItemLength(arr: Numberish[], arr2: Numberish[]) {
  if (arr.length !== arr2.length) {
    throw new Error('operateBy array length must be equal to data length')
  }
}

type ArraifyNumberish<T extends any[]> = {
  [K in keyof T]: T[K] extends Numberish ? Numberish[] : T[K]
}

export function mapOperator<
  Action extends (args0: Numberish, ...args: any[]) => any,
>(action: Action): (...args: ArraifyNumberish<Parameters<Action>>) => ReturnType<Action>[]
export function mapOperator<
  Action extends (args0: Numberish, args1: Numberish, ...args: any[]) => any,
>(action: Action): (...args: ArraifyNumberish<Parameters<Action>>) => ReturnType<Action>[]
export function mapOperator(action: any) {
  function impl(args0: Numberish[], ...args: any[]) {
    const [args1, ...rest] = args
    // (number|string|bigint)[]
    if (Array.isArray(args1) && !isDnum(args1)) {
      assertItemLength(args0, args1)
      return args0.map((num, index) => action(num, args1[index], ...rest))
    }
    return args0.map(num => action(num, args1, ...rest))
  }
  return impl
}
