const { getDefaultConfig } = require('expo/metro-config')
const path = require('path')

const projectRoot = __dirname
const workspaceRoot = path.resolve(projectRoot, '../..')

const config = getDefaultConfig(projectRoot)

config.watchFolders = [workspaceRoot]

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
