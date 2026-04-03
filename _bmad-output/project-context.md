---
project_name: 'Application Aureak'
user_name: 'Jeremydevriendt'
date: '2026-04-04'
sections_completed: ['technology_stack', 'language_rules', 'framework_rules', 'testing_rules', 'code_quality', 'workflow_rules', 'critical_rules']
status: 'complete'
rule_count: 48
optimized_for_llm: true
---

# Project Context for AI Agents — Application Aureak

_Règles critiques que les agents IA DOIVENT suivre lors de l'implémentation. Focus sur les détails non-évidents et les contraintes spécifiques Aureak. Ne pas répéter ce qui est évident._

---

## Technology Stack & Versions

| Couche | Technologie | Version |
|--------|-------------|---------|
| Monorepo | Turborepo + Yarn workspaces | yarn 4.13.0 |
| App web | Expo Router | ~6.0.14 |
| Runtime | React / React Native / react-native-web | 19 / 0.81.5 / ^0.21.0 |
| Langage | TypeScript | ~5.9.2 (strict) |
| UI layout | Tamagui (XStack/YStack/Text) | ^2.0.0-rc.22 |
| Backend | @supabase/supabase-js | ^2.0.0 |
| Forms | React Hook Form + Zod | ^7.53.0 + ^3.23.8 |
| Tests unitaires | Vitest | ^2.0.0 |
| Tests E2E | Playwright | ^1.48.0 |

**Packages internes (workspace `aureak/`) :**
- `@aureak/types` — entités, enums, constantes (source de vérité TS)
- `@aureak/theme` — tokens design (seule source de styles autorisée)
- `@aureak/ui` — AureakButton, Card, Badge, Input, AureakText
- `@aureak/api-client` — SEUL point d'accès à Supabase
- `@aureak/business-logic` — stores Zustand, logique métier partagée

**Commandes clés :**
```bash
cd aureak && npx turbo dev --filter=web   # dev server → http://localhost:8081
cd aureak && npx tsc --noEmit             # type check
supabase start                            # depuis la RACINE du dépôt (pas depuis aureak/)
ls supabase/migrations/ | tail -5         # voir la dernière migration
```

---

## Language-Specific Rules (TypeScript)

### Conventions de nommage
- **DB** : `snake_case` pour toutes les colonnes, tables, fonctions SQL
- **TS** : `camelCase` pour toutes les propriétés des types
- **Transformation** : snake_case → camelCase UNIQUEMENT dans `@aureak/api-client/src/transforms.ts` — jamais ailleurs
- Fichiers composants : `PascalCase.tsx` | Fichiers utils/hooks : `camelCase.ts`

### Imports
- Jamais d'import direct de `@supabase/supabase-js` hors de `@aureak/api-client`
- Jamais de `process.env.SUPABASE_*` dans `apps/` — passer par `@aureak/api-client`
- Variables d'env côté Expo : préfixe `EXPO_PUBLIC_` obligatoire pour Metro bundling
- Ordre d'import recommandé : React → React Native → expo-router → @aureak/* → locaux

### TypeScript strict
- `strict: true` + `noEmit: true` (pas de compilation, uniquement type check)
- `moduleResolution: "bundler"` — ne pas utiliser `node` ou `node16`
- Pas d'`any` — utiliser `unknown` + type guards si nécessaire
- `as const` sur les objets de tokens et enums (voir `tokens.ts`)

### Async / Error handling
- **try/finally OBLIGATOIRE** sur tout setState de chargement/sauvegarde :
  ```typescript
  setSaving(true)
  try {
    await someApiCall()
  } finally {
    setSaving(false)
  }
  ```
- **Console guards OBLIGATOIRES** dans `apps/` et `@aureak/api-client` :
  ```typescript
  if (process.env.NODE_ENV !== 'production') console.error('[Component] error:', err)
  ```
- Pas de `catch(() => {})` silencieux — toujours logger en dev

---

## Framework-Specific Rules

