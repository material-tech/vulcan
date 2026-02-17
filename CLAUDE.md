# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Alloy is a TypeScript technical analysis indicator library using `dnum` for high-precision decimal arithmetic (`[value: bigint, decimals: number]` tuples). The project is organized as a **pnpm monorepo** with three packages:

- **`@material-tech/alloy-core`** (`packages/core/`) — core types (`KlineData`, `Processor`, `IndicatorGenerator`) and factory function (`createSignal`, `collect`)
- **`@material-tech/alloy-indicators`** (`packages/indicators/`) — all indicators organized by category: `trend/`, `momentum/`, `volume/`
- **`@material-tech/alloy-adapters`** (`packages/adapters/`) — adapters for batch processing, Node.js streams, and Web streams

**Dependency graph:** `indicators` → `core`, `adapters` → `core`

**Key technologies:**

- **tsdown**: Core bundler (per-package config)
- **pnpm**: Package manager with workspace support
- **vitest**: Testing framework (root-level, unified)
- **TypeScript**: Strict mode
- **ESM**: Pure ESM packages (`"type": "module"`)

## Commands

```bash
pnpm build              # Recursively build all packages (core → indicators/adapters)
pnpm test --run         # Run all tests (with typecheck)
pnpm test run <path>    # Run a single test file
pnpm test:coverage      # Run tests with coverage
pnpm lint               # Lint
pnpm lint:fix           # Lint with auto-fix
```

## Architecture

### Core Package (`packages/core/`)

- `createSignal(fn, defaultOptions)` — creates a generator-based indicator with `.create()` and `.defaultOptions`
- `collect(iterable)` — collects all values from an iterable into an array
- `KlineData` — OHLCV candle data: `{ h, l, o, c, v }` (all `Numberish`)
- `Processor<I, O>` — stateful function `(value: I) => O`
- `IndicatorGenerator<I, O, Opts>` — generator function with `.create()` factory

### Indicators Package (`packages/indicators/`)

- `trend/` — 14 indicators (SMA, EMA, DEMA, MACD, Aroon, etc.)
- `momentum/` — 7 indicators (RSI, STOCH, APO, PPO, etc.)
- `volume/` — 1 indicator (Accumulation/Distribution)

Imports from core use `@material-tech/alloy-core`. Cross-category imports use relative paths (e.g., `../trend/exponentialMovingAverage`).

### Adapters Package (`packages/adapters/`)

- `batch` — wraps generators for array-in/array-out processing
- `node-stream` — Node.js Transform streams (object mode)
- `web-stream` — Web TransformStreams

Subpath exports: `@material-tech/alloy-adapters/batch`, `@material-tech/alloy-adapters/node-stream`, `@material-tech/alloy-adapters/web-stream`

### Module Resolution

Root `tsconfig.json` maps workspace packages via `paths` for development. `vite-tsconfig-paths` enables vitest to resolve these paths at test time.

## Implementing a New Indicator

1. **Create** `packages/indicators/src/<category>/<indicatorName>.ts` — define `Options` interface, `defaultOptions`, implement with `createSignal` (from `@material-tech/alloy-core`), export short name + long alias
2. **Export** from `packages/indicators/src/<category>/index.ts` — add `export * from './<indicatorName>'`
3. **Test** in `tests/<category>/<indicatorName>.spec.ts` — import from `@material-tech/alloy-core` (for `collect`) and `@material-tech/alloy-indicators` (for the indicator)
4. **Update** README.md (and README_zh.md) — change `[ ]` to `[x]` for the indicator

## Testing Conventions

- Use vitest with `*.spec.ts` files in root `tests/` directory
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
