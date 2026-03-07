# Story 1.4 : Pipeline CI/CD, Tests & Standards de Code

Status: review

## Story

En tant que développeur,
Je veux configurer GitHub Actions + Expo EAS Build et initialiser la stack de tests (Vitest + RNTL + Playwright),
Afin que chaque push déclenche la validation automatique du code et que les builds soient reproductibles.

## Acceptance Criteria

**AC1 — Workflow CI sur PR vers `main`**
- **Given** un repository GitHub configuré avec les secrets EAS et Supabase
- **When** un PR est ouvert vers `main`
- **Then** le workflow `ci.yml` exécute sans erreur : lint (ESLint + Prettier) + type-check (TypeScript) + tests unitaires (Vitest + RNTL)

**AC2 — Vitest : smoke test `@aureak/types`**
- **And** Vitest est configuré dans `packages/` avec au moins un test de smoke sur `@aureak/types` (ex: validation que les types `AttendanceStatus` exportent les valeurs attendues)

**AC3 — RNTL : smoke test `@aureak/ui`**
- **And** RNTL est installé et un test de smoke sur un composant `@aureak/ui` (ex: `IndicatorToggle` se rend sans erreur et cycle correctement)

**AC4 — Playwright : smoke test `apps/web`**
- **And** Playwright est configuré pour `apps/web` avec un test de smoke sur la page d'accueil (page charge, pas d'erreur console critique)
- **And** Playwright s'exécute sur la branche `main` uniquement (pas sur chaque PR)

**AC5 — EAS Build : profil development**
- **And** `eas build --platform all --profile development` s'exécute sans erreur sur EAS Cloud
- **And** le workflow `eas-build.yml` se déclenche automatiquement au merge vers `main`

**AC6 — Variables d'environnement**
- **And** les variables d'environnement Supabase sont injectées via EAS secrets (builds remote) et `.env.local` (dev web local)
- **And** aucune valeur de secret n'est committée dans le repo

**AC7 — Prettier configuré**
- **And** un fichier `.prettierrc.js` est présent à la racine et `turbo lint` valide le formatage

## Tasks / Subtasks

