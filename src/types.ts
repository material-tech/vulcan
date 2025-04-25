import type { Numberish } from 'dnum'

export interface TechnicalSignal<Data, Result, Options> {
  update: {
    (...dataset: Data[]): void
    (dataset: Data[]): void
  }
  result: (options?: Partial<Options>) => Result
  dataset: Data[]
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
  v?: Numberish
  /** Timestamp */
  timestamp?: number | Date
}
