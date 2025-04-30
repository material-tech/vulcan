import type { Dnum, Numberish, Rounding } from 'dnum'
import { abs, add, ceil, compare, floor, from, gt, gte, lt, lte, mul, remainder, round, setDecimals, sub, toJSON, toParts } from 'dnum'
import { describe, expect, expectTypeOf, it } from 'vitest'
import { mapOperator, max, min } from './operator'

interface Case<
  Data extends Numberish = Numberish,
  Operator extends (args0: Data, ...args: any[]) => any = (args0: Data, ...args: any[]) => any,
> {
  name: string
  operator: Operator
  args: [Data[], ...any[]]
  expected: ReturnType<Operator>[]
  matcher?: 'toEqual' | 'toMatchNumberArray'
}

describe('mapOperator', () => {
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
      name: 'should map the multiply() to the arrays',
      operator: mul,
      args: [
        [1, 2, 3],
        [1, 2, 3],
      ],
      expected: [1, 4, 9],
    },
    {
      name: 'should map the remainder() to the array',
      operator: remainder,
      args: [
        [3, 2, 5],
        [2, 2, 3],
      ],
      expected: [1, 0, 2],
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
    {
      name: 'should map the round() to the array',
      operator: round,
      args: [
        [1.1, 2.2],
      ],
      expected: [1, 2],
    },
    {
      name: 'should map the toParts() to the array',
      operator: toParts,
      args: [
        [
          [11n, 1],
          [22n, 1],
        ],
      ],
      matcher: 'toEqual',
      expected: [
        [1n, '1'],
        [2n, '2'],
      ],
    } as Case,
    {
      name: 'should map the from() to the array',
      operator: from,
      args: [
        [1, 2, 3],
      ],
      matcher: 'toEqual',
      expected: [
        [1n, 0],
        [2n, 0],
        [3n, 0],
      ],
    },
    {
      name: 'should map the toJSON() to the array',
      operator: toJSON,
      args: [
        [
          [1n, 0],
          [2n, 0],
          [3n, 0],
        ],
      ],
      matcher: 'toEqual',
      expected: ['["1",0]', '["2",0]', '["3",0]'],
    } as Case,
    {
      name: 'should map the setDecimals() to the array',
      operator: setDecimals,
      matcher: 'toEqual',
      args: [
        [
          [1n, 0],
          [2n, 0],
          [3n, 0],
        ],
        1,
      ],
      expected: [
        [10n, 1],
        [20n, 1],
        [30n, 1],
      ],
    } as Case,
  ]

  it.each(cases)('$name', (options) => {
    const result = mapOperator(options.operator)(...options.args)
    expect(result)[options.matcher ?? 'toMatchNumberArray'](options.expected)
  })

  it('should throw error when the length of the two arrays are not equal', () => {
    expect(() => mapOperator(add)([1, 2, 3], [1, 2]))
      .toThrow('Should have two array length must be equal')
  })

  it('should throw error when the first argument is not provided', () => {
    expect(mapOperator(add))
      .toThrow('First argument is required')
  })

  it('should throw error when more arguments are required', () => {
    // @ts-expect-error - test case
    expect(() => mapOperator(add)([1, 2, 3]))
      .toThrow('Should have at least one more argument')
  })
})

describe('mapOperator type', () => {
  it('should be correct type for some specific operators', () => {
    const mapToJSON = mapOperator(toJSON)
    type MapToJSONExpected = (dnum: Dnum[]) => string[]
    expectTypeOf(mapToJSON).toEqualTypeOf<MapToJSONExpected>()

    const mapToParts = mapOperator(toParts)
    type MapToPartsExpected = (dnum: Dnum[], optionsOrDigits?: Parameters<typeof toParts>[1]) => [whole: bigint, fraction: string | null][]
    expectTypeOf(mapToParts).toEqualTypeOf<MapToPartsExpected>()

    const mapToSetDecimals = mapOperator(setDecimals)
    type MapToSetDecimalsExpected = (value: Dnum[], decimals: number, options?: { rounding?: Rounding }) => Dnum[]
    expectTypeOf(mapToSetDecimals).toEqualTypeOf<MapToSetDecimalsExpected>()

    const mapFrom = mapOperator(from)
    type MapFromExpected = (value: Numberish[], decimals?: number | true) => Dnum[]
    expectTypeOf(mapFrom).toEqualTypeOf<MapFromExpected>()
  })
})

describe('custom operator', () => {
  it('should max() work properly', () => {
    const result = max([1, 2, 3])
    expect(result).toEqual(3)
  })

  it('should max() work properly with period and start', () => {
    const result = max([1, 2, 3], { period: 2, start: 0 })
    expect(result).toEqual(2)
  })

  it('should max() work properly with negative start', () => {
    const result = max([1, 2, 3], { period: 3, start: -2 })
    expect(result).toEqual(1)
  })

  it('should min() work properly', () => {
    const result = min([1, 2, 3])
    expect(result).toEqual(1)
  })

  it('should min() work properly with period and start', () => {
    const result = min([3, 2, 1], { period: 2, start: 0 })
    expect(result).toEqual(2)
  })
})
