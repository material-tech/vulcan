import type { Numberish } from 'dnum'

export interface TechnicalSignal<Data, Result, Options> {
  defaultOptions: Options
  (dataset: Data[], options?: Partial<Options>): Result
}

export interface CreateSignalFunc<Data, Result, Options> {
  (dataset: Data[], options: Required<Options>): Result
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
  timestamp?: number | Date
}

type Prettify<T> = {
  [K in keyof T]: T[K]
} & {}

export type RequiredProperties<T, K extends keyof T> = Prettify<{
  [P in K]-?: T[P]
}>