### Expo Router (routing web SPA)
- `page.tsx` = composant réel avec le contenu (jamais accessible directement comme route)
- `index.tsx` = re-export de `./page` pour rendre la route accessible :
  ```typescript
  // aureak/apps/web/app/(admin)/ma-page/index.tsx
  export { default } from './page'
  ```
- Pour les routes dynamiques : `[param]/page.tsx` + `[param]/index.tsx` qui re-exporte
- Les groupes de routes `(admin)`, `(coach)`, `(parent)`, `(child)`, `(club)` isolent les layouts par rôle
- Navigation : `useRouter()` de `expo-router` — jamais `window.location` ou `history.push`

### React Native Web (composants UI)
- Utiliser **React Native primitives** : `View`, `Text`, `Pressable`, `ScrollView`, `TextInput`, `Image`
- **PAS** de `div`, `span`, `button`, `input` HTML — c'est du React Native rendu sur le web
- **PAS** de `className` ou CSS modules — utiliser `StyleSheet.create()` ou `style={}`
- Tamagui (`XStack`, `YStack`, `Text`, `Separator`) = réservé aux **_layout.tsx uniquement**
- `Platform.OS === 'web'` pour les adaptations web-spécifiques (ex: curseur, hover)

### Styles — Design System Light Premium
- **JAMAIS** de couleur hardcodée (`#hex`, `rgb()`) — toujours via `@aureak/theme` :
  ```typescript
  import { colors, space, shadows, radius, transitions } from '@aureak/theme'
  ```
