import type { CreateSignalFunc, TechnicalSignal } from './types'
import { defu } from 'defu'

/**
 * Create a technical signal
 */
export function createSignal<Data, Result, Options extends Record<string, any>>(
  createFunc: CreateSignalFunc<Data, Result, Options>,
  defaultOptions?: Options,
): TechnicalSignal<Data, Result, Options> {
  function impl(dataset: Data[], options?: Partial<Options>) {
    if (dataset.length === 0) {
      return [] as Result
    }
    const opt = defu(options, defaultOptions) as Required<Options>
    return createFunc(dataset, opt)
  }

  Object.defineProperty(impl, 'defaultOptions', {
    get() {
      return defu(defaultOptions)
    },
  })

  return impl as TechnicalSignal<Data, Result, Options>
}
