# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Alloy is a TypeScript technical analysis indicator library using `dnum` for high-precision decimal arithmetic (`[value: bigint, decimals: number]` tuples). Indicators are organized by category: `src/trend/`, `src/momentum/`, `src/volume/`.

**Key technologies:**

- **tsdown**: Core bundler
- **pnpm**: Package manager (v10.28.1)
- **vitest**: Testing framework
- **TypeScript**: Strict mode with isolated declarations enabled
- **ESM**: Pure ESM package (`"type": "module"`)

## Commands

```bash
pnpm build              # Build with tsdown
pnpm test --run         # Run all tests (with typecheck)
pnpm test run <path>    # Run a single test file
pnpm test:coverage      # Run tests with coverage
pnpm lint               # Lint
pnpm lint:fix           # Lint with auto-fix
```

## Architecture

### Core Types (`src/types.ts`, `src/base.ts`)

- `TechnicalSignal<Data, Result, Options>` — callable function object with `defaultOptions` property
- `createSignal(fn, defaultOptions)` — wraps an indicator function, handles empty arrays (returns `[]`), merges options with `defu`
- `KlineData` — OHLCV candle data: `{ h, l, o, c, v }` (all `Numberish`)

### Helpers (`src/helpers/`)

- `mapOperator(action)` — lifts a scalar dnum operation to work on arrays (element-wise). Pre-built: `add`, `subtract`, `multiply`, `divide` (and aliases `sub`, `mul`, `div`)
- `movingAction(values, action, period)` — sliding window operation over an array
- `mapPick(array, key, transform?)` — extract and optionally transform a field from object arrays
- `max`, `min` — find extremes with optional period/start

### Path Alias

`~/*` maps to `./src/*` (configured in tsconfig.json, supported in tests via `vite-tsconfig-paths`).

## Implementing a New Indicator

1. **Create** `src/<category>/<indicatorName>.ts` — define `Options` interface, `defaultOptions`, implement with `createSignal`, export short name + long alias (e.g., `export { cfo as chandeForecastOscillator }`)
2. **Export** from `src/<category>/index.ts` — add `export * from './<indicatorName>'`
3. **Test** in `tests/<category>/<indicatorName>.spec.ts` — two test cases: default options and custom options, using `toMatchNumberArray` matcher
4. **Update** README.md (and README_zh.md) — change `[ ]` to `[x]` for the indicator

## Testing Conventions

- Use vitest with `*.spec.ts` files
- Custom matchers in `vitest-setup.ts`:
  - `toMatchNumberArray(expected, { digits?: 2 })` — compares `Dnum[]` to `number[]`
  - `toMatchNumber(expected, { digits?: 2 })` — compares single `Dnum` to `number`
- Write code comments and test names in English
- Each indicator should have complete JSDoc documentation

## Critical: dnum Precision Rules

1. **Matching decimals**: Always ensure operands have the same decimal precision. `subtract([16n, 0], [15.4 as Dnum with 18 decimals])` truncates to lower precision and gives wrong results. Use `from(value, 18)` consistently.
2. **Multiply/divide decimal param**: Always pass `18` as the decimal parameter to `multiply` and `divide` to avoid integer truncation (e.g., `7/3` becoming `2` instead of `2.333...`).
3. **Scalar multipliers**: Use plain numbers (not Dnum) for integer multipliers to avoid decimal accumulation (`multiply` sums decimals: 18+18=36).

## Pre-commit Hooks

`simple-git-hooks` runs `lint-staged` (eslint --fix) on `*.{js,ts,md}` files before commit.
