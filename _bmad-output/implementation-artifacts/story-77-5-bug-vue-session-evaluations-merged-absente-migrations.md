# Story 77.5 : BUG — Vue `session_evaluations_merged` absente des migrations actives → 406 sur toutes les requêtes évaluations

Status: done

## Story

En tant qu'admin, coach ou parent consultant les évaluations d'un enfant,
je veux que les requêtes vers `session_evaluations_merged` retournent des données réelles,
afin que les pages Évaluations, Fiche Joueur et Fiche Enfant ne renvoient plus d'erreur 406.

## Acceptance Criteria

1. La vue `session_evaluations_merged` est recréée en DB via une migration idempotente `CREATE OR REPLACE VIEW` dans `supabase/migrations/`.
2. La vue agrège les signaux `receptivite`, `gout_effort`, `attitude` et `top_seance` par `(session_id, child_id, tenant_id)` — logique de fusion identique à l'archive `00023_evaluations.sql` : signal `'attention'` prime sur `'positive'` qui prime sur `'none'` ; `'star'` prime sur `'none'`.
3. Une requête `supabase.from('session_evaluations_merged').select('*').eq('child_id', <id>)` retourne HTTP 200 (plus 406) — vérifiable via l'onglet Network du navigateur sur la route `/parent/children/[childId]`.
4. Toutes les fonctions API existantes qui utilisent `session_evaluations_merged` (`childProfile.ts`, `evaluations.ts`, `clubData.ts`, `goalkeeperDetail.ts`, `playerProfile.ts`, `childDashboard.ts`, `generate-gdpr-export/index.ts`) continuent de fonctionner sans modification de code.
5. La vue expose RLS implicite via la table `evaluations` sous-jacente (les policies RLS sur `evaluations` s'appliquent automatiquement car la vue est un SELECT simple sans SECURITY DEFINER).
6. La migration est numérotée `00143` et ne contient aucun `DROP` : idempotente via `CREATE OR REPLACE VIEW`.

## Tasks / Subtasks

- [x] T1 — Créer la migration `00143_create_view_session_evaluations_merged.sql` (AC: 1, 2, 5, 6)
  - [x] T1.1 — Créer le fichier `supabase/migrations/00143_create_view_session_evaluations_merged.sql` avec le SQL complet ci-dessous (voir Dev Notes)
  - [x] T1.2 — Vérifier que le numéro 00143 est bien le suivant (`ls supabase/migrations/ | tail -3` → dernier = 00142)

- [x] T2 — Validation (AC: tous)
  - [ ] T2.1 — Vérifier via `supabase db push` (ou Supabase remote) que la migration s'applique sans erreur
  - [ ] T2.2 — Naviguer vers `/parent/children/[childId]` → inspecter Network → requête `session_evaluations_merged` → HTTP 200
  - [ ] T2.3 — Naviguer vers la route admin Évaluations → vérifier que les données s'affichent (plus d'erreur 406 dans la console)
  - [x] T2.4 — Vérifier que `grep -rn "session_evaluations_merged" aureak/packages/api-client/` retourne les mêmes 6 fichiers qu'avant (aucune modification api-client nécessaire)

## Dev Notes

### ⚠️ Contraintes Stack

Ce projet utilise :
- **React Native Web** (View, Pressable, StyleSheet, Image) — pas de Tailwind, pas de className
- **Tamagui** : XStack, YStack, Text — uniquement dans `_layout.tsx`
- **Tokens `@aureak/theme`** : `colors`, `space`, `shadows`, `radius`, `transitions`
- **Composants `@aureak/ui`** : AureakButton, AureakText, Badge, Card, Input
- **Accès Supabase UNIQUEMENT via `@aureak/api-client`** — jamais direct dans apps/
- **Styles via tokens uniquement** — jamais de couleurs hardcodées
- **Try/finally obligatoire** sur tout state setter de chargement

---

### T1 — Migration 00143

**Contexte du bug** : La vue `session_evaluations_merged` a été créée à l'origine dans le fichier d'archive `aureak/supabase/_archive/migrations/00023_evaluations.sql`. Ce fichier n'a jamais été porté dans `supabase/migrations/` (le seul dossier actif). La vue existe en production Supabase (créée manuellement à l'époque) mais **n'existe pas dans les migrations du repo** — ce qui provoque des erreurs 406 lors d'un reset de la DB ou sur un environnement de développement local propre.

**Migration : `00143_create_view_session_evaluations_merged.sql`**

