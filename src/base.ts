import type { CreateSignalFunc, TechnicalSignal } from './types'
import defu from 'defu'

/**
 * Create a technical signal
 */
export function createSignal<Data, Result, Options extends Record<string, any>>(
  createFunc: CreateSignalFunc<Data, Result, Options>,
  defaultOptions?: Options,
): TechnicalSignal<Data, Result, Options> {
  const _dataset: Data[] = []

  function impl(dataset: Data[], options?: Partial<Options>) {
    if (dataset.length === 0) {
      return [] as Result
    }
    const opt = defu(options, defaultOptions) as Required<Options>
    return createFunc(dataset, opt)
  }

  function update(dataset: Data[]): void
  function update(...dataset: Data[]): void
  function update(dataset: Data[] | Data, ...rest: Data[]): void {
    if (Array.isArray(dataset)) {
      _dataset.push(...dataset)
    }
    else {
      _dataset.push(dataset, ...rest)
    }
  }

  function result(options?: Partial<Options>) {
    return impl(_dataset, options)
  }

  return Object.assign(impl, {
    update,
    result,
    get dataset() {
      return _dataset
    },
    get defaultOptions() {
      return defaultOptions as Options
    },
  })
}
