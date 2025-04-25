import type { Numberish } from 'dnum'
import { from, isDnum } from 'dnum'

function assertItemLength(arr: Numberish[], arr2: Numberish[]) {
  if (arr.length !== arr2.length) {
    throw new Error('operateBy array length must be equal to data length')
  }
}

type PickThirdParameters<T extends any[]> = T extends [infer _, infer _, ...infer R] ? R : never

export function mapOperator<
  Operator extends (a: Numberish, b: Numberish, ...args: any[]) => Numberish,
>(operator: Operator) {
  return <Data extends Numberish>(arr1: Data[], arr2: Data[] | Numberish, ...args: PickThirdParameters<Parameters<typeof operator>>): Data[] => {
    if (Array.isArray(arr2)) {
      if (isDnum(arr2)) {
        return arr1.map(item => operator(from(item), from(arr2))) as Data[]
      }
      assertItemLength(arr1, arr2)
      return arr1.map((item, index) => operator(item, arr2[index], ...args)) as Data[]
    }
    return arr1.map(item => operator(from(item), from(arr2))) as Data[]
  }
}
