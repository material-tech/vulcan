import type { Numberish } from 'dnum'

/**
 * Unwrap array types from a result type.
 * - `Dnum[]` → `Dnum`
 * - `{ macd: Dnum[], signal: Dnum[] }` → `{ macd: Dnum, signal: Dnum }`
 */
export type Unarray<T> = T extends readonly (infer U)[]
  ? U
  : { [K in keyof T]: T[K] extends readonly (infer U)[] ? U : T[K] }

export interface TechnicalSignal<Data, Result, Options extends Record<string, any>> {
  readonly defaultOptions: Options
  (dataset: Data[], options?: Partial<Options>): Result
  stream: (options?: Partial<Options>) => (data: Data) => Unarray<Result>
  toTransformStream: (options?: Partial<Options>) => TransformStream<Data, Unarray<Result>>
}

export interface CreateSignalFunc<Data, Result, Options extends Record<string, any>> {
  (dataset: Data[], options: Required<Options>): Result
}

export interface CreateStreamFunc<Data, Result, Options extends Record<string, any>> {
  (options: Required<Options>): (data: Data) => Unarray<Result>
}

export interface CreateSignalOptions<Data, Result, Options extends Record<string, any>> {
  compute?: CreateSignalFunc<Data, Result, Options>
  stream: CreateStreamFunc<Data, Result, Options>
  defaultOptions?: Options
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
