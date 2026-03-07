import { defineConfig } from 'vitest/config'

// Root vitest config — fallback for packages without their own config.
// Each package (types, ui) has a dedicated vitest.config.ts for environment-specific setup.
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['packages/*/src/**/*.test.ts', 'packages/*/src/**/*.test.tsx'],
  },
})
