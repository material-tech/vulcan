import type { Numberish, Rounding } from 'dnum'

export interface TechnicalSignal<Data, Result, Options extends Record<string, any>> {
  defaultOptions: TechnicalSignalOptions<Options>
  (dataset: Data[], options?: Partial<TechnicalSignalOptions<Options>>): Result
}

export interface CreateSignalFunc<Data, Result, Options extends Record<string, any>> {
  (dataset: Data[], options: Required<Options>): Result
}

export type TechnicalSignalOptions<T extends Record<string, any> = object> = T & {
  /** decimal precision */
  decimals?: number
  /** rounding method */
  rounding?: Rounding
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
