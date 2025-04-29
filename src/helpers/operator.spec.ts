import { add, mul, sub } from 'dnum'
import { describe, expect, it } from 'vitest'
import { mapOperator } from './operator'

describe('operator', () => {
  const cases = [
    {
      name: 'should to add two arrays',
      operator: 'add',
      input: [1, 2, 3],
      operateBy: [1, 2, 3],
      expected: [[2n, 0], [4n, 0], [6n, 0]],
    },
    {
      name: 'should to add one array and one number',
      operator: 'add',
      input: [1, 2, 3],
      operateBy: 1,
      expected: [[2n, 0], [3n, 0], [4n, 0]],
    },
    {
      name: 'should to add one array and one Dnum number',
      operator: 'add',
      input: [1, 2, 3],
      operateBy: [1n, 0],
      expected: [[2n, 0], [3n, 0], [4n, 0]],
    },
    {
      name: 'should to sub two arrays',
      operator: 'sub',
      input: [1, 2, 3],
      operateBy: [1, 2, 3],
      expected: [[0n, 0], [0n, 0], [0n, 0]],
    },
    {
      name: 'should multiply two arrays',
      operator: 'mul',
      input: [1, 2, 3],
      operateBy: [1, 2, 3],
      expected: [[1n, 0], [4n, 0], [9n, 0]],
    },
  ]

  const operators = {
    add,
    sub,
    mul,
  }

  it.each(cases)('$name', (options) => {
    const result = mapOperator(operators[options.operator as keyof typeof operators])(options.input, options.operateBy)
    expect(result).toStrictEqual(options.expected)
  })

  it('should throw error when the length of the two arrays are not equal', () => {
    expect(() => mapOperator(operators.add)([1, 2, 3], [1, 2])).toThrow()
  })

  it('should able set options', () => {
    const result = mapOperator(operators.add)([1, 2, 3], [1, 2, 3], 4)
    expect(result).toStrictEqual([[20000n, 4], [40000n, 4], [60000n, 4]])
  })
})
