import { antfu } from '@antfu/eslint-config'

export default antfu(
  {
    typescript: true,
    ignores: ['.agents/**', 'packages/*/dist/**'],
  },
  {
    files: ['example/**/*.ts'],
    rules: {
      'no-console': 'off',
      'antfu/no-top-level-await': 'off',
    },
  },
)
