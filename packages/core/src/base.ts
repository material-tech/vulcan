import type { IndicatorGenerator, Processor } from './types'
import { defu } from 'defu'

/**
 * Create a generator-based indicator from a processor factory.
 *
 * Returns a generator function with `.create()` and `.defaultOptions`.
 */
export function createSignal<Input, Output, Options extends Record<string, any>>(
  factory: (options: Required<Options>) => Processor<Input, Output>,
  defaultOptions?: Options,
): IndicatorGenerator<Input, Output, Options> {
  function* generator(source: Iterable<Input>, options?: Partial<Options>): Generator<Output, void, unknown> {
    const opt = defu(options, defaultOptions) as Required<Options>
    const process = factory(opt)
    for (const value of source) {
      yield process(value)
    }
  }

  generator.create = (options?: Partial<Options>): Processor<Input, Output> => {
    const opt = defu(options, defaultOptions) as Required<Options>
    return factory(opt)
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
