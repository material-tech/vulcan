import { describe, expect, it } from 'vitest'
import { assert } from '../../src/helpers/assert'

describe('assert', () => {
  it('should not throw error when condition is true', () => {
    expect(() => assert(true, 'This should not throw')).not.toThrow()
  })

  it('should throw error with string message when condition is false', () => {
    const errorMessage = 'Test error message'
    expect(() => assert(false, errorMessage)).toThrow(errorMessage)
  })

  it('should throw the provided Error object when condition is false', () => {
    const errorObj = new Error('Test error object')
    expect(() => assert(false, errorObj)).toThrow(errorObj)
  })

  it('should work as a type assertion', () => {
    const maybeString: string | undefined = 'test'
    assert(typeof maybeString === 'string', 'Value must be a string')
    expect(maybeString.length).toBe(4)
  })
})
