# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Vulcan is a TypeScript technical analysis indicator library built on generator-based streaming architecture with high-precision decimal arithmetic. Numbers are represented internally as FP18 bigints (18-decimal fixed-point) for performance, with `dnum` (`[value: bigint, decimals: number]` tuples) used at API boundaries. The project is organized as a **pnpm monorepo**.

### Packages

- **`@vulcan-js/core`** (`packages/core/`) — core types (`CandleData`, `Processor`, `SignalGenerator`), factory functions (`createSignal`, `collect`), and `fp18` arithmetic namespace
- **`@vulcan-js/indicators`** (`packages/indicators/`) — 34 indicators organized by category: `trend/`, `momentum/`, `volatility/`, `volume/`, plus `primitives/` (low-level FP18 building blocks)
- **`@vulcan-js/strategies`** (`packages/strategies/`) — composable trading strategies with structured signal output (`StrategySignal`)
- **`@vulcan-js/backtest`** (`packages/backtest/`) — backtesting engine with position management, statistics (`Sharpe`, `Sortino`, max drawdown, etc.)
- **`@vulcan-js/forge`** (`packages/forge/`) — all-in-one re-export package aggregating all modules
- **`@vulcan-js/example`** (`example/`) — private demo package (not published) with indicator, strategy, and backtest usage examples

### Dependency Graph

```
forge → backtest + indicators + strategies + core
backtest → strategies + core
strategies → indicators + core
indicators → core
example → forge
```

### Key Technologies

- **tsdown** — bundler (workspace mode, root `tsdown.config.ts`)
- **pnpm** — package manager with workspace + catalogs (`pnpm-workspace.yaml`)
- **vitest** — testing framework (per-package, coordinated via root `projects` config)
- **TypeScript** — strict mode, ES2020 target
- **ESM** — pure ESM packages (`"type": "module"`)
- **bumpp** — version release tool

## Commands

```bash
pnpm build              # Build all packages (tsdown workspace mode)
pnpm test --run         # Run all tests (with typecheck) across all packages
pnpm -r run test        # Run tests independently in each package
pnpm test:coverage      # Run tests with coverage
pnpm bench              # Run benchmarks
pnpm lint               # Lint
pnpm lint:fix           # Lint with auto-fix
pnpm release            # Version bump + publish (bumpp)
```

## Architecture

### Core Package (`packages/core/`)

- `createSignal(fn, defaultOptions)` — creates a generator-based indicator with `.create()` and `.defaultOptions`
- `collect(iterable)` — collects all values from an iterable into an array
- `fp18` namespace — FP18 fixed-point arithmetic: `toFp18()`, `toDnum()`, `mul()`, `div()`, `abs()`, constants (`ZERO`, `ONE`, `TWO`, `HUNDRED`, `SCALE`)
- `CandleData` — OHLCV candle data: `{ h, l, o, c, v, timestamp? }` (all `Numberish`)
- `Processor<I, O>` — stateful function `(value: I) => O`
- `SignalGenerator<I, O, Opts>` — generator function with `.create()` factory
- `toDnum(value)` — convert `Numberish` to `Dnum`
- `assert(condition, message)` — assertion utility

### Indicators Package (`packages/indicators/`)

- `primitives/` — 7 low-level FP18 processors: `sma`, `ewma`, `rma`, `mmax`, `mmin`, `msum`, `ad`
- `trend/` — 21 indicators (SMA, EMA, DEMA, TEMA, MACD, Aroon, Ichimoku Cloud, Parabolic SAR, Vortex, TRIX, TRIMA, VWMA, BOP, CFO, Qstick, etc.)
- `momentum/` — 11 indicators (RSI, STOCH, KDJ, APO, PPO, PVO, CCI, AO, CMO, ROC, WILLR)
- `volatility/` — 1 indicator (Mass Index)
- `volume/` — 1 indicator (Accumulation/Distribution)

Imports from core use `@vulcan-js/core`. Cross-category imports use relative paths (e.g., `../trend/exponentialMovingAverage`). Primitives are imported from `../primitives/`.

