# Configuration Globale — Agents Aureak

## Stack de référence

| Couche | Technologie |
|--------|-------------|
| Mobile/Web | Expo Router + Tamagui + Monorepo Turborepo |
| Backend | Supabase (PostgreSQL, Auth, RLS, Edge Functions, Realtime, Storage) |
| State | Zustand (client) + TanStack Query (server) |
| Forms | React Hook Form + Zod |
| Styles | `@aureak/theme` (tokens.ts) + `@aureak/ui` |
| API | `@aureak/api-client` (seul point d'accès Supabase autorisé) |
| Types | `@aureak/types` (entités + enums) |
| Tests | Vitest + RNTL + Maestro + Playwright |
| Linting | ruff (Python) / ESLint + TypeScript strict |

## Règles d'architecture non-négociables

Ces règles constituent des BLOCKER automatiques si violées.

1. **Accès Supabase** : UNIQUEMENT via `@aureak/api-client`. Toute importation directe de `supabase-js` hors de ce package est un BLOCKER.
2. **Styles** : UNIQUEMENT via `packages/theme/tokens.ts` + composants `@aureak/ui`. Pas de valeurs hardcodées (#couleur, px, etc.).
3. **RLS** : Toute nouvelle table doit avoir des politiques RLS activées. Absence = BLOCKER sécurité.
4. **Soft-delete** : Suppression = `deleted_at = NOW()`. Jamais de DELETE physique sauf jobs RGPD.
5. **Sync idempotency** : Chaque `QueueOperation` doit porter un `operation_id` UUID.
6. **Enums** : Toujours mirrored DB ↔ TypeScript. Divergence = BLOCKER migration.
7. **Routing** : `page.tsx` + `index.tsx` (re-export). Jamais de route directe sans index.
8. **Types stricts** : Pas de `any` non justifié. Pas de `!` non-null assertion sans commentaire.

## Fichiers de référence pour les agents

Les agents doivent toujours consulter ces fichiers en priorité :

```
_bmad-output/planning-artifacts/architecture.md    ← source de vérité technique
_bmad-output/planning-artifacts/ux-design-specification.md  ← design system
packages/theme/tokens.ts                           ← tokens de style
packages/types/src/entities.ts                     ← types de données
packages/types/src/enums.ts                        ← enums
supabase/migrations/                               ← toutes les migrations
```

## Modèle IA à utiliser

- **Agents P0** (code-reviewer, security-auditor, migration-validator) : `claude-sonnet-4-6`
- **Agents P1** (ux-auditor, bug-hunter) : `claude-sonnet-4-6`

## Périmètre d'action des agents

### Ce que les agents PEUVENT faire
- Lire tous les fichiers du repo
- Analyser, comparer, détecter
- Produire des rapports dans `_qa/reports/`
- Suggérer des corrections avec références précises (fichier:ligne)

### Ce que les agents NE PEUVENT PAS faire
- Modifier des fichiers de code
- Committer ou pousser
- Exécuter des migrations
- Accéder à Supabase en production
- Approuver un gate (rôle humain uniquement)
- Ignorer un BLOCKER

## Convention de nommage des rapports

```
_qa/reports/YYYY-MM-DD_story-{epic}-{num}_{agent}.md
_qa/reports/YYYY-MM-DD_migration-{000XX}_{agent}.md

Agents slugs : code-review | security | migration-validator | ux | bugs
```

## Rôles RBAC de l'application

`admin | coach | parent | child | club_partner | club_common`

Les agents doivent vérifier les implications de sécurité pour **chaque rôle** concerné par la feature reviewée.
