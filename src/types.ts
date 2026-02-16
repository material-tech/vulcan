import type { Numberish } from 'dnum'

export type Processor<Input, Output> = (value: Input) => Output

export interface IndicatorGenerator<Input, Output, Options extends Record<string, any>> {
  (source: Iterable<Input>, options?: Partial<Options>): Generator<Output, void, Input | undefined>
  create: (options?: Partial<Options>) => Processor<Input, Output>
  defaultOptions: Options
}

export interface BatchIndicatorGenerator<Input, Output, Options extends Record<string, any>> {
  (source: Iterable<Input>, options?: Partial<Options>): Generator<Output, void, Input | undefined>
  defaultOptions: Options
}

export interface KlineData {
  /** High price */
  h: Numberish
  /** Low price */
  l: Numberish
  /** Open price */
  o: Numberish
  /** Close price */
  c: Numberish
  /** Volume */
  v: Numberish
  /** Timestamp */
  timestamp?: number | Date | string
}

type Prettify<T> = {
  [K in keyof T]: T[K]
} & {}

export type RequiredProperties<T, K extends keyof T> = Prettify<{
  [P in K]-?: T[P]
}>
