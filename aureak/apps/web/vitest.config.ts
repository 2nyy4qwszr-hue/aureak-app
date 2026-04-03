import { defineConfig } from 'vitest/config'
import path from 'path'

/**
 * Vitest config for apps/web — hooks and components tests.
 * Uses jsdom environment for React DOM testing (not RNTL, not Node).
 * Separate from packages/ui (which uses RNTL mocks).
 */
export default defineConfig({
  esbuild: {
    jsx: 'automatic',
  },
  test: {
    globals     : true,
    environment : 'jsdom',
    setupFiles  : ['./vitest.setup.ts'],
    include     : ['hooks/**/*.test.{ts,tsx}', 'components/**/*.test.{ts,tsx}'],
  },
  resolve: {
    alias: [
      {
        // Alias @aureak/theme → tokens directly (avoids tamagui boot in test env)
        find       : '@aureak/theme',
        replacement: path.resolve(__dirname, '../../packages/theme/src/tokens.ts'),
      },
      {
        // Alias react-native → web stubs (for components that import RN primitives)
        find       : /^react-native$/,
        replacement: path.resolve(__dirname, './__mocks__/react-native.js'),
      },
    ],
  },
})
