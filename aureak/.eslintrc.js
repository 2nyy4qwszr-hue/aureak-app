module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier',
  ],
  rules: {
    // AC7 — Interdit tout import direct de Supabase hors des packages autorisés
    'no-restricted-imports': ['error', {
      patterns: [
        {
          group: ['@supabase/supabase-js', '@supabase/*'],
          message:
            'Import Supabase uniquement via @aureak/api-client ou @aureak/media-client. ' +
            'Accès direct à Supabase interdit hors de ces packages.',
        },
        // AC4 — Interdit l'import de @aureak/media-client dans les apps (Phase 1)
        {
          group: ['@aureak/media-client'],
          message:
            '@aureak/media-client est un stub Phase 2. Ne pas importer dans les apps en Phase 1. ' +
            'Voir CONVENTIONS.md.',
        },
      ],
    }],
    // Interdit les hex colors hardcodées dans JSX/TSX
    'no-restricted-syntax': [
      'error',
      {
        selector: 'Literal[value=/^#[0-9A-Fa-f]{3,8}$/]',
        message:
          'Valeur de couleur hardcodée interdite. Utiliser packages/theme/tokens.ts.',
      },
    ],
  },
  overrides: [
    // Exception : @aureak/api-client et @aureak/media-client peuvent importer Supabase
    {
      files: [
        'packages/api-client/**/*.ts',
        'packages/api-client/**/*.tsx',
        'packages/media-client/**/*.ts',
        'packages/media-client/**/*.tsx',
      ],
      rules: {
        'no-restricted-imports': 'off',
      },
    },
    // Exception : packages/theme/src/tokens.ts est la source de vérité des couleurs
    // Il est le seul fichier autorisé à définir des valeurs hex brutes
    {
      files: ['packages/theme/src/tokens.ts'],
      rules: {
        'no-restricted-syntax': 'off',
      },
    },
  ],
  env: {
    node: true,
    browser: true,
  },
}
