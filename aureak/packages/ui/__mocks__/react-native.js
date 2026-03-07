'use strict'

// Pure-JS mock for react-native — used in Vitest test environment.
// Avoids loading react-native/index.js which contains Flow syntax (import typeof)
// that Vite/esbuild cannot transform.
// RNTL uses react-test-renderer for component tree traversal, so string components work:
// React renders them as host nodes in the fiber tree.

// No vitest dependency here — this file is loaded via native CJS require.
const mockFn = function () { return function () {} }

const StyleSheet = {
  create: function (styles) {
    return styles
  },
  flatten: function (style) {
    return style
  },
  hairlineWidth: 0.5,
  absoluteFill: {},
  absoluteFillObject: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },
}

const Platform = {
  OS: 'ios',
  select: function (obj) {
    return obj.ios !== undefined ? obj.ios : obj.default
  },
  Version: 16,
  isPad: false,
  isTVOS: false,
}

const Dimensions = {
  get: function () {
    return { width: 375, height: 812, scale: 2, fontScale: 1 }
  },
  addEventListener: function () {
    return { remove: function () {} }
  },
  removeEventListener: function () {},
}

const Keyboard = {
  dismiss: mockFn(),
  addListener: function () {
    return { remove: function () {} }
  },
  removeListener: function () {},
}

const AnimatedValue = function (val) {
  this._value = val || 0
}
AnimatedValue.prototype.setValue = function () {}
AnimatedValue.prototype.interpolate = function () {
  return this
}
AnimatedValue.prototype.addListener = function () {
  return ''
}
AnimatedValue.prototype.removeListener = function () {}

const Animated = {
  Value: AnimatedValue,
  ValueXY: function (val) {
    this.x = new AnimatedValue(val ? val.x : 0)
    this.y = new AnimatedValue(val ? val.y : 0)
  },
  View: 'Animated.View',
  Text: 'Animated.Text',
  Image: 'Animated.Image',
  createAnimatedComponent: function (comp) {
    return comp
  },
  timing: function () {
    return { start: function (cb) { cb && cb() }, stop: function () {} }
  },
  spring: function () {
    return { start: function (cb) { cb && cb() }, stop: function () {} }
  },
  parallel: function () {
    return { start: function (cb) { cb && cb() }, stop: function () {} }
  },
  sequence: function () {
    return { start: function (cb) { cb && cb() }, stop: function () {} }
  },
  event: function () {
    return function () {}
  },
}

const AccessibilityInfo = {
  isScreenReaderEnabled: function () {
    return Promise.resolve(false)
  },
  addEventListener: function () {
    return { remove: function () {} }
  },
}

module.exports = {
  StyleSheet: StyleSheet,
  View: 'View',
  Text: 'Text',
  TextInput: 'TextInput',
  TouchableOpacity: 'TouchableOpacity',
  TouchableHighlight: 'TouchableHighlight',
  TouchableWithoutFeedback: 'TouchableWithoutFeedback',
  Pressable: 'Pressable',
  ScrollView: 'ScrollView',
  FlatList: 'FlatList',
  SectionList: 'SectionList',
  Image: 'Image',
  ImageBackground: 'ImageBackground',
  ActivityIndicator: 'ActivityIndicator',
  Modal: 'Modal',
  SafeAreaView: 'SafeAreaView',
  Switch: 'Switch',
  Platform: Platform,
  Dimensions: Dimensions,
  Keyboard: Keyboard,
  Animated: Animated,
  AccessibilityInfo: AccessibilityInfo,
  Alert: { alert: function () {} },
  Linking: { openURL: function () {}, canOpenURL: function () { return Promise.resolve(false) } },
  AppState: { currentState: 'active', addEventListener: function () { return { remove: function () {} } } },
  NativeModules: {},
  NativeEventEmitter: function () {
    return {
      addListener: function () { return { remove: function () {} } },
      removeAllListeners: function () {},
    }
  },
  PixelRatio: { get: function () { return 2 }, getFontScale: function () { return 1 } },
  useColorScheme: function () { return 'dark' },
  useWindowDimensions: function () { return { width: 375, height: 812, scale: 2, fontScale: 1 } },
}
