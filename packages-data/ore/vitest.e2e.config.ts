import process from 'node:process'
import tsconfigPaths from 'vite-tsconfig-paths'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    include: ['tests/e2e/**/*.e2e.spec.ts'],
    exclude: ['tests/*.spec.ts', 'tests/!(e2e)/**/*.spec.ts'],
    setupFiles: [],
    testTimeout: 60000, // 60s for e2e tests
    hookTimeout: 30000,
    globals: true,
    env: {
      // Load from .env file if present
      ...process.env,
    },
  },
})