- [x] Task 1 — Configuration Prettier (AC: #7)
  - [x] 1.1 Créer `.prettierrc.js` à la racine avec les règles du projet (semi, singleQuote, trailingComma, printWidth: 100)
  - [x] 1.2 Créer `.prettierignore` (node_modules, dist, .expo, supabase/.branches)
  - [x] 1.3 Ajouter le script `"format": "prettier --write ."` dans le `package.json` racine
  - [x] 1.4 Ajouter `eslint-config-prettier` pour désactiver les règles ESLint conflictuelles avec Prettier

- [x] Task 2 — Turbo pipeline étendu (AC: #1)
  - [x] 2.1 Mettre à jour `turbo.json` pour ajouter les tâches `typecheck` et `test` dans le pipeline
  - [x] 2.2 Ajouter les scripts `"typecheck": "tsc --noEmit"` et `"test": "vitest run"` dans chaque `package.json` de package
  - [x] 2.3 Vérifier que `turbo typecheck` et `turbo test` s'exécutent correctement en local

- [x] Task 3 — Vitest configuré dans `packages/` (AC: #2)
  - [x] 3.1 Installer Vitest dans les packages qui en ont besoin (`packages/types`, `packages/ui`)
  - [x] 3.2 Créer `vitest.config.ts` à la racine + configs par package
  - [x] 3.3 Créer `packages/types/src/enums.test.ts` — test de smoke vérifiant AttendanceStatus, EvaluationSignal, UserRole
  - [x] 3.4 `vitest run` dans `packages/types` passe (3 tests ✓)

- [x] Task 4 — RNTL configuré dans `packages/ui` (AC: #3)
  - [x] 4.1 Installer `@testing-library/react-native` et `react-test-renderer@19.2.4` dans `packages/ui`
  - [x] 4.2 Configurer le setup RNTL via `__mocks__/react-native.js` (JS pur, pas de Flow) + Module._load override dans setup file
  - [x] 4.3 Créer `IndicatorToggle.test.tsx` : 5 tests (rendu, cycle none→positive→attention→none, jamais absent, disabled)
  - [x] 4.4 Créer `StarToggle.test.tsx` : 5 tests (rendu false/true, onChange true/false, disabled)
  - [x] 4.5 `vitest run` dans `packages/ui` passe (10 tests ✓)

- [x] Task 5 — Playwright configuré pour `apps/web` (AC: #4)
  - [x] 5.1 Installer `@playwright/test` + `wait-on` dans `apps/web` (devDependencies)
  - [x] 5.2 Créer `apps/web/playwright.config.ts` : baseURL `http://localhost:8081`, project Chromium
  - [x] 5.3 Créer `apps/web/e2e/smoke.spec.ts` : page d'accueil + design-system smoke
  - [ ] 5.4 Vérifier que `playwright test` passe en local (requiert `expo start --web` actif)

- [x] Task 6 — Maestro : smoke test mobile (référence, pas en CI PR) (AC: #5)
  - [x] 6.2 Créer `apps/mobile/e2e/smoke.yaml` — test de smoke minimaliste
  - [x] 6.3 Documenter dans `README.md` comment lancer Maestro localement

- [x] Task 7 — EAS Build configuré (AC: #5, #6)
  - [x] 7.1 Créer `eas.json` à la racine avec les profils `development`, `preview`, `production`
  - [ ] 7.2 Configurer `owner` EAS dans app.json (requiert compte EAS actif)
  - [ ] 7.3 Exécuter `eas build --platform all --profile development` (requiert compte EAS + secrets)
  - [ ] 7.4 Configurer les EAS secrets via `eas secret:create` (requiert compte EAS)
  - [x] 7.5 `.env.local` (gitignored) documenté via `.env.example`

- [x] Task 8 — Workflow GitHub Actions `ci.yml` (AC: #1)
  - [x] 8.1 Créer `.github/workflows/ci.yml` avec les jobs : `lint`, `typecheck`, `test`
  - [x] 8.2 Cache Yarn + Turbo configurés dans le workflow
  - [x] 8.3 Injection `SUPABASE_URL` et `SUPABASE_ANON_KEY` depuis GitHub Secrets
  - [ ] 8.4 Vérifier sur un PR réel (requiert repo GitHub configuré)

- [x] Task 9 — Workflow GitHub Actions `eas-build.yml` (AC: #5)
  - [x] 9.1 Créer `.github/workflows/eas-build.yml` déclenchement `push: branches: [main]`
  - [x] 9.2 Job Playwright E2E web dans `eas-build.yml`
  - [x] 9.3 `expo/expo-github-action@v8` pour l'auth EAS

## Dev Notes

### Workflow `ci.yml` — structure complète

```yaml
# .github/workflows/ci.yml
name: CI

on:
  pull_request:
    branches: [main]

jobs:
  lint:
    name: Lint & Format
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version-file: .nvmrc
          cache: yarn
      - run: corepack enable
      - run: yarn install --immutable
      - run: yarn turbo lint

  typecheck:
    name: Type Check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version-file: .nvmrc
          cache: yarn
      - run: corepack enable
      - run: yarn install --immutable
      - run: yarn turbo typecheck

  test:
    name: Unit & Component Tests
    runs-on: ubuntu-latest
    env:
      SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
      SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version-file: .nvmrc
          cache: yarn
      - run: corepack enable
      - run: yarn install --immutable
      - run: yarn turbo test
```

### Workflow `eas-build.yml` — structure complète

```yaml
# .github/workflows/eas-build.yml
name: EAS Build + E2E

on:
  push:
    branches: [main]

jobs:
  eas-build:
    name: EAS Build (development)
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version-file: .nvmrc
          cache: yarn
      - run: corepack enable
      - run: yarn install --immutable
      - uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}
      - run: eas build --platform all --profile development --non-interactive

  playwright-e2e:
    name: Playwright E2E (web)
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: apps/web
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version-file: .nvmrc
          cache: yarn
      - run: corepack enable
      - run: yarn install --immutable
      - run: npx playwright install --with-deps chromium
      - run: yarn expo start --web &
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
      - run: npx wait-on http://localhost:8081 --timeout 60000
      - run: npx playwright test
```

### `eas.json` — structure des profils

```json
{
  "cli": { "version": ">= 10.0.0" },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "env": {
        "APP_ENV": "development"
      }
    },
    "preview": {
      "distribution": "internal",
      "env": {
        "APP_ENV": "preview"
      }
    },
    "production": {
      "autoIncrement": true,
      "env": {
        "APP_ENV": "production"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

**Secrets EAS à configurer :**
```bash
eas secret:create --scope project --name SUPABASE_URL --value "https://..."
eas secret:create --scope project --name SUPABASE_ANON_KEY --value "eyJ..."
```

### `turbo.json` étendu — pipeline complet

```json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".expo/**"]
    },
    "lint": {
      "dependsOn": []
    },
    "typecheck": {
      "dependsOn": ["^build"]
    },
    "test": {
      "dependsOn": ["^build"],
      "env": ["SUPABASE_URL", "SUPABASE_ANON_KEY"]
    }
  }
}
```

### Vitest — configuration globale

```typescript
// vitest.config.ts (racine)
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',  // 'jsdom' pour les packages UI si nécessaire
    include: ['packages/*/src/**/*.test.ts', 'packages/*/src/**/*.test.tsx'],
  },
})
```

### Smoke test `@aureak/types` — exemple complet

```typescript
// packages/types/src/enums.test.ts
import { describe, it, expect } from 'vitest'
import type { AttendanceStatus, EvaluationSignal, UserRole } from './enums'

const ATTENDANCE_VALUES: AttendanceStatus[] = ['present','absent','injured','late','trial']
const EVALUATION_VALUES: EvaluationSignal[] = ['positive','attention','none']
const USER_ROLE_VALUES: UserRole[] = ['admin','coach','parent','child']

describe('@aureak/types — enums', () => {
  it('AttendanceStatus couvre les 5 valeurs exactes', () => {
    expect(ATTENDANCE_VALUES).toHaveLength(5)
    expect(ATTENDANCE_VALUES).toContain('present')
    expect(ATTENDANCE_VALUES).toContain('trial')
    expect(ATTENDANCE_VALUES).not.toContain('unknown')
  })

  it('EvaluationSignal ne contient pas "absent" (rouge interdit en évaluation)', () => {
    expect(EVALUATION_VALUES).not.toContain('absent')
    expect(EVALUATION_VALUES).toHaveLength(3)
  })

  it('UserRole couvre les 4 rôles MVP', () => {
    expect(USER_ROLE_VALUES).toHaveLength(4)
    USER_ROLE_VALUES.forEach(role => expect(typeof role).toBe('string'))
  })
})
```

### Smoke test RNTL `IndicatorToggle` — exemple

```typescript
// packages/ui/src/components/IndicatorToggle/IndicatorToggle.test.tsx
import { render, fireEvent } from '@testing-library/react-native'
import { IndicatorToggle } from './IndicatorToggle'

// Wrapper minimal TamaguiProvider pour les tests
const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <TamaguiProvider config={tamaguiConfig}>{children}</TamaguiProvider>
)

describe('IndicatorToggle', () => {
  it('se rend sans erreur avec value="none"', () => {
    const { toJSON } = render(
      <IndicatorToggle value="none" onChange={() => {}} />,
      { wrapper: Wrapper }
    )
    expect(toJSON()).toBeTruthy()
  })

  it('cycle : none → positive au premier tap', () => {
    const onChange = vi.fn()
    const { getByRole } = render(
      <IndicatorToggle value="none" onChange={onChange} />,
      { wrapper: Wrapper }
    )
    fireEvent.press(getByRole('button'))
    expect(onChange).toHaveBeenCalledWith('positive')
  })

  it('cycle : positive → attention au deuxième tap', () => {
    const onChange = vi.fn()
    const { getByRole } = render(
      <IndicatorToggle value="positive" onChange={onChange} />,
      { wrapper: Wrapper }
    )
    fireEvent.press(getByRole('button'))
    expect(onChange).toHaveBeenCalledWith('attention')
  })

  it('ne retourne jamais "absent" (rouge interdit en évaluation)', () => {
    const onChange = vi.fn()
    const { getByRole } = render(
      <IndicatorToggle value="attention" onChange={onChange} />,
      { wrapper: Wrapper }
    )
    // Tap : attention → none (pas absent)
    fireEvent.press(getByRole('button'))
    expect(onChange).not.toHaveBeenCalledWith('absent')
    expect(onChange).toHaveBeenCalledWith('none')
  })
})
```

### `.prettierrc.js` — configuration standard

```javascript
// .prettierrc.js
module.exports = {
  semi: false,
  singleQuote: true,
  trailingComma: 'es5',
  printWidth: 100,
  tabWidth: 2,
  bracketSpacing: true,
  arrowParens: 'always',
  // React Native / JSX
  jsxSingleQuote: false,
}
```

### GitHub Secrets à configurer

| Secret | Utilisation |
|---|---|
| `SUPABASE_URL` | Tests unitaires + Playwright |
| `SUPABASE_ANON_KEY` | Tests unitaires + Playwright |
| `EXPO_TOKEN` | Auth EAS Build dans `eas-build.yml` — générer via `expo login` + `eas whoami --token` |

### Stratégie CI par branche — récapitulatif

| Job | PR → main | Merge main |
|---|---|---|
| ESLint + Prettier | ✅ | ✅ |
| TypeScript `--noEmit` | ✅ | ✅ |
| Vitest (packages/) | ✅ | ✅ |
| RNTL (packages/ui) | ✅ | ✅ |
| Playwright (apps/web) | ❌ | ✅ |
| Maestro (apps/mobile) | ❌ local seulement | ❌ local seulement |
| EAS Build development | ❌ | ✅ |

### Pièges courants à éviter

1. **Ne pas mettre Playwright dans le workflow PR** — l'app web doit être lancée pour les tests E2E, ce qui est trop lent pour la CI de PR. Uniquement sur `main`
2. **Ne pas committer `.env.local`** — ajouter `.env.local` à `.gitignore` si ce n'est pas déjà fait
3. **EXPO_TOKEN ≠ SUPABASE_ANON_KEY** — deux secrets distincts dans GitHub et EAS : les secrets EAS (`eas secret:create`) sont pour les builds mobile, les secrets GitHub sont pour la CI
4. **`--immutable` dans CI** — toujours utiliser `yarn install --immutable` dans les workflows pour garantir que le `yarn.lock` n'est pas modifié silencieusement en CI
5. **Tamagui Provider dans les tests RNTL** — les tests qui rendent des composants Tamagui nécessitent un wrapper `TamaguiProvider` sinon les tokens `$` génèrent des erreurs
6. **`vitest run` vs `vitest`** — utiliser `vitest run` (non-watch) dans la CI, pas `vitest` (mode watch interactif)
7. **`wait-on`** avant Playwright — s'assurer que le serveur web est prêt avant de lancer les tests E2E (voir `wait-on` dans le workflow)
8. **Maestro non installé en CI** — le CLI Maestro ne se lance pas facilement dans GitHub Actions (requiert simulateur iOS ou émulateur Android actif). Documenter son usage en local uniquement

### Project Structure Notes

Fichiers créés par cette story :
```
.github/
└── workflows/
    ├── ci.yml           # lint + typecheck + test sur PR
    └── eas-build.yml    # EAS build + Playwright sur merge main

.prettierrc.js           # config Prettier
.prettierignore

eas.json                 # profils EAS build (dev/preview/prod)

vitest.config.ts         # config globale Vitest (racine)

packages/types/src/
└── enums.test.ts        # smoke test types

packages/ui/src/components/
├── IndicatorToggle/
│   └── IndicatorToggle.test.tsx  # smoke test RNTL
└── StarToggle/
    └── StarToggle.test.tsx

apps/web/
├── playwright.config.ts
└── e2e/
    └── smoke.spec.ts    # smoke test web

apps/mobile/
└── e2e/
    └── smoke.yaml       # Maestro smoke test (local uniquement)
```

### Dépendances de cette story

- **Prérequis** : Story 1.1 (monorepo + ESLint) + Story 1.2 (types enums) + Story 1.3 (composants UI pour RNTL)
- **Cette story clôture l'Epic 1** — après validation, le développement des features peut commencer (Epic 2)

### References

- [Source: architecture.md#CI/CD-GitHub-Actions] — Décision CI/CD (lignes 280-282)
- [Source: architecture.md#Stratégie-de-tests] — Tableau outils/couches/localisation (lignes 1217-1226)
- [Source: architecture.md#Source-Tree-Complet] — `.github/workflows/` (lignes 643-646)
- [Source: epics.md#Story-1.4] — Acceptance Criteria originaux (lignes 700-716)

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- react-native/index.js contient de la syntaxe Flow (`import typeof * as X from '...'`) qui n'est pas parseable par esbuild (Vitest) ni par Rollup/Vite SSR. Solution : `__mocks__/react-native.js` (JS pur CJS) + `Module._load` override dans vitest.setup.ts pour les requires CJS natifs (RNTL) + `resolve.alias` regex pour les transforms Vite des fichiers projet.
- RNTL v13 : `getByRole('button')` requiert `accessible={true}` explicite sur les composants mockés (string host components). Le vrai TouchableOpacity est accessible par défaut mais pas le mock.
- Vitest 2.x : `server.deps.inline` pour RNTL déclenche le SSR transform → résolution de react-native → Flow error. Solution : ne pas inline RNTL, utiliser Module._load.
- react-test-renderer doit matcher la version React installée (19.2.4, pas 19.0.0).

### Completion Notes List

- turbo test 7/7, turbo lint 8/8, 13 tests verts (3 types + 10 ui)
- Validations manuelles requises : `eas build`, Playwright E2E (nécessitent expo server actif), configuration GitHub Secrets, configuration owner EAS dans app.json
- Le warning `react-test-renderer is deprecated` est normal avec React 19, pas une erreur

### File List

- `.prettierrc.js`
- `.prettierignore`
- `vitest.config.ts` (root)
- `README.md`
- `eas.json`
- `turbo.json` (modifié: env field)
- `package.json` (modifié: format script, eslint-config-prettier, prettier, vitest)
- `.eslintrc.js` (modifié: prettier extension)
- `.github/workflows/ci.yml`
- `.github/workflows/eas-build.yml`
- `apps/web/package.json` (modifié: @playwright/test, wait-on)
- `apps/web/playwright.config.ts`
- `apps/web/e2e/smoke.spec.ts`
- `apps/mobile/e2e/smoke.yaml`
- `packages/types/package.json` (modifié: test script, vitest)
- `packages/types/vitest.config.ts`
- `packages/types/src/enums.test.ts`
- `packages/ui/package.json` (modifié: test script, vitest, RNTL, react-test-renderer)
- `packages/ui/vitest.config.ts`
- `packages/ui/vitest.setup.ts`
- `packages/ui/__mocks__/react-native.js`
- `packages/ui/src/components/IndicatorToggle/IndicatorToggle.tsx` (modifié: accessible={true})
- `packages/ui/src/components/IndicatorToggle/IndicatorToggle.test.tsx`
- `packages/ui/src/components/StarToggle/StarToggle.tsx` (modifié: accessible={true})
- `packages/ui/src/components/StarToggle/StarToggle.test.tsx`
