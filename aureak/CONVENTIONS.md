# Conventions de développement — Aureak Monorepo

## Règles d'import obligatoires

### 1. Accès à Supabase (ARCH-10)
- **INTERDIT** d'importer `@supabase/supabase-js` ou tout package `@supabase/*` directement dans les apps ou packages.
- **AUTORISÉ** uniquement dans `packages/api-client` et `packages/media-client`.
- Toute logique Supabase passe **exclusivement** par `@aureak/api-client`.

```typescript
// ❌ INTERDIT partout sauf packages/api-client et packages/media-client
import { createClient } from '@supabase/supabase-js'

// ✅ Correct — utiliser le client Aureak
import { supabase } from '@aureak/api-client'
```

### 2. Import de @aureak/media-client (Phase 1 — INTERDIT dans les apps)
- En Phase 1, `@aureak/media-client` est un **stub vide** (Phase 2 — video pipeline).
- **INTERDIT** d'importer `@aureak/media-client` dans `apps/mobile` et `apps/web` en Phase 1.
- Cette restriction est enforced par ESLint (`no-restricted-imports`).

### 3. Couleurs hardcodées (ARCH-10)
- **INTERDIT** d'utiliser des valeurs hex (`#RRGGBB`) directement dans JSX/TSX.
- Toujours utiliser les tokens de `packages/theme/tokens.ts`.

```tsx
// ❌ INTERDIT
<View style={{ backgroundColor: '#1A1A2E' }} />

// ✅ Correct
import { tokens } from '@aureak/theme'
<View style={{ backgroundColor: tokens.color.backgroundPrimary }} />
```

## Conventions de nommage

### Types TypeScript
- **camelCase** dans tous les types TypeScript et interfaces.
- Conversion `snake_case → camelCase` **uniquement** dans `packages/api-client/src/transforms.ts`.

```typescript
// ❌ Jamais en TypeScript
type session_data = { created_at: string }

// ✅ Correct en TypeScript
type SessionData = { createdAt: string }
```

### Base de données (Supabase / PostgreSQL)
- **snake_case** exclusivement dans la DB (colonnes, tables, fonctions).
- La transformation camelCase → snake_case se fait dans `@aureak/api-client`.

## Règles de soft-delete
- Toutes les entités supportent le soft-delete via `deleted_at: timestamp | null`.
- La suppression dure (hard delete) est **réservée** aux jobs RGPD uniquement.
- Ne jamais faire de `DELETE` SQL direct sauf dans les migrations RGPD dédiées.

## Package Manager
- **Yarn 4.4.0+** via corepack exclusivement.
- Ne jamais utiliser `npm`, `pnpm`, ou `bun` dans ce monorepo.
- `corepack enable && corepack prepare yarn@stable --activate`

## Architecture des packages
- `@aureak/types` — Interfaces TypeScript partagées (pas de logique)
- `@aureak/theme` — Design tokens et configuration Tamagui
- `@aureak/ui` — Composants UI réutilisables (utilise @aureak/theme)
- `@aureak/api-client` — **Seul point d'accès** à Supabase
- `@aureak/media-client` — Stub Phase 2 (vidéo / storage)
- `@aureak/business-logic` — Logique métier pure (sans effets de bord UI)
