import type { CreateSignalConfig, TechnicalSignal, WrapResult } from './types'
import { defu } from 'defu'

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function transpose<T extends Record<string, unknown>>(items: T[]): { [K in keyof T]: T[K][] } {
  const result = {} as Record<string, unknown[]>
  for (const item of items) {
    for (const key of Object.keys(item)) {
      ;(result[key] ??= []).push(item[key])
    }
  }
  return result as { [K in keyof T]: T[K][] }
}

/**
 * Create a technical signal with batch compute and step processing support.
 *
 * Overload 1: Pass a step factory function directly (shorthand).
 * Overload 2: Pass a config object with `compute` and/or `step`.
 */
export function createSignal<Data, Element, Options extends Record<string, any>>(
  step: (options: Required<Options>) => (data: Data) => Element,
  defaultOptions?: Options,
): TechnicalSignal<Data, WrapResult<Element>, Options>
export function createSignal<Data, Element, Options extends Record<string, any>>(
  config: CreateSignalConfig<Data, Element, Options>,
): TechnicalSignal<Data, WrapResult<Element>, Options>
export function createSignal<Data, Element, Options extends Record<string, any>>(
  stepOrConfig: ((options: Required<Options>) => (data: Data) => Element) | CreateSignalConfig<Data, Element, Options>,
  defaultOpts?: Options,
): TechnicalSignal<Data, WrapResult<Element>, Options> {
  const isFunction = typeof stepOrConfig === 'function'
  const createStep = isFunction ? stepOrConfig : stepOrConfig.step
  const compute = isFunction ? undefined : stepOrConfig.compute
  const defaultOptions = isFunction ? defaultOpts : stepOrConfig.defaultOptions

  function impl(dataset: Data[], options?: Partial<Options>) {
    if (dataset.length === 0) {
      return [] as unknown as WrapResult<Element>
    }
    const opt = defu(options, defaultOptions) as Required<Options>
    if (compute) {
      return compute(dataset, opt)
    }
    // Auto-derive from step
    const stepFn = createStep(opt)
    const results = dataset.map(stepFn)
    const first = results[0]
    if (isPlainObject(first)) {
      return transpose(results as Record<string, unknown>[]) as WrapResult<Element>
    }
    return results as WrapResult<Element>
  }

  impl.step = (options?: Partial<Options>) => {
    const opt = defu(options, defaultOptions) as Required<Options>
    return createStep(opt)
  }

  Object.defineProperty(impl, 'defaultOptions', {
    get() {
      return defu(defaultOptions)
    },
  })

  return impl as TechnicalSignal<Data, WrapResult<Element>, Options>
}
