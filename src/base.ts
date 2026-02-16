import type { IndicatorGenerator, Processor } from './types'
import { defu } from 'defu'

/**
 * Create a generator-based indicator from a processor factory.
 *
 * Returns a generator function with `.createProcessor()` and `.defaultOptions`.
 */
export function createGenerator<Input, Output, Options extends Record<string, any>>(
  processorFactory: (options: Required<Options>) => Processor<Input, Output>,
  defaultOptions?: Options,
): IndicatorGenerator<Input, Output, Options> {
  function* generator(source: Iterable<Input>, options?: Partial<Options>): Generator<Output> {
    const opt = defu(options, defaultOptions) as Required<Options>
    const process = processorFactory(opt)
    for (const value of source) {
      yield process(value)
    }
  }

  generator.create = (options?: Partial<Options>): Processor<Input, Output> => {
    const opt = defu(options, defaultOptions) as Required<Options>
    return processorFactory(opt)
  }

  Object.defineProperty(generator, 'defaultOptions', {
    get() {
      return defu(defaultOptions)
    },
  })

  return generator as IndicatorGenerator<Input, Output, Options>
}

/**
 * Collect all values from an iterable into an array.
 */
export function collect<T>(gen: Iterable<T>): T[] {
  return Array.from(gen)
}