### Strategies Package (`packages/strategies/`)

- `createStrategy()` factory function
- Built-in strategies: `goldenCross` (SMA crossover), `rsiOversoldOverbought` (RSI extremes)
- Output type: `StrategySignal { action, size?, stopLoss?, takeProfit?, reason? }`

### Backtest Package (`packages/backtest/`)

- `backtest()` — batch mode, returns full results
- `backtestStream()` — streaming mode via async generator
- `computeStatistics()` — performance metrics (Sharpe, Sortino, max drawdown, profit factor, win rate, etc.)

### Module Resolution

Root `tsconfig.json` maps workspace packages via `paths` for development. Each package has its own `tsconfig.json` with `paths` for self-reference and cross-package imports. `vite-tsconfig-paths` (in indicators) enables vitest to resolve these paths at test time.

## Implementing a New Indicator

1. **Create** `packages/indicators/src/<category>/<indicatorName>.ts` — define `Options` interface, `defaultOptions`, implement with `createSignal` (from `@vulcan-js/core`), export short name + long alias
2. **Export** from `packages/indicators/src/<category>/index.ts` — add `export * from './<indicatorName>'`
3. **Test** in `packages/indicators/tests/<category>/<indicatorName>.spec.ts` — import from `@vulcan-js/core` (for `collect`) and `@vulcan-js/indicators` (for the indicator)
4. **Update** README.md (and README_zh.md) — change `[ ]` to `[x]` for the indicator

### Indicator Implementation Pattern

```typescript
import type { CandleData } from '@vulcan-js/core'
import { createSignal, fp18 } from '@vulcan-js/core'
import { sma } from '../primitives/sma'

interface MyIndicatorOptions { period: number }
const defaultOptions: MyIndicatorOptions = { period: 14 }

export const myInd = createSignal(function* (source, options) {
  const processor = sma(options.period)
  for (const value of source) {
    const v = fp18.toFp18(value)
    yield fp18.toDnum(processor(v))
  }
}, defaultOptions)

export { myInd as myIndicator }
```

## Testing Conventions

- Each package has its own `tests/` directory and `vitest.config.ts`
- Root `vitest.config.ts` uses `projects: ['packages/*']` to coordinate all packages
- Custom matchers in root `vitest-setup.ts` (shared by packages that need them):
  - `toMatchNumberArray(expected, { digits?: 2 })` — compares `Dnum[]` to `number[]`
  - `toMatchNumber(expected, { digits?: 2 })` — compares single `Dnum` to `number`
- Core tests use relative imports (`../src/index`); indicators tests use package names resolved via `vite-tsconfig-paths`
- Write code comments and test names in English
- Each indicator should have complete JSDoc documentation

## Critical: FP18 Precision Rules

Indicators internally use FP18 bigint arithmetic (`fp18` namespace from `@vulcan-js/core`) for performance. Key rules:

1. **Use `fp18.toFp18()`** to convert `Numberish` inputs to FP18 bigints before arithmetic
2. **Use `fp18.toDnum()`** to convert FP18 results back to `Dnum` tuples for output
3. **Use `fp18.mul()` / `fp18.div()`** for multiplication and division — these handle the 18-decimal scaling automatically
4. **Constants**: `fp18.ZERO`, `fp18.ONE`, `fp18.TWO`, `fp18.HUNDRED` are pre-scaled FP18 values
5. **Primitives** (`packages/indicators/src/primitives/`) operate on raw FP18 bigints for maximum performance

### Legacy dnum Rules (for code that still uses dnum directly)

1. **Matching decimals**: Always ensure operands have the same decimal precision. Use `from(value, 18)` consistently.
2. **Multiply/divide decimal param**: Always pass `18` as the decimal parameter to `multiply` and `divide` to avoid integer truncation.
3. **Scalar multipliers**: Use plain numbers (not Dnum) for integer multipliers to avoid decimal accumulation.

## Pre-commit Hooks

`simple-git-hooks` runs `lint-staged` (eslint --fix) on `*.{js,ts,md}` files before commit.
