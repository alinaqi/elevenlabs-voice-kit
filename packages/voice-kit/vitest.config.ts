import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['test/**/*.test.ts'],
    coverage: {
      include: ['src/**/*.ts'],
      exclude: ['src/**/index.ts', 'src/react/**', 'src/**/types.ts', 'src/data/**'],
      thresholds: { lines: 80, functions: 80, branches: 75 }
    }
  }
})
