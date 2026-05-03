# Story 105.3 : Répartir les gardiens du stage en groupes

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

En tant qu'**admin Aureak**,
je veux pouvoir **répartir les gardiens inscrits au stage dans des groupes (avec un groupe par défaut auto-créé, et possibilité d'en ajouter à volonté)**,
afin d'**organiser le travail terrain en sous-groupes cohérents (par âge, niveau, ou pédagogie)**.

## Acceptance Criteria

1. **Nouvelle table** `stage_groups` créée via migration (cf. section "Migration" plus bas) avec `id`, `tenant_id`, `stage_id`, `name` (1-50 chars), `position`, `is_default`, `created_at`, `deleted_at` + RLS tenant-scoped.
2. **Nouvelle colonne** `stage_group_id UUID NULL REFERENCES stage_groups(id) ON DELETE SET NULL` sur `child_stage_participations` + index.
3. **Auto-création "Groupe 1"** : à chaque INSERT dans `stages`, un trigger crée un `stage_groups` (`name = 'Groupe 1'`, `position = 0`, `is_default = true`). Backfill : tous les stages existants sans groupe par défaut en reçoivent un.
4. **Onglet/Bouton "Groupes"** sur la fiche stage `/(admin)/evenements/stages/[stageId]/page.tsx` qui route vers `/(admin)/evenements/stages/[stageId]/groupes`.
5. **Vue kanban simple** : une colonne par groupe (ordre `position` ASC), chaque carte = un gardien (Prénom · Nom · Âge calculé via `computeAge`). Compteur "X gardiens" sous le nom du groupe.
6. **Bouton "+ Nouveau groupe"** : ouvre un input inline (max 50 chars) → submit → `createStageGroup(stageId, name)` avec `position = max(position) + 1`, `is_default = false` → refresh.
7. **Renommer un groupe** : icône ✏️ sur l'entête de colonne → input inline (max 50 chars) → submit → `renameStageGroup(groupId, name)`. Le groupe par défaut peut être renommé.
8. **Supprimer un groupe** : icône 🗑 sur l'entête de colonne → `ConfirmDialog` (avec count de gardiens à réaffecter) → `deleteStageGroup(groupId)` qui (a) re-affecte les gardiens du groupe au groupe par défaut (UPDATE `child_stage_participations.stage_group_id = <default_group_id>`) puis (b) soft-delete le groupe. **Refusé** sur le groupe par défaut (icône grisée + tooltip "Le groupe par défaut ne peut pas être supprimé").
9. **Déplacer un gardien** : menu "Déplacer vers..." sur la carte gardien (3 dots ou bouton) → liste des autres groupes → sélection → `moveChildToGroup(stageId, childId, groupId)` → refresh. (Drag & drop = optionnel v1.1.)
10. **Nouveaux gardiens inscrits** (via story 105.2) tombent automatiquement dans le groupe par défaut : `addChildToStage` doit positionner `stage_group_id = <default_group_id_for_stage>`. Si `stage_group_id IS NULL` côté DB, l'UI traite la carte comme étant dans le groupe par défaut (fallback safe).
11. **État vide** par colonne : "Aucun gardien dans ce groupe" centré.
12. **Règles Aureak respectées** : Supabase via `@aureak/api-client` uniquement, theme tokens, `try/finally` sur tous les setters loading/saving, console guards `NODE_ENV !== 'production'`, `page.tsx` + `index.tsx` re-export, soft-delete (`deleted_at`) sur `stage_groups`, RLS pattern `current_tenant_with_fallback()` (cf. memory `project_rls_fallback_helpers`).

## Tasks / Subtasks

- [ ] **Task 1 — Migration Supabase** (AC: #1, #2, #3)
  - [ ] Créer `supabase/migrations/00172_stage_groups.sql` (numéro après `00171_csp_soft_delete.sql` — story 105.2)
  - [ ] DDL : table `stage_groups` (PK, FK tenant_id/stage_id avec ON DELETE CASCADE, CHECK length(name) BETWEEN 1 AND 50, `position INT NOT NULL DEFAULT 0`, `is_default BOOLEAN NOT NULL DEFAULT false`, `created_at`, `deleted_at`)
  - [ ] Index : `idx_stage_groups_stage(stage_id, tenant_id) WHERE deleted_at IS NULL`
  - [ ] Index unique : `uq_stage_groups_default(stage_id) WHERE is_default = true AND deleted_at IS NULL`
  - [ ] RLS : `ENABLE ROW LEVEL SECURITY`, policies SELECT + ALL avec `current_tenant_with_fallback()` (helper existant — cf. `00009_create_audit.sql` ou helpers RLS pattern)
  - [ ] ALTER TABLE `child_stage_participations` ADD COLUMN `stage_group_id UUID REFERENCES stage_groups(id) ON DELETE SET NULL` + index `idx_csp_group(stage_group_id) WHERE stage_group_id IS NOT NULL`
  - [ ] Fonction `create_default_stage_group()` (PL/pgSQL, SECURITY DEFINER) qui INSERT 'Groupe 1' avec `is_default=true`
  - [ ] Trigger `trg_create_default_stage_group AFTER INSERT ON stages FOR EACH ROW`
  - [ ] Backfill : `INSERT INTO stage_groups SELECT tenant_id, id, 'Groupe 1', 0, true FROM stages WHERE NOT EXISTS (SELECT 1 FROM stage_groups g WHERE g.stage_id = stages.id AND g.is_default = true)`
  - [ ] Test local : `supabase db push`, créer un stage, vérifier que "Groupe 1" est créé
- [ ] **Task 2 — Types** (AC: #1, #2)
  - [ ] Dans `aureak/packages/types/src/` (selon arborescence existante), ajouter :
    ```ts
    export type StageGroup = {
      id: string
      stageId: string
      name: string
      position: number
      isDefault: boolean
    }
    ```
  - [ ] Export depuis l'index public du package `@aureak/types`
- [ ] **Task 3 — API client : stage_groups** (AC: #6, #7, #8, #9)
  - [ ] Dans `aureak/packages/api-client/src/admin/stages.ts` ajouter :
    - `listStageGroups(stageId)` → `SELECT * FROM stage_groups WHERE stage_id=$1 AND deleted_at IS NULL ORDER BY position ASC`
    - `createStageGroup(stageId, name)` : récupère `max(position)+1`, INSERT avec `is_default=false`, retourne `StageGroup`
    - `renameStageGroup(groupId, name)` : UPDATE name (trim, length 1-50)
    - `deleteStageGroup(groupId)` : (a) lit le groupe pour obtenir `stage_id`, (b) refuse si `is_default = true` (throw), (c) lit `default_group_id` du même stage, (d) UPDATE `child_stage_participations` SET `stage_group_id = default_group_id` WHERE `stage_group_id = groupId`, (e) UPDATE `stage_groups` SET `deleted_at = now()` WHERE `id = groupId`
    - `moveChildToGroup(stageId, childId, groupId)` : UPDATE `child_stage_participations` SET `stage_group_id = groupId` WHERE `stage_id=$1 AND child_id=$2`
  - [ ] Étendre `StageChild` (story 105.1) pour exposer `stageGroupId: string | null`
  - [ ] Adapter `listStageChildren` pour SELECT `stage_group_id` aussi
  - [ ] Si story 105.2 a déjà fusionné : adapter `addChildToStage(stageId, childId)` pour récupérer `default_group_id` et l'utiliser dans l'INSERT (`stage_group_id = default_group_id`)
  - [ ] Exports dans `aureak/packages/api-client/src/index.ts`
  - [ ] Console guards NODE_ENV
- [ ] **Task 4 — Page groupes (route)** (AC: #4, #5, #11)
  - [ ] Créer `apps/web/app/(admin)/evenements/stages/[stageId]/groupes/page.tsx` + `index.tsx` (re-export)
  - [ ] Layout : header (Back + breadcrumb + bouton "+ Nouveau groupe"), `<GroupesBoard>` plein-écran
  - [ ] Queries TanStack : `['stage-groups', stageId]` et `['stage-participants', stageId]` (réutilise la clé de 105.2 si possible)
- [ ] **Task 5 — Composants kanban** (AC: #5, #6, #7, #8, #9, #11)
  - [ ] Sous `apps/web/components/admin/stages/groupes/` :
    - `GroupesBoard.tsx` : layout flex horizontal scrollable mobile, columns
    - `GroupColumn.tsx` : header (nom éditable, count, ✏️/🗑), body = liste de `ChildCard`, footer empty state
    - `ChildCard.tsx` : Prénom · Nom · Âge (helper `computeAge` de story 105.2 ou créer ici si 105.2 pas encore mergée), bouton "Déplacer" → `MoveChildMenu`
    - `NewGroupButton.tsx` : input inline (RHF + Zod max 50 chars) + submit
    - `MoveChildMenu.tsx` : Popover/Sheet avec liste des groupes (sauf le groupe courant)
  - [ ] `try/finally` sur tous les setters de mutation (renameSaving, deleteLoading, moveLoading, createSaving)
  - [ ] Confirmation suppression : pattern `ConfirmDialog` Aureak (cf. story 69.11) avec message "X gardiens seront déplacés vers '{groupe par défaut}'"
- [ ] **Task 6 — Intégration fiche stage** (AC: #4)
  - [ ] Sur `apps/web/app/(admin)/evenements/stages/[stageId]/page.tsx`, ajouter dans le header (à côté de "🃏 Cartes Panini" et "👥 Participants" de 105.2) un bouton "📋 Groupes" qui route vers `/evenements/stages/${stageId}/groupes`
- [ ] **Task 7 — QA & tests** (AC: #1-#12)
  - [ ] Test migration : `supabase db reset && supabase db push` — vérifier 0 erreur, trigger fonctionnel, backfill OK
  - [ ] Grep : aucun setter inline sans `finally`, aucun `console.*` non guardé
  - [ ] Playwright : (a) créer un stage → vérifier "Groupe 1" auto-créé via la nouvelle page, (b) créer "Groupe 2", (c) inscrire 2 gardiens via 105.2, (d) déplacer 1 gardien Groupe 1 → Groupe 2 via menu, refresh, vérifier persistance, (e) renommer "Groupe 1" → OK, (f) tenter supprimer "Groupe 1" → bouton grisé/refusé, (g) supprimer "Groupe 2" avec gardiens → ConfirmDialog → gardiens reviennent dans "Groupe 1"
  - [ ] Vérifier que la page Panini (story 105.1) charge toujours correctement sans groupe filter (pas de régression)

## Dev Notes

### Architecture patterns

- **Couche API** : `@aureak/api-client/src/admin/stages.ts` uniquement. Pas de `from('stage_groups')` direct dans `apps/`.
- **State serveur** : TanStack Query. Clés stables : `['stage-groups', stageId]`, `['stage-participants', stageId]`. Invalider après chaque mutation (create/rename/delete/move).
- **Theme tokens** uniquement (`@aureak/theme`).
- **Migration numérotée 00172** (après `00171_csp_soft_delete.sql` — story 105.2). Lancer Supabase **depuis la racine** du dépôt, pas depuis `aureak/` (cf. CLAUDE.md "Migrations Supabase — Source de vérité unique").
- **RLS pattern** : utiliser `current_tenant_with_fallback()` (cf. memory `project_rls_fallback_helpers`) pour rester aligné avec le pattern obligatoire des nouvelles tables tenant-scoped.
- **Soft-delete** sur `stage_groups` (`deleted_at TIMESTAMPTZ`) — cohérent avec la règle absolue "Soft-delete uniquement" (CLAUDE.md).

### Choix UX (simplification volontaire — confirmé avec le user)

- Pas de drag & drop en v1 (menu "Déplacer vers..." suffit, évite l'ajout de `@dnd-kit/core`).
- Pas de couleurs/icônes par groupe.
- Pas de quota / limite par groupe.
- Pas de regroupement automatique (par âge ou catégorie). L'admin place à la main avec l'âge visible.
- Pas de copie de groupes d'un stage à l'autre.

### Relation avec story 105.2

- Si 105.2 et 105.3 sont implémentées en parallèle : 105.3 doit étendre `addChildToStage(stageId, childId)` pour positionner automatiquement `stage_group_id = default_group_id`. Si 105.2 livre avant 105.3 : la story 105.3 modifie `addChildToStage` dans Task 3.
- Le helper `computeAge` créé en story 105.2 est réutilisé. Si 105.3 livre avant 105.2 : le créer ici dans `apps/web/lib/dates.ts`.

### Schéma DB cible

```sql
CREATE TABLE stage_groups (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  stage_id    UUID NOT NULL REFERENCES stages(id)  ON DELETE CASCADE,
  name        TEXT NOT NULL CHECK (length(name) BETWEEN 1 AND 50),
  position    INT  NOT NULL DEFAULT 0,
  is_default  BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at  TIMESTAMPTZ
);

ALTER TABLE child_stage_participations
  ADD COLUMN IF NOT EXISTS stage_group_id UUID REFERENCES stage_groups(id) ON DELETE SET NULL;
```

### Source tree à toucher

```
aureak/
├── apps/web/
│   ├── app/(admin)/evenements/stages/[stageId]/
│   │   ├── page.tsx                              ← MODIFIER (ajout bouton header "📋 Groupes")
│   │   └── groupes/
│   │       ├── page.tsx                          ← CRÉER
│   │       └── index.tsx                         ← CRÉER (re-export)
│   ├── components/admin/stages/groupes/
│   │   ├── GroupesBoard.tsx                      ← CRÉER
│   │   ├── GroupColumn.tsx                       ← CRÉER
│   │   ├── ChildCard.tsx                         ← CRÉER
│   │   ├── NewGroupButton.tsx                    ← CRÉER
│   │   └── MoveChildMenu.tsx                     ← CRÉER
│   └── lib/dates.ts                              ← RÉUTILISER (créé en 105.2) ou CRÉER ici
├── packages/api-client/src/
│   ├── admin/stages.ts                            ← MODIFIER (5 nouvelles fns + extend StageChild + adapt addChildToStage)
│   └── index.ts                                   ← MODIFIER (exports)
├── packages/types/src/
│   └── (fichier approprié)                        ← MODIFIER (ajout type StageGroup)
└── supabase/migrations/
    └── 00172_stage_groups.sql                     ← CRÉER
```

### Testing standards

- Test migration en local (`supabase db push`) avant tout commit.
- Playwright manuel via MCP : flow complet (création groupe, déplacement, renommage, suppression avec réaffectation).
- Pas d'unit tests obligatoires en v1 (cohérent avec stories 105.1, 105.2).

### Project Structure Notes

- Cohérent avec le pattern stages : `app/(admin)/evenements/stages/[stageId]/<feature>/{page,index}.tsx` + `components/admin/stages/<feature>/`.
- Aucune nouvelle dépendance npm (drag&drop reporté en v1.1).

### Variations / risques à anticiper

- **`current_tenant_with_fallback()`** : si le helper n'est pas disponible côté policies sur ce dépôt, utiliser le pattern existant des autres migrations récentes (cf. `00171_csp_soft_delete.sql` — story 105.2) avant d'écrire les policies.
- **Trigger** sur `stages` : SECURITY DEFINER nécessaire si `tenant_id` n'est pas accessible au rôle inserter direct. Tester en mode RLS strict.
- **Backfill** : safe car idempotent (`WHERE NOT EXISTS`). Ne jamais le re-jouer dans une migration future.
- **Tenant isolation** : tous les `INSERT` côté API client doivent positionner `tenant_id = current_tenant_with_fallback()` (ou laisser RLS le faire si une policy WITH CHECK le force). Vérifier le pattern utilisé dans `createStage` (`packages/api-client/src/admin/stages.ts:242`).

### References

- [Source: CLAUDE.md#Règles-absolues-de-code] — règles obligatoires (api-client, theme, try/finally, console guards, soft-delete)
- [Source: CLAUDE.md#Migrations-Supabase] — `supabase/migrations/` racine = unique source, lancer depuis la racine
- [Source: _bmad-output/implementation-artifacts/story-105-1-generation-cartes-panini-stages.md] — pattern de routing stages
- [Source: _bmad-output/implementation-artifacts/story-105-2-stage-participants-add-create.md] — story sœur (helpers et types réutilisés)
- [Source: supabase/migrations/00041_academy_status_system.sql#child_stage_participations] — table à étendre (FK)
- [Source: supabase/migrations/00170_stage_form_v2.sql] — dernière migration appliquée, base pour la numérotation
- [Source: aureak/packages/api-client/src/admin/stages.ts:242] — pattern `createStage` (référence pour `tenant_id` à l'insert)
- [Source: aureak/packages/api-client/src/admin/stages.ts:454] — `listStageChildren` à étendre (ajout `stageGroupId`)
- [Source: memory project_rls_fallback_helpers] — pattern RLS obligatoire pour nouvelles tables tenant-scoped

## Dev Agent Record

### Agent Model Used

_à remplir par le dev agent_

### Debug Log References

### Completion Notes List

### File List
