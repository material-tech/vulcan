import type { CreateSignalFunc, TechnicalSignal, TechnicalSignalOptions } from './types'
import { defu } from 'defu'

/** singleton decimal options */
const decimalOptions = {
  value: {
    decimals: 18,
    rounding: 'ROUND_HALF',
  } as TechnicalSignalOptions,
}

/** set common decimal options */
export function setDecimalOptions(options: Partial<TechnicalSignalOptions>) {
  decimalOptions.value = defu(options, decimalOptions.value)
}

/** get common decimal options */
export function useDecimalOptions() {
  return decimalOptions.value
}

/**
 * Create a technical signal
 */
export function createSignal<Data, Result, Options extends Record<string, any>>(
  createFunc: CreateSignalFunc<Data, Result, TechnicalSignalOptions<Options>>,
  defaultOptions?: Options,
): TechnicalSignal<Data, Result, Options> {
  function impl(dataset: Data[], options?: Partial<TechnicalSignalOptions<Options>>) {
    if (dataset.length === 0) {
      return [] as Result
    }
    const contextOpt = defu(defaultOptions, useDecimalOptions())
    const opt = defu(options, contextOpt) as Required<TechnicalSignalOptions<Options>>
    return createFunc(dataset, opt)
  }

  Object.defineProperty(impl, 'defaultOptions', {
    get() {
      return defu(defaultOptions, useDecimalOptions())
    },
  })

  return impl as TechnicalSignal<Data, Result, Options>
}