- Fond admin web : `colors.light.primary` (#F3EFE7) — PAS `colors.background.primary` (dark)
- Cards : `colors.light.surface` (#FFFFFF) avec `shadows.sm` au repos, `shadows.md` au hover
- Accent gold : `colors.accent.gold` (#C1AC5C) — seul accent autorisé en admin
- Sidebar : fond dark `#111111` avec stripe gold 3px en haut (seul élément dark en admin)
- Hero tile dashboard : fond `#2A2827` (brun-gris chaud)
- Texte sur fond clair : `colors.text.dark` (#18181B) ou `colors.text.muted` (#71717A)
- Bordures : `colors.border.light` (#E5E7EB) standard, `colors.border.gold` pour éléments premium
- **Ombres** : utiliser la string complète (`shadows.sm`, `shadows.md`) — jamais `shadows.sm.spread`

### Supabase — Accès via api-client uniquement
- Toutes les fonctions d'accès DB sont dans `@aureak/api-client/src/`
- Signature standard des fonctions API :
  ```typescript
  // Retournent les données directement (pas { data, error })
  export async function listXxx(params): Promise<Xxx[]>
  export async function getXxx(id: string): Promise<Xxx>
  export async function createXxx(params: CreateXxxParams): Promise<Xxx>
  ```
- RLS gère l'isolation tenant — ne pas ajouter de filtre `tenant_id` manuel dans les apps
- `supabase.auth.getUser()` pour l'utilisateur courant — pas `getSession().user`

### État et navigation
- Store auth : `useAuthStore()` de `@aureak/business-logic` — jamais de state auth local
- Redirections auth : dans les layouts (`_layout.tsx`), pas dans les pages
- État de chargement : `const [loading, setLoading] = useState(false)` — un state par opération async

---

## Testing Rules

### Organisation
- Tests unitaires : colocalisés `*.test.ts(x)` ou dans `__tests__/`
- Tests E2E : `aureak/apps/web/tests/` + config `playwright.config.ts`
- Vitest globals : activés via `tsconfig.json` (`"types": ["vitest/globals"]`)

### Patterns
- **Pas de mock Supabase** — utiliser la DB locale (`supabase start`) pour les tests d'intégration
- Tester les fonctions `@aureak/api-client` avec une vraie instance Supabase locale
- Tests unitaires pour la logique pure dans `@aureak/business-logic` et `@aureak/types`
- Playwright : naviguer via les routes réelles (http://localhost:8081) — pas de mocks

### Commandes
```bash
cd aureak && npx turbo test              # tous les tests
cd aureak && npx turbo test --filter=web # tests web uniquement
cd aureak/apps/web && npx playwright test # E2E
```

---

## Code Quality & Style Rules

### Structure des fichiers
```
aureak/apps/web/app/(admin)/
  ma-feature/
    index.tsx          ← re-export de ./page (OBLIGATOIRE)
    page.tsx           ← composant principal
    _components/       ← composants locaux à la feature
    _utils.ts          ← helpers locaux
```

### Composants
- Exports : `export default` pour les pages, exports nommés pour les composants
- Un composant par fichier (sauf petits composants helpers en bas de fichier)
- Props typées explicitement — pas d'inférence depuis JSX
- `'use client'` en haut des fichiers qui utilisent des hooks React (requis par Expo Router)

### Soft-delete — règle absolue
- Jamais de `DELETE` physique sauf jobs RGPD explicites
- Toujours `UPDATE ... SET deleted_at = NOW()` ou `softDelete*()` via api-client
- Les queries de liste filtrent `deleted_at IS NULL` automatiquement côté API

### Données et types
- Dates : toujours ISO 8601 string en TS (`string`) — jamais `Date` object en types d'entités
- IDs : `string` (UUID) — jamais `number`
- Nullable en DB → `T | null` en TS (pas `T | undefined` pour les colonnes DB)
- `undefined` = valeur non fournie (paramètre optionnel) | `null` = valeur explicitement absente (DB)

---

## Development Workflow Rules

### Migrations Supabase — SOURCE DE VÉRITÉ UNIQUE
- **Dossier actif** : `supabase/migrations/` (racine du dépôt) — JAMAIS `aureak/supabase/migrations/`
- **Lancer supabase** : depuis la RACINE du dépôt — jamais depuis `aureak/`
- Numérotation : vérifier `ls supabase/migrations/ | tail -3` → incrémenter de 1
- Format : `NNNNN_description_courte.sql` (ex: `00111_player_ratings.sql`)
- Migrations **idempotentes** obligatoires :
  ```sql
  CREATE TABLE IF NOT EXISTS ...
  ALTER TABLE x ADD COLUMN IF NOT EXISTS y ...
  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'mon_enum') THEN
      CREATE TYPE mon_enum AS ENUM ('val1', 'val2');
    END IF;
  END $$;
  ```
- Pas de `DROP TABLE`, `DROP COLUMN`, `ALTER TYPE ... RENAME` — migrations non-destructives uniquement
- RLS obligatoire sur toute nouvelle table : policy `tenant_id = auth.jwt() ->> 'tenant_id'`

### Commits
- Format : `feat(epic-X): story X.Y — description courte`
- 1 commit par story (sauf migration séparée explicitement)
- Pas de `--no-verify` ni `--no-gpg-sign`

### Order d'implémentation par story (OBLIGATOIRE)
1. Migration SQL (`supabase/migrations/`)
2. Types TypeScript (`@aureak/types/src/entities.ts` ou `enums.ts`)
3. Fonctions API (`@aureak/api-client/src/`)
4. UI (`aureak/apps/web/app/`)

---

## Critical Don't-Miss Rules

### Anti-patterns BLOCKER (arrêter immédiatement si détecté)
- `import { createClient } from '@supabase/supabase-js'` hors de `@aureak/api-client` → **BLOCKER**
- `backgroundColor: '#F3EFE7'` ou toute couleur `#hex` inline dans un composant → **BLOCKER**
- `setLoading(false)` dans un `catch` sans `finally` → **BLOCKER**
- `console.log(...)` sans guard `NODE_ENV` dans `apps/` → **BLOCKER**
- Nouvelle migration dans `aureak/supabase/migrations/` → **BLOCKER** (mauvais dossier)
- `DELETE FROM` sans job RGPD explicite → **BLOCKER**

### Pièges courants
- **Routing** : oublier `index.tsx` → la route `/(admin)/ma-page` donne 404
- **Tamagui hors layout** : `XStack`/`YStack` dans une `page.tsx` → erreur runtime (provider manquant)
- **enum SQL** : `ALTER TYPE ... ADD VALUE` ne peut pas être dans une transaction → utiliser `ALTER TYPE ... ADD VALUE IF NOT EXISTS` hors transaction
- **RLS + JWT** : les claims custom (`tenant_id`, `role`) viennent du hook `custom-access-token` — ne pas lire `auth.users.raw_user_meta_data` directement
- **Sprint-status.yaml** : toujours mettre à jour `_bmad-output/implementation-artifacts/sprint-status.yaml` après chaque story implémentée
- **Types DB vs TS** : les colonnes DB `snake_case` → types TS `camelCase` — la transformation se fait UNIQUEMENT dans `@aureak/api-client/src/transforms.ts`
- **Groupes transients** : `is_transient = true` → ne jamais les exposer dans les listes UI (`listGroupsByImplantation` filtre déjà)
- **listStages** : utiliser `@aureak/api-client/src/admin/stages.ts` (retourne `StageWithMeta[]`) — la version `academyStatus.ts` est supprimée

### Sécurité
- Tenant isolation : **RLS uniquement** — ne jamais filtrer par `tenant_id` dans le code app
- JWT claims : lire via `auth.jwt() ->> 'tenant_id'` en SQL (hook `custom-access-token` requis)
- Headers custom (`x-tenant-id`) : non-autoritaires — ignorer côté server
- PII : toujours via Edge Functions pour export — jamais de select `*` sur `auth.users`

### Rôles utilisateurs (enum DB `user_role`)
```
admin | coach | parent | child | club
```
Ne pas inventer d'autres rôles. `club_partner` et `club_common` sont des niveaux d'accès (`club_access_level`), pas des rôles.

### Multi-tenant
- Chaque requête est automatiquement scopée par RLS via `tenant_id` du JWT
- Ne pas passer `tenantId` en paramètre aux fonctions API — RLS s'en charge
- Exception : les tables sans RLS (ex: `club_directory`) utilisent un filtre explicite côté API

---

## Design Rules (12 Principes — source : `_agents/design-vision.md`)

Ces règles s'appliquent à tout fichier `.tsx` admin :

1. **Fond clair** — `colors.light.primary` (#F3EFE7) ou `colors.light.surface` (#FFFFFF). Jamais fond dark hors sidebar et hero tile
2. **Profondeur** — `shadows.sm` au repos, `shadows.md` au hover. Jamais complètement flat
3. **Sidebar dark fixe** — `#111111` avec stripe gold 3px. Seul élément dark du layout admin
4. **Tokens only** — zéro couleur hardcodée dans les composants
5. **Transitions** — `transitions.fast` (0.15s) sur hover/focus — jamais sans transition
6. **Border radius** — minimum `radius.card` (16px) pour les cards. Maximum `radius.cardLg` (24px)
7. **États complets** — loading (skeleton), empty state (illus + CTA), error, success — tous requis
8. **Bento dashboard only** — grille asymétrique uniquement sur les dashboards, pas sur les sous-pages
9. **Gold accent seul** — `colors.accent.gold` (#C1AC5C) pour tous les accents. Pas de violet, bleu primaire, ou vert primaire
10. **Typographie** — Rajdhani pour titres (display/h1/h2/h3), Geist pour body

**Anti-patterns BLOCKER design :**
- Fond dark généralisé hors sidebar → BLOCKER
- Glassmorphism (`backdrop-filter` sur composants) → BLOCKER
- Bento grid sur une sous-page → BLOCKER
- Texte blanc sur fond clair → BLOCKER
- Border-radius > 24px → BLOCKER

---

## Usage Guidelines

**For AI Agents:**
- Read this file BEFORE implementing any code in this project
- Follow ALL rules exactly as documented — especially the BLOCKER anti-patterns
- When in doubt, prefer the more restrictive option
- The `@aureak/api-client` and `@aureak/theme` constraints are ABSOLUTE — no exceptions
- Update this file if new patterns or constraints emerge during implementation

**For Humans:**
- Keep this file lean and focused on non-obvious agent needs
- Update when technology stack or design system changes
- Review after each epic completion for outdated rules
- Remove rules that become obvious over time

_Last Updated: 2026-04-04_
