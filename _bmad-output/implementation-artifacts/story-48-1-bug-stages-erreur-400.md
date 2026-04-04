# Story 48.1 : BUG — Page /stages — Erreur 400 + bannière rouge

Status: done

## Story

En tant qu'admin Aureak consultant la page des stages,
je veux que la page s'affiche correctement sans erreur 400 ni bannière rouge,
afin de pouvoir gérer les stages sans confusion visuelle.

## Acceptance Criteria

1. La page `(admin)/stages/` ne retourne plus d'erreur 400 de l'API
2. La bannière d'erreur rouge est absente en chargement normal
3. Les stages existants s'affichent correctement dans la liste
4. Si aucun stage → état vide propre (pas bannière + état vide simultanés)

## Tasks / Subtasks

- [x] T1 — Diagnostiquer l'erreur 400
  - [x] T1.1 — Lire `aureak/apps/web/app/(admin)/stages/index.tsx` — identifier la requête API qui échoue
  - [x] T1.2 — Lire `aureak/packages/api-client/src/admin/stages.ts` — identifier la fonction `listStages`
  - [x] T1.3 — Vérifier si le problème est : colonne inexistante en DB, RLS manquante, ou mauvais nom de table
    → CAUSE : colonne `deleted_at` absente de la table `stages` (migration 00041 + 00048 ne l'ajoutait pas)

- [x] T2 — Corriger
  - [x] T2.1 — Migration 00112 créée : `ALTER TABLE stages ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL`
  - [x] T2.2 — RLS OK (pas de problème de policy sur stages)
  - [x] T2.3 — Requête `listStages` inchangée (correcte une fois la colonne présente)
  - [x] T2.4 — UI corrigée : chaîne ternaire `error ? banner : loading ? skeleton : empty/grid` — jamais simultané
  - [x] Bonus : migration 00110 corrigée (`role` → `user_role`, idempotente) — bloquait le push

- [x] T3 — Validation
  - [x] T3.1 — `npx tsc --noEmit` → zéro erreur
  - [x] T3.2 — Requête REST vérifiée : `[]` sans erreur 400 après migration appliquée

## Dev Notes

### Hypothèse principale
La migration 00048 a étendu `stages` avec `implantation_id`, `status`, `max_participants`, `notes` + tables `stage_days`, `stage_blocks`, `stage_block_participants`. Si ces colonnes sont absentes en DB remote, toute requête SELECT échoue avec 400.

### Vérification rapide
```bash
supabase migration list  # confirmer que 00048 est applied
```

### Pattern état erreur/vide séparé
```typescript
if (error) return <ErrorBanner message={error} />
if (stages.length === 0) return <EmptyState />
return <StageList stages={stages} />
```

### Fichiers à modifier
| Fichier | Action |
|---------|--------|
| `aureak/apps/web/app/(admin)/stages/index.tsx` | Fix affichage + diagnostic |
| `aureak/packages/api-client/src/admin/stages.ts` | Fix requête si nécessaire |

## Dev Agent Record

### Cause racine
La table `stages` (créée en migration 00041, étendue en 00048) ne possédait pas de colonne `deleted_at`. La fonction `listStages()` appelle `.is('deleted_at', null)` → erreur PostgreSQL `42703 column stages.deleted_at does not exist` → HTTP 400.

### Corrections appliquées
1. **Migration 00112** (`supabase/migrations/00112_stages_soft_delete.sql`) : `ALTER TABLE stages ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL` + index partiel.
2. **Migration 00110 corrigée** : `role` → `user_role` dans la policy `admin_insert_notifications`, rendue idempotente via `DO $rls$` blocks — bloquait `supabase db push`.
3. **UI `stages/index.tsx`** : restructuration en chaîne ternaire exclusive `error ? banner : loading ? skeleton : empty|grid` — empêche bannière rouge et état vide simultanés (AC4).

### Résultat
- `supabase db push` : 3 migrations appliquées (00110, 00111, 00112)
- REST API test : `[]` sans erreur 400
- `npx tsc --noEmit` : 0 erreur

### File List
| Fichier | Action |
|---------|--------|
| `supabase/migrations/00112_stages_soft_delete.sql` | Créé — ajoute `deleted_at` sur `stages` |
| `supabase/migrations/00110_inapp_notifications.sql` | Modifié — correction `role`→`user_role`, idempotence |
| `aureak/apps/web/app/(admin)/stages/index.tsx` | Modifié — séparation état erreur/vide/skeleton |
