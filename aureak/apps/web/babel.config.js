// Plugin inline : remplace `import.meta.url` par '' au build (yoga-wasm-web
// utilisé par @react-pdf/renderer en a, ce qui casse le bundle web non-module).
// Story 110.11 — fix bundle SyntaxError "Cannot use import.meta outside a module"
const replaceImportMetaUrl = () => ({
  visitor: {
    MemberExpression(path) {
      const obj = path.node.object
      const prop = path.node.property
      if (
        obj && obj.type === 'MetaProperty' &&
        obj.meta && obj.meta.name === 'import' &&
        obj.property && obj.property.name === 'meta' &&
        prop && prop.name === 'url'
      ) {
        path.replaceWith({ type: 'StringLiteral', value: '' })
      }
    },
  },
})

module.exports = (api) => {
  api.cache(true)
  return {
    presets: [['babel-preset-expo', { jsxRuntime: 'automatic' }]],
    plugins: [
      replaceImportMetaUrl,
      [
        '@tamagui/babel-plugin',
        {
          components: ['tamagui', '@aureak/ui'],
          config: '../../packages/theme/src/tamagui.config.ts',
          logTimings: true,
          disableExtraction: process.env.NODE_ENV === 'development',
        },
      ],
    ],
  }
}
