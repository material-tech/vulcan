import type { Numberish } from 'dnum'
import { abs, add, ceil, compare, floor, gt, gte, lt, lte, mul, sub } from 'dnum'
import { describe, expect, it } from 'vitest'
import { mapOperator } from './operator'

interface Case<Operator extends (args0: Numberish, ...args: any[]) => any = (args0: Numberish, ...args: any[]) => any> {
  name: string
  operator: Operator
  args: [Numberish[], ...any[]]
  expected: ReturnType<Operator>[]
  matcher?: 'toEqual' | 'toMatchNumberArray'
}

describe('operator', () => {
  const cases: Case[] = [
    {
      name: 'should to add two arrays',
      operator: add,
      args: [
        [1, 2, 3],
        [1, 2, 3],
      ],
      expected: [2, 4, 6],
    },
    {
      name: 'should to add one array and one number',
      operator: add,
      args: [
        [1, 2, 3],
        1,
      ],
      expected: [2, 3, 4],
    },
    {
      name: 'should to add one array and one Dnum number',
      operator: add,
      args: [
        [1, 2, 3],
        [1n, 0],
      ],
      expected: [2, 3, 4],
    },
    {
      name: 'should to sub two arrays',
      operator: sub,
      args: [
        [1, 2, 3],
        [1, 2, 3],
      ],
      expected: [0, 0, 0],
    },
    {
      name: 'should multiply two arrays',
      operator: mul,
      args: [
        [1, 2, 3],
        [1, 2, 3],
      ],
      expected: [1, 4, 9],
    },
    {
      name: 'should map the ceil() to the array',
      operator: ceil,
      args: [
        [1.1, 2.2],
      ],
      expected: [2, 3],
    },
    {
      name: 'should map the ceil() to the array with decimals',
      operator: ceil,
      args: [
        [1.1, 2.2],
        2,
      ],
      matcher: 'toEqual',
      expected: [
        [200n, 2],
        [300n, 2],
      ],
    },
    {
      name: 'should map the floor() to the array',
      operator: floor,
      args: [
        [1.1, 2.2],
      ],
      expected: [1, 2],
    },
    {
      name: 'should map the compare() to the array',
      operator: compare,
      args: [
        [1, 2],
        [2, 1],
      ],
      matcher: 'toEqual',
      expected: [
        -1,
        1,
      ],
    },
    {
      name: 'should map the abs() to the array',
      operator: abs,
      args: [
        [1, -2],
      ],
      expected: [1, 2],
    },
    {
      name: 'should map the gt() to the array',
      operator: gt,
      args: [
        [1, 2, 3],
        [1, 2, 3],
      ],
      matcher: 'toEqual',
      expected: [false, false, false],
    },
    {
      name: 'should map the lt() to the array',
      operator: lt,
      args: [
        [1, 2, 3],
        [1, 2, 3],
      ],
      matcher: 'toEqual',
      expected: [false, false, false],
    },
    {
      name: 'should map the gte() to the array',
      operator: gte,
      args: [
        [1, 2, 3],
        [1, 2, 3],
      ],
      matcher: 'toEqual',
      expected: [true, true, true],
    },
    {
      name: 'should map the lte() to the array',
      operator: lte,
      args: [
        [1, 2, 3],
        [1, 2, 3],
      ],
      matcher: 'toEqual',
      expected: [true, true, true],
    },
  ]

  it.each(cases)('$name', (options) => {
    const result = mapOperator(options.operator)(...options.args)
    expect(result)[options.matcher ?? 'toMatchNumberArray'](options.expected)
  })

  it('should throw error when the length of the two arrays are not equal', () => {
    expect(() => mapOperator(add)([1, 2, 3], [1, 2])).toThrow()
  })

  it('should able set options', () => {
    const result = mapOperator(add)([1, 2, 3], [1, 2, 3], 4)
    expect(result).toStrictEqual([[20000n, 4], [40000n, 4], [60000n, 4]])
  })
})
