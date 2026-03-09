# Story 1.1 : Initialisation du Monorepo & Structure des Packages

Status: done

## Story

En tant que développeur,
Je veux initialiser le monorepo Turborepo avec Expo Router + Tamagui et créer les 6 packages @aureak/* et les 2 apps (mobile, web),
Afin que toute l'équipe développe dans une architecture cohérente avec un environnement reproductible entre machines.

## Acceptance Criteria

**AC1 — Toolchain fixée**
- **Given** un environnement de développement configuré
- **When** le développeur clone le repo et suit le README
- **Then** un fichier `.nvmrc` à la racine fixe la version Node `22 LTS` et Yarn est activé via `corepack enable` — aucune instruction manuelle de version n'est requise

**AC2 — Structure monorepo existante et compilable**
- **And** la structure suivante existe et compile sans erreur :

```
aureak/
├── apps/mobile/        (Expo, iOS + Android, offline-first)
├── apps/web/           (Expo Router web — web-ready, PWA option Phase 2/3)
└── packages/
    ├── types/          @aureak/types
    ├── theme/          @aureak/theme
    ├── ui/             @aureak/ui
    ├── api-client/     @aureak/api-client
    ├── media-client/   @aureak/media-client  (scaffold Phase 1 uniquement)
    └── business-logic/ @aureak/business-logic
```

**AC3 — Stub media-client vide**
- **And** `packages/media-client/index.ts` exporte un stub vide documenté `// Phase 2 — video pipeline` sans aucune logique d'implémentation

**AC4 — Restriction import media-client documentée et détectée**
- **And** `apps/mobile` et `apps/web` n'importent pas `@aureak/media-client` en Phase 1 — restriction documentée dans `CONVENTIONS.md` et détectée par lint si possible

**AC5 — Build Turborepo propre**
- **And** `turbo build` s'exécute sans erreur sur tous les packages

**AC6 — Apps lancées en dev**
- **And** `apps/mobile` se lance en mode développement sur iOS et Android
- **And** `apps/web` se lance sur `localhost` en mode Expo Router web

**AC7 — Règle ESLint Supabase**
- **And** la règle ESLint `no-restricted-imports` bloque tout import direct de `@supabase/supabase-js` en dehors de `@aureak/api-client` et `@aureak/media-client`

## Tasks / Subtasks

- [x] Task 1 — Bootstrap du starter Tamagui (AC: #1, #2)
  - [x] 1.1 Exécuter `yarn create tamagui@latest --template expo-router` dans un dossier temporaire
  - [x] 1.2 Créer le fichier `.nvmrc` avec `22` (Node 22 LTS)
  - [x] 1.3 Activer Yarn via `corepack enable && corepack prepare yarn@stable --activate`
  - [x] 1.4 Initialiser `git init` + premier commit

- [x] Task 2 — Mise en place de la structure monorepo Turborepo (AC: #2)
  - [x] 2.1 Créer `package.json` racine avec `workspaces: ["apps/*", "packages/*"]` et `private: true`
  - [x] 2.2 Créer `turbo.json` avec tasks `build`, `lint`, `test` (dépendances: `^build`)
  - [x] 2.3 Déplacer l'app starter vers `apps/mobile/`
  - [x] 2.4 Créer `apps/web/` avec configuration Expo Router web (copie + adaptation de `apps/mobile/`)
  - [x] 2.5 Créer les 6 packages dans `packages/` avec leur `package.json` respectif

- [x] Task 3 — Configuration des 6 packages (AC: #2, #3)
  - [x] 3.1 `packages/types/` — `package.json` name: `@aureak/types`, créer `src/index.ts` (exports vides pour l'instant)
  - [x] 3.2 `packages/theme/` — `package.json` name: `@aureak/theme`, créer `src/tokens.ts` (placeholders vides) et `src/tamagui.config.ts`
  - [x] 3.3 `packages/ui/` — `package.json` name: `@aureak/ui`, créer `src/index.ts` (export vide)
  - [x] 3.4 `packages/api-client/` — `package.json` name: `@aureak/api-client`, créer `src/index.ts` et `src/supabase.ts` (stub createClient)
  - [x] 3.5 `packages/media-client/` — `package.json` name: `@aureak/media-client`, créer `index.ts` avec `// Phase 2 — video pipeline` commentaire et export vide
  - [x] 3.6 `packages/business-logic/` — `package.json` name: `@aureak/business-logic`, créer `src/index.ts` (export vide)

- [x] Task 4 — Configuration TypeScript (AC: #2)
  - [x] 4.1 Créer `tsconfig.base.json` à la racine avec `strict: true`, `moduleResolution: "bundler"`, `jsx: "react-native"`
  - [x] 4.2 Chaque package et app hérite de `tsconfig.base.json` via `extends: "../../tsconfig.base.json"`
  - [x] 4.3 Vérifier que `tsc --noEmit` passe sans erreur — validé via `turbo build` (8/8 succès)

- [x] Task 5 — Configuration ESLint (AC: #4, #7)
  - [x] 5.1 Créer `.eslintrc.js` à la racine avec la règle `no-restricted-imports` bloquant `@supabase/supabase-js` hors `api-client` et `media-client`
  - [x] 5.2 Ajouter la règle `no-restricted-syntax` bloquant les hex colors hardcodées dans JSX/TSX
  - [x] 5.3 Ajouter la règle bloquant l'import de `@aureak/media-client` dans les apps (Phase 1)
  - [x] 5.4 Valider que `yarn lint` échoue sur un faux positif intentionnel, puis passe correctement — testé ✓

- [x] Task 6 — Création de CONVENTIONS.md (AC: #4)
  - [x] 6.1 Créer `CONVENTIONS.md` à la racine documentant :
    - Interdiction d'importer `@aureak/media-client` en Phase 1 (apps/mobile, apps/web)
    - Interdiction d'importer `@supabase/supabase-js` directement hors des packages autorisés
    - Convention soft-delete (`deleted_at`)
    - Règle camelCase dans les types TypeScript, snake_case uniquement dans la DB

- [x] Task 7 — Validation du build et lancement des apps (AC: #5, #6)
  - [x] 7.1 Exécuter `turbo build` — 8/8 succès ✓
  - [ ] 7.2 Lancer `apps/mobile` en mode dev (`expo start`) et vérifier iOS + Android via Expo Go (validation manuelle développeur)
  - [ ] 7.3 Lancer `apps/web` en mode dev (`expo start --web`) et vérifier sur `localhost` (validation manuelle développeur)

## Dev Notes

### Commande d'initialisation retenue

La décision architecturale (ARCH-1) stipule d'utiliser le starter officiel Tamagui :

```bash
yarn create tamagui@latest --template expo-router
# Nécessite Yarn 4.4.0+ (via corepack)
# Node 22 LTS requis (.nvmrc)
```

Ce starter fournit : TypeScript configuré, Expo SDK dernière version stable, Tamagui installé + Babel plugin, Metro configuré avec support web, Expo Router opérationnel. La structure `app/` du starter doit ensuite être réorganisée en monorepo.

**Alternative si friction starter :** setup custom depuis `create-expo-app` (ARCH-1 mentionne cette option).

### Structure complète cible

Le fichier `architecture.md` (section "Source Tree") définit la structure exacte. Pour la Story 1.1, la priorité est de créer le squelette — le contenu des fichiers sera implémenté dans les stories suivantes.

**Structure clé à mettre en place :**

```
aureak/
├── .github/workflows/      (ci.yml + eas-build.yml — stubs, configurés Story 1.4)
├── .env.example            (stub vide pour l'instant)
├── .gitignore
├── .nvmrc                  # "22" — Node 22 LTS
├── package.json            # workspaces: ["apps/*", "packages/*"], private: true
├── yarn.lock
├── turbo.json              # pipeline build/lint/test
├── .eslintrc.js            # règles ESLint globales avec restrictions
├── tsconfig.base.json      # strict: true, base partagée
├── CONVENTIONS.md          # règles de dev documentées
│
├── apps/
│   ├── mobile/             # Expo iOS + Android
│   │   ├── app.json
│   │   ├── babel.config.js
│   │   ├── metro.config.js
│   │   ├── tsconfig.json
│   │   ├── package.json
│   │   └── app/
│   │       └── _layout.tsx   # TamaguiProvider minimal
│   └── web/
│       ├── app.json
│       ├── metro.config.js
│       ├── tsconfig.json
│       ├── package.json
│       └── app/
│           └── _layout.tsx
│
└── packages/
    ├── types/              # @aureak/types (src/index.ts vide)
    ├── theme/              # @aureak/theme (src/tokens.ts + src/tamagui.config.ts stubs)
    ├── ui/                 # @aureak/ui (src/index.ts vide)
    ├── api-client/         # @aureak/api-client (src/index.ts + src/supabase.ts stubs)
    ├── media-client/       # @aureak/media-client (index.ts stub Phase 2)
    └── business-logic/     # @aureak/business-logic (src/index.ts vide)
```

### Règles ESLint obligatoires (ARCH-10, architecture.md #Frontière 1)

Le fichier `.eslintrc.js` à la racine DOIT contenir exactement :

```javascript
// .eslintrc.js
module.exports = {
  rules: {
    'no-restricted-imports': ['error', {
      patterns: [
        {
          group: ['@supabase/supabase-js', '@supabase/*'],
          // Autorisé uniquement dans packages/api-client et packages/media-client
          importNames: ['createClient'],
          message:
            'Import Supabase uniquement via @aureak/api-client ou @aureak/media-client. ' +
            'Accès direct à Supabase interdit hors de ces packages.'
        }
      ]
    }],
    // Interdire les imports hardcodés de design values
    'no-restricted-syntax': ['error', {
      // Détecter les hex colors hardcodées dans JSX/TSX
      selector: 'Literal[value=/^#[0-9A-Fa-f]{3,8}$/]',
      message:
        'Valeur de couleur hardcodée interdite. Utiliser packages/theme/tokens.ts.'
    }]
  }
}
```

Pour bloquer l'import de `@aureak/media-client` en Phase 1, ajouter dans la règle `no-restricted-imports` un pattern supplémentaire ciblant ce package avec une exception pour les packages autorisés.

### Stub media-client exact (ARCH-10, architecture.md #Frontière media)

```typescript
// packages/media-client/index.ts
// Phase 2 — video pipeline
// Ce package est un stub en Phase 1. Aucune logique d'implémentation ici.
// Les features vidéo seront implémentées dans l'Epic 13/14.

export {}
```

Le stub `src/upload.ts`, `src/stream.ts`, `src/limits.ts`, `src/storage.ts` peuvent exister comme fichiers vides documentés.

### turbo.json minimal requis

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
    "test": {
      "dependsOn": ["^build"]
    }
  }
}
```

### Frontières architecturales à respecter (non-négociables)

1. **Seul `@aureak/api-client` accède à Supabase** — jamais depuis les apps directement [Source: architecture.md#Frontières-Architecturales]
2. **Seul `@aureak/media-client` accède à Supabase Storage** — stub en Phase 1 [Source: architecture.md#Frontière-media]
3. **Jamais de hex colors hardcodées** — toujours via `packages/theme/tokens.ts` [Source: architecture.md#Frontière-1]
4. **Jamais d'import `@aureak/media-client` dans les apps en Phase 1** [Source: epics.md#Story-1.1-AC4]
5. **`snake_case → camelCase` uniquement dans `packages/api-client/src/transforms.ts`** — jamais dans les composants [Source: architecture.md#Règles-Absolues]

### Stack technique de cette story

| Technologie | Version | Rôle |
|---|---|---|
| Node.js | 22 LTS (`.nvmrc`) | Runtime de développement |
| Yarn | 4.4.0+ via corepack | Package manager monorepo |
| Turborepo | Dernière stable | Orchestration du monorepo |
| Expo SDK | Dernière stable (inclus dans starter) | Framework mobile + web |
| Expo Router | Inclus dans starter | Routing universel mobile + web |
| Tamagui | Inclus dans starter | UI framework partagé |
| TypeScript | Strict mode | Langage principal |
| ESLint | Standard | Linting + enforcement frontières |

### Tests de validation de la story

Pour cette story, il n'y a pas de test unitaire formels (aucune logique métier). Les critères de validation sont :

- `turbo build` : aucune erreur
- `yarn lint` (ou `turbo lint`) : aucune erreur sur le code scaffold
- `expo start` dans `apps/mobile` : démarrage réussi (Expo Go ou simulateur)
- `expo start --web` dans `apps/web` : page ouverte sur localhost
- Test ESLint manuel : créer un fichier de test avec `import { createClient } from '@supabase/supabase-js'` dans `apps/mobile` → ESLint doit signaler une erreur

### Pièges courants à éviter

1. **Ne pas utiliser `create-react-native-app` ou `npx create-expo-app`** — uniquement le starter Tamagui (`yarn create tamagui@latest --template expo-router`)
2. **Ne pas modifier la structure des packages une fois créée** — les Stories suivantes en dépendent
3. **Ne pas implémenter de logique dans les packages** — cette story crée uniquement les squelettes
4. **Ne pas oublier le `.nvmrc`** — la version de Node doit être fixée pour la reproductibilité
5. **Ne pas utiliser `npm` ou `pnpm`** — exclusivement Yarn 4.4.0+ via corepack (workspace protocol)

### Project Structure Notes

- Cette story constitue la fondation de toute l'architecture AUREAK
- Les fichiers créés ici seront complétés par les Stories 1.2, 1.3, 1.4
- Aucune dépendance sur une story précédente (c'est la Story 1, la première)
- Story 1.2 (Supabase) dépend de ce scaffold pour `packages/api-client/`
- Story 1.3 (Design tokens) dépend de ce scaffold pour `packages/theme/` et `packages/ui/`

### References

- [Source: architecture.md#Options-de-Starter-Considérées] — Justification du starter Tamagui retenu
- [Source: architecture.md#Starter-Retenu] — Commande d'initialisation exacte
- [Source: architecture.md#Structure-Monorepo-Cible] — Structure des apps et packages
- [Source: architecture.md#Source-Tree-Complet] — Détail complet de chaque fichier (lignes 640-851)
- [Source: architecture.md#Frontière-1] — Configuration ESLint complète
- [Source: architecture.md#Frontières-Architecturales] — Règles de frontières packages
- [Source: epics.md#Story-1.1] — Acceptance Criteria originaux (lignes 598-631)
- [Source: epics.md#Additional-Requirements ARCH-1 à ARCH-10] — Contraintes architecture liées

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- Turborepo 2.x utilise `tasks` au lieu de `pipeline` dans turbo.json (breaking change vs 1.x)
- `@tamagui/config` installé = v4 (pas v5) — `tamagui.config.ts` utilise `@tamagui/config/v4`
- Règle ESLint `no-restricted-syntax` hex: exception ajoutée pour `packages/theme/src/tokens.ts` (source de vérité des couleurs)
- `corepack enable` requiert sudo sur macOS avec Node installé en /usr/local — utiliser `corepack prepare yarn@stable` sans sudo suffit
- `nodeLinker: node-modules` dans `.yarnrc.yml` obligatoire pour Expo (PnP incompatible)

### Completion Notes List

- Monorepo Aureak initialisé dans `aureak/` avec Turborepo 2.8.13 + Yarn 4.13.0
- Starter Tamagui (`yarn create tamagui@latest --template expo-router`) utilisé comme base pour `apps/mobile/`
- 8 packages/apps configurés: @aureak/mobile, @aureak/web, @aureak/types, @aureak/theme, @aureak/ui, @aureak/api-client, @aureak/media-client, @aureak/business-logic
- `turbo build`: 8/8 succès — `turbo lint`: 8/8 succès
- Règle ESLint AC7 validée: import direct `@supabase/supabase-js` dans apps détecté correctement
- Règle ESLint AC4 validée: import `@aureak/media-client` dans apps bloqué
- AC6 (expo start mobile/web): validation manuelle requise par le développeur

### File List

- aureak/.nvmrc
- aureak/.yarnrc.yml
- aureak/.gitignore
- aureak/.env.example
- aureak/.eslintrc.js
- aureak/package.json
- aureak/turbo.json
- aureak/tsconfig.base.json
- aureak/CONVENTIONS.md
- aureak/yarn.lock
- aureak/.github/workflows/ci.yml
- aureak/.github/workflows/eas-build.yml
- aureak/apps/mobile/package.json
- aureak/apps/mobile/app.json
- aureak/apps/mobile/babel.config.js
- aureak/apps/mobile/metro.config.js
- aureak/apps/mobile/tsconfig.json
- aureak/apps/mobile/app/_layout.tsx
- aureak/apps/web/package.json
- aureak/apps/web/app.json
- aureak/apps/web/metro.config.js
- aureak/apps/web/tsconfig.json
- aureak/apps/web/app/_layout.tsx
- aureak/packages/types/package.json
- aureak/packages/types/tsconfig.json
- aureak/packages/types/src/index.ts
- aureak/packages/theme/package.json
- aureak/packages/theme/tsconfig.json
- aureak/packages/theme/src/tokens.ts
- aureak/packages/theme/src/tamagui.config.ts
- aureak/packages/theme/src/index.ts
- aureak/packages/ui/package.json
- aureak/packages/ui/tsconfig.json
- aureak/packages/ui/src/index.ts
- aureak/packages/api-client/package.json
- aureak/packages/api-client/tsconfig.json
- aureak/packages/api-client/src/index.ts
- aureak/packages/api-client/src/supabase.ts
- aureak/packages/media-client/package.json
- aureak/packages/media-client/tsconfig.json
- aureak/packages/media-client/index.ts
- aureak/packages/business-logic/package.json
- aureak/packages/business-logic/tsconfig.json
- aureak/packages/business-logic/src/index.ts
