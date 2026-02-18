# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Vulcan is a TypeScript technical analysis indicator library using `dnum` for high-precision decimal arithmetic (`[value: bigint, decimals: number]` tuples). The project is organized as a **pnpm monorepo** with the following packages:

- **`@material-tech/vulcan-core`** (`packages/core/`) — core types (`CandleData`, `Processor`, `SignalGenerator`) and factory function (`createSignal`, `collect`)
- **`@material-tech/vulcan-indicators`** (`packages/indicators/`) — all indicators organized by category: `trend/`, `momentum/`, `volume/`
- **`@material-tech/vulcan-strategies`** (`packages/strategies/`) — composable trading strategies with structured signal output
- **`@material-tech/vulcan-backtest`** (`packages/backtest/`) — backtesting engine with position management and statistics

**Dependency graph:** `indicators` → `core`, `strategies` → `core` + `indicators`, `backtest` → `core` + `strategies`

**Key technologies:**

- **tsdown**: Core bundler (per-package config)
- **pnpm**: Package manager with workspace support
- **vitest**: Testing framework (per-package, coordinated via root `projects` config)
- **TypeScript**: Strict mode
- **ESM**: Pure ESM packages (`"type": "module"`)

## Commands

```bash
pnpm build              # Recursively build all packages
pnpm test --run         # Run all tests (with typecheck) across all packages
pnpm -r run test        # Run tests independently in each package
pnpm test:coverage      # Run tests with coverage
pnpm lint               # Lint
pnpm lint:fix           # Lint with auto-fix
```

## Architecture

### Core Package (`packages/core/`)

- `createSignal(fn, defaultOptions)` — creates a generator-based indicator with `.create()` and `.defaultOptions`
- `collect(iterable)` — collects all values from an iterable into an array
- `CandleData` — OHLCV candle data: `{ h, l, o, c, v }` (all `Numberish`)
- `Processor<I, O>` — stateful function `(value: I) => O`
- `SignalGenerator<I, O, Opts>` — generator function with `.create()` factory

### Indicators Package (`packages/indicators/`)

- `trend/` — 14 indicators (SMA, EMA, DEMA, MACD, Aroon, etc.)
- `momentum/` — 7 indicators (RSI, STOCH, APO, PPO, etc.)
- `volume/` — 1 indicator (Accumulation/Distribution)

Imports from core use `@material-tech/vulcan-core`. Cross-category imports use relative paths (e.g., `../trend/exponentialMovingAverage`).

### Module Resolution

Root `tsconfig.json` maps workspace packages via `paths` for development. Each package has its own `tsconfig.json` with `paths` for self-reference and cross-package imports. `vite-tsconfig-paths` (in indicators) enables vitest to resolve these paths at test time.

## Implementing a New Indicator

1. **Create** `packages/indicators/src/<category>/<indicatorName>.ts` — define `Options` interface, `defaultOptions`, implement with `createSignal` (from `@material-tech/vulcan-core`), export short name + long alias
2. **Export** from `packages/indicators/src/<category>/index.ts` — add `export * from './<indicatorName>'`
3. **Test** in `packages/indicators/tests/<category>/<indicatorName>.spec.ts` — import from `@material-tech/vulcan-core` (for `collect`) and `@material-tech/vulcan-indicators` (for the indicator)
4. **Update** README.md (and README_zh.md) — change `[ ]` to `[x]` for the indicator

## Testing Conventions

- Each package has its own `tests/` directory and `vitest.config.ts`
- Root `vitest.config.ts` uses `projects: ['packages/*']` to coordinate all packages
- Custom matchers in `packages/indicators/vitest-setup.ts`:
  - `toMatchNumberArray(expected, { digits?: 2 })` — compares `Dnum[]` to `number[]`
  - `toMatchNumber(expected, { digits?: 2 })` — compares single `Dnum` to `number`
- Core tests use relative imports (`../src/index`); indicators tests use package names resolved via `vite-tsconfig-paths`
- Write code comments and test names in English
- Each indicator should have complete JSDoc documentation

## Critical: dnum Precision Rules

1. **Matching decimals**: Always ensure operands have the same decimal precision. `subtract([16n, 0], [15.4 as Dnum with 18 decimals])` truncates to lower precision and gives wrong results. Use `from(value, 18)` consistently.
2. **Multiply/divide decimal param**: Always pass `18` as the decimal parameter to `multiply` and `divide` to avoid integer truncation (e.g., `7/3` becoming `2` instead of `2.333...`).
3. **Scalar multipliers**: Use plain numbers (not Dnum) for integer multipliers to avoid decimal accumulation (`multiply` sums decimals: 18+18=36).

## Pre-commit Hooks

`simple-git-hooks` runs `lint-staged` (eslint --fix) on `*.{js,ts,md}` files before commit.
