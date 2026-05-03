const { getDefaultConfig } = require('expo/metro-config')
const path = require('path')

const projectRoot = __dirname
const workspaceRoot = path.resolve(projectRoot, '../..')

const config = getDefaultConfig(projectRoot)

config.watchFolders = [workspaceRoot]

// Story 110.11 — empêche Metro de bundler les fichiers test/setup vitest
// (ils utilisent `import.meta` qui casse le runtime web non-module).
// blockList accepte un RegExp unique combinant tous les patterns.
config.resolver.blockList = /(.*\/__tests__\/.*|.*\.test\.(ts|tsx|js|jsx)$|.*\/vitest\.(setup|config)\.(ts|js)$)/

config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
]

// Deduplicate tamagui — all workspace packages must resolve to the same instance
const tamaguiPackages = [
  'tamagui',
  '@tamagui/core',
  '@tamagui/config',
  '@tamagui/babel-plugin',
  'react',
  'react-dom',
  'react-native',
  'react-native-web',
]
config.resolver.extraNodeModules = Object.fromEntries(
  tamaguiPackages.map((pkg) => [
    pkg,
    path.resolve(workspaceRoot, 'node_modules', pkg),
  ])
)

module.exports = config
