import { createRequire } from 'module'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const require = createRequire(import.meta.url)

// Required by React Native internals
Object.defineProperty(global, '__DEV__', { value: true, configurable: true })
Object.defineProperty(global, '__RCTProfileIsProfiling', { value: false, configurable: true })

// Override Node's native require to intercept 'react-native'.
// react-native/index.js contains Flow syntax (import typeof) that Node cannot parse.
// RNTL does require('react-native') via its CJS build at load time.
// This hook ensures the pure-JS mock is returned for ALL require('react-native') calls.
const Module = require('module') as typeof import('module') & {
  _load: (request: string, parent: unknown, isMain: boolean) => unknown
}
const originalLoad = Module._load
const reactNativeMockPath = path.resolve(__dirname, './__mocks__/react-native.js')

Module._load = function (request: string, parent: unknown, isMain: boolean) {
  if (request === 'react-native') {
    return require(reactNativeMockPath)
  }
  return originalLoad.call(this, request, parent, isMain)
}