```sql
-- =============================================================================
-- Migration 00143 — BUG Story 77.3
-- Restaure la vue session_evaluations_merged dans les migrations actives.
-- Source originale : aureak/supabase/_archive/migrations/00023_evaluations.sql
-- Cette vue était absente de supabase/migrations/ → requêtes retournaient 406.
-- =============================================================================

-- Idempotente : CREATE OR REPLACE VIEW (pas de DROP)
CREATE OR REPLACE VIEW session_evaluations_merged AS
SELECT
  session_id,
  child_id,
  tenant_id,
  CASE
    WHEN bool_or(receptivite = 'attention') THEN 'attention'
    WHEN bool_or(receptivite = 'positive')  THEN 'positive'
    ELSE 'none'
  END::evaluation_signal AS receptivite,
  CASE
    WHEN bool_or(gout_effort = 'attention') THEN 'attention'
    WHEN bool_or(gout_effort = 'positive')  THEN 'positive'
    ELSE 'none'
  END::evaluation_signal AS gout_effort,
  CASE
    WHEN bool_or(attitude = 'attention') THEN 'attention'
    WHEN bool_or(attitude = 'positive')  THEN 'positive'
    ELSE 'none'
  END::evaluation_signal AS attitude,
  CASE
    WHEN bool_or(top_seance = 'star') THEN 'star'
    ELSE 'none'
  END AS top_seance
FROM evaluations
GROUP BY session_id, child_id, tenant_id;

COMMENT ON VIEW session_evaluations_merged IS
  'Story 77.3 — Vue de fusion des évaluations multi-coach par enfant × séance. '
  'Agrège les signaux (attention > positive > none) et top_seance (star > none). '
  'La RLS de la table evaluations sous-jacente s''applique implicitement.';
```

Contraintes :
- `CREATE OR REPLACE VIEW` — idempotente, peut être appliquée même si la vue existe déjà
- Pas de `SECURITY DEFINER` sur la vue : les policies RLS de `evaluations` filtrent automatiquement (vue non définie en mode sécurité propre)
- Le type `evaluation_signal` est défini dans `supabase/migrations/00002_create_enums.sql` — existe en DB

---

### Diagnostic

**Pourquoi 406 et pas 404 ?** Supabase PostgREST retourne 406 (Not Acceptable) quand la relation demandée (`session_evaluations_merged`) n'existe pas dans le schéma exposé — ce qui se produit lorsque la vue est absente de la DB locale mais présente en production.

**Fichiers API utilisant la vue (à NE PAS modifier) :**
- `aureak/packages/api-client/src/parent/childProfile.ts:28`
- `aureak/packages/api-client/src/evaluations/evaluations.ts:75, 271`
- `aureak/packages/api-client/src/club/clubData.ts:117`
- `aureak/packages/api-client/src/club/goalkeeperDetail.ts:60`
- `aureak/packages/api-client/src/admin/playerProfile.ts:157`
- `aureak/packages/api-client/src/child/childDashboard.ts:26`
- `aureak/supabase/functions/generate-gdpr-export/index.ts:36`

---

### Fichiers à créer / modifier

| Fichier | Action | Notes |
|---------|--------|-------|
| `supabase/migrations/00143_create_view_session_evaluations_merged.sql` | Créer | Migration idempotente `CREATE OR REPLACE VIEW` |

### Fichiers à NE PAS modifier

- `aureak/packages/api-client/src/parent/childProfile.ts` — utilise la vue, fonctionnera dès que la migration est appliquée
- `aureak/packages/api-client/src/evaluations/evaluations.ts` — idem
- `aureak/packages/api-client/src/club/clubData.ts` — idem
- `aureak/packages/api-client/src/club/goalkeeperDetail.ts` — idem
- `aureak/packages/api-client/src/admin/playerProfile.ts` — idem
- `aureak/packages/api-client/src/child/childDashboard.ts` — idem
- `aureak/supabase/functions/generate-gdpr-export/index.ts` — idem
- `aureak/supabase/_archive/migrations/00023_evaluations.sql` — archive lecture seule, source de référence uniquement

---

### Dépendances à protéger

- La table `evaluations` doit exister en DB (créée directement en Supabase, non recréée par les migrations actives — voir commentaire 00090) — ne pas DROP/recreate
- L'enum `evaluation_signal` est dans `supabase/migrations/00002_create_enums.sql` — ne pas modifier

---

### Multi-tenant

La vue groupe par `tenant_id` (colonne présente dans `evaluations`). Les policies RLS sur `evaluations` s'appliquent implicitement à la vue — chaque rôle ne voit que les évaluations de son tenant et de ses enfants autorisés (via les policies existantes `eval_coach_own`, `eval_admin_all`, `eval_parent_read`).

---

### Références

- Source originale de la vue : `aureak/supabase/_archive/migrations/00023_evaluations.sql` lignes 62-80
- Enum `evaluation_signal` : `supabase/migrations/00002_create_enums.sql`
- Contexte DB Baseline Recovery : `_bmad-output/BACKLOG.md` section "Chantier parallèle"
- Exemple migration `CREATE OR REPLACE VIEW` : `supabase/migrations/00068_v_child_academy_status_dynamic_season.sql`

## Dev Agent Record

### Agent Model Used
claude-sonnet-4-6

### Debug Log References
Aucun

### Completion Notes List
- Migration 00143 créée — `CREATE OR REPLACE VIEW session_evaluations_merged` idempotente
- Numéro 00143 confirmé correct (dernier était 00142)
- 6 fichiers api-client référençant la vue confirmés inchangés
- Playwright skipped — app non démarrée (T2.1-T2.3 requièrent `supabase db push` en local)

### File List

| Fichier | Statut |
|---------|--------|
| `supabase/migrations/00143_create_view_session_evaluations_merged.sql` | Créé |
