export function mapPick<
  T extends any[],
  K extends keyof T[number],
  Result,
>(
  data: T,
  key: K,
  mapFn: (value: T[number][K]) => Result,
) {
  return data.map(v => mapFn(v[key]))
}
