import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  esbuild: {
    // Enable automatic JSX transform (no need to import React in test files)
    jsx: 'automatic',
  },
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    // DO NOT use server.deps.inline for react-native or @testing-library/react-native:
    // react-native/index.js contains Flow syntax (import typeof) that Vite's SSR
    // transform cannot parse. Instead, the vitest.setup.ts patches Module._load to
    // intercept ALL native CJS require('react-native') calls and return the pure-JS mock.
  },
  resolve: {
    alias: [
      {
        // Alias @aureak/theme to tokens-only to avoid tamagui import in test env
        find: '@aureak/theme',
        replacement: path.resolve(__dirname, '../theme/src/tokens.ts'),
      },
      {
        // Alias react-native → pure-JS mock for Vite's SSR transform pipeline.
        // This handles cases where project files (e.g. IndicatorToggle.tsx) import
        // react-native and Vite tries to SSR-transform it (Flow syntax would fail).
        // Additionally, vitest.setup.ts patches Module._load for RNTL's native CJS require.
        find: /^react-native$/,
        replacement: path.resolve(__dirname, './__mocks__/react-native.js'),
      },
    ],
  },
})
