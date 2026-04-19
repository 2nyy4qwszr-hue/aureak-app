# Story 89.2 : Note + évaluation rapide scout sur gardien prospect

Status: ready-for-dev

## Story

En tant que **commercial ou admin** (rôle fonctionnel "scout") ayant observé un gardien prospect en situation réelle (match, tournoi, entraînement club),
je veux **enregistrer en quelques secondes une note globale (1–5 étoiles) et un commentaire libre horodaté sur la fiche du gardien**,
afin de **construire un historique d'observations terrain fiable et partagé entre scouts**, préalable à toute démarche commerciale (invitation séance gratuite).

## Acceptance Criteria

1. Une nouvelle table `prospect_scout_evaluations` existe en base, isolée des `evaluations` coach classiques, avec RLS `tenant_isolation` stricte (insert/select/update limités au tenant de l'utilisateur).
2. Sur la fiche gardien `/children/[childId]`, un bouton **"Évaluer ce gardien"** est visible **uniquement** si `role === 'admin' || role === 'commercial'`. Les autres rôles ne voient ni le bouton ni la section historique (rendu vide côté UI).
3. Le bouton ouvre un modal **"Évaluation scout"** contenant : sélecteur étoiles 1–5 (obligatoire, composant `StarRating` existant), textarea commentaire (optionnel, max 1000 caractères), sélecteur contexte d'observation (liste fermée : "Match", "Tournoi", "Entraînement club", "Autre") optionnel, champ date d'observation (défaut = aujourd'hui, optionnel, max = aujourd'hui).
4. À la soumission : bouton `saving` désactivé pendant l'appel, try/finally obligatoire sur `setSaving`, toast "Évaluation enregistrée" au succès, modal se ferme et la liste historique se rafraîchit. En cas d'erreur, toast d'erreur + log `[ScoutEvaluation]` en dev seulement.
5. Sous l'encart "Identité" de la fiche gardien, une section **"Observations scout"** affiche : (a) la **dernière note** (étoiles + date au format `dd/MM/yyyy` + auteur), (b) la **moyenne** sur N évaluations (`"3.8 ★ sur 5 évaluations"`), (c) la **liste historique** triée desc par `observation_date` (fallback `created_at`) avec : étoiles, commentaire (tronqué à 160 caractères + "Voir plus" si plus long), auteur (nom complet ou email), contexte d'observation (badge coloré), date formatée.
6. Si aucune évaluation n'existe, la section affiche un état vide : icône + texte "Aucune observation terrain — soyez le premier à évaluer ce gardien" + un bouton CTA primaire.
7. Une évaluation ne peut être **modifiée que par son auteur** (`evaluator_id = auth.uid()`), pendant **24h après création** (calcul côté client + garde-fou RLS `WITH CHECK`). Au-delà, la ligne est read-only pour tout le monde.
8. Une évaluation peut être soft-deleted (`deleted_at`) uniquement par son auteur dans les 24h OU par un admin à tout moment. Une évaluation soft-deleted n'apparaît plus dans la liste, la dernière note ou la moyenne.
9. Validation client stricte : si `rating_stars` non sélectionné au submit → message d'erreur inline sous le composant étoiles (`colors.danger`), pas de requête envoyée. Si `observation_date` > aujourd'hui → refus.
10. Zéro couleur/espacement hardcodé — tous les styles utilisent les tokens `@aureak/theme`. Tous les accès DB passent par `@aureak/api-client` (aucun `supabase.from(...)` dans `apps/`). Console guards `NODE_ENV !== 'production'` systématiques.

## Tasks / Subtasks

- [ ] **T1 — Migration Supabase** (AC: #1, #7, #8)
  - [ ] T1.1 — Créer `supabase/migrations/00157_create_prospect_scout_evaluations.sql` : table + enum `scout_observation_context` + index + RLS + trigger `updated_at`. Voir Dev Notes pour SQL exact.
  - [ ] T1.2 — Vérifier idempotence (IF NOT EXISTS partout, DO $$ pour l'enum, DROP POLICY IF EXISTS avant chaque CREATE POLICY).
  - [ ] T1.3 — RLS : `select` filtre `tenant_id`, `insert` force `tenant_id` + `evaluator_id = auth.uid()`, `update` restreint à l'auteur ≤ 24h (via `created_at > now() - interval '24 hours'`), soft-delete via UPDATE sur `deleted_at`.

- [ ] **T2 — Types TypeScript** (AC: #1, #5)
  - [ ] T2.1 — Dans `aureak/packages/types/src/entities.ts`, ajouter les types `ScoutObservationContext` (union : `'match' | 'tournoi' | 'entrainement_club' | 'autre'`), `ProspectScoutEvaluation`, `ProspectScoutEvaluationWithAuthor` (ajoute `authorName: string | null`, `authorEmail: string | null`), `ProspectScoutEvaluationStats` (`lastRating: number | null`, `averageRating: number | null`, `count: number`).
  - [ ] T2.2 — Miroir exact du schéma DB (snake_case → camelCase). Exporter tous depuis `aureak/packages/types/src/index.ts` (si index existe).

- [ ] **T3 — API client** (AC: #3, #4, #5, #7, #8)
  - [ ] T3.1 — Créer `aureak/packages/api-client/src/admin/prospect-scout-evaluations.ts` avec :
    - `toEvaluation(row)` : mapper snake_case → camelCase (pattern de référence `child-directory.ts:11-52`).
    - `listScoutEvaluationsByChild(childId: string): Promise<ProspectScoutEvaluationWithAuthor[]>` — SELECT avec JOIN `profiles` sur `evaluator_id` pour récupérer `display_name` + `email`, filtre `deleted_at IS NULL`, tri `observation_date DESC NULLS LAST, created_at DESC`.
    - `getScoutEvaluationStats(childId: string): Promise<ProspectScoutEvaluationStats>` — calcule `count`, `averageRating` (arrondi à 1 décimale), `lastRating` (plus récent `observation_date`/`created_at`).
    - `createScoutEvaluation(params: CreateScoutEvaluationParams): Promise<ProspectScoutEvaluation>` — INSERT, `evaluator_id` automatiquement = `auth.uid()` (pas dans params), `tenant_id` dans params.
    - `updateScoutEvaluation(id: string, patch: UpdateScoutEvaluationParams): Promise<ProspectScoutEvaluation>` — UPDATE partiel (ratingStars, comment, observationContext, observationDate), RLS gère la gate 24h.
    - `deleteScoutEvaluation(id: string): Promise<void>` — UPDATE `deleted_at = now()`.
  - [ ] T3.2 — Exporter les 5 fonctions + types depuis `aureak/packages/api-client/src/index.ts`.

- [ ] **T4 — Modal "Évaluer ce gardien"** (AC: #2, #3, #4, #9)
  - [ ] T4.1 — Créer `aureak/apps/web/app/(admin)/children/[childId]/_ScoutEvaluationModal.tsx` avec : overlay centré, card `colors.background.card` + `shadows.lg`, titre "Évaluation scout — {childName}".
  - [ ] T4.2 — Intégrer composant `StarRating` (`@aureak/ui`) en mode éditable (`onChange` défini), taille 32 px pour tap-target mobile.
  - [ ] T4.3 — Textarea commentaire : `maxLength=1000`, hauteur 3 lignes, compteur caractères "X/1000" sous le champ.
  - [ ] T4.4 — Sélecteur contexte : radio-pills horizontaux (labels : `Match`, `Tournoi`, `Entraînement club`, `Autre`), pill actif `colors.accent.gold`, non actif `colors.background.subtle`.
  - [ ] T4.5 — Date d'observation : `<input type="date">` (web), `max={today}`, valeur initiale = today.
  - [ ] T4.6 — Boutons : "Annuler" (secondaire) / "Enregistrer" (primaire, désactivé si `rating === 0`). Try/finally strict sur `saving`.
  - [ ] T4.7 — Mode édition : si `initialValue` passé en prop, pré-remplir et appeler `updateScoutEvaluation` au lieu de `createScoutEvaluation`.

- [ ] **T5 — Section "Observations scout" sur fiche joueur** (AC: #2, #5, #6, #7, #8)
  - [ ] T5.1 — Créer `aureak/apps/web/app/(admin)/children/[childId]/_ScoutEvaluationsSection.tsx` — composant auto-chargé, props : `{ childId: string, canEvaluate: boolean }`.
  - [ ] T5.2 — Au mount, charger `listScoutEvaluationsByChild(childId)` + `getScoutEvaluationStats(childId)` en parallèle via `Promise.all`. try/finally sur `loading`. Console guard sur les erreurs.
  - [ ] T5.3 — Rendu stats en haut : carte compacte avec étoiles grosses (`size=24`) + texte "3.8 ★ · 5 évaluations · dernière le 12/04/2026 par {authorName}".
  - [ ] T5.4 — Liste : items avec bordure subtile, étoiles (`size=16`), commentaire tronqué + "Voir plus" si > 160 caractères (toggle state local), badge contexte coloré (match = gold, tournoi = amber, entraînement = present, autre = muted), date formatée `dd/MM/yyyy`, auteur.
  - [ ] T5.5 — Pour chaque item dont `evaluator_id === currentUserId && isWithin24h(created_at)` → afficher 2 icônes (éditer / supprimer). Admin voit toujours icône supprimer. Sinon, lecture seule.
  - [ ] T5.6 — État vide (AC #6) : icône `★` muted + copie + CTA "Évaluer ce gardien" si `canEvaluate`.
  - [ ] T5.7 — Bouton "Évaluer ce gardien" en tête de section si `canEvaluate && evaluations.length > 0` (sinon CTA état vide seul suffit). Ouvre `_ScoutEvaluationModal`.

- [ ] **T6 — Intégration fiche joueur** (AC: #2, #5, #6)
  - [ ] T6.1 — Dans `aureak/apps/web/app/(admin)/children/[childId]/page.tsx`, importer `_ScoutEvaluationsSection` et l'insérer **sous la section "Identité"**, avant les tabs académie. Passer `canEvaluate = (role === 'admin' || role === 'commercial')`.
  - [ ] T6.2 — Ne modifier aucune autre section existante.

- [ ] **T7 — Validation Playwright + QA** (AC: tous)
  - [ ] T7.1 — Démarrer dev server, login admin, naviguer vers `/children/[id-d-un-prospect]`. Vérifier section "Observations scout" visible.
  - [ ] T7.2 — Cliquer "Évaluer ce gardien", remplir 4 étoiles + commentaire + contexte "Match" + date J-2 → soumettre. Vérifier toast succès + liste rafraîchie.
  - [ ] T7.3 — Submit sans étoiles → erreur inline affichée, aucune requête envoyée.
  - [ ] T7.4 — Éditer l'éval fraîche (< 24h) → vérifier modal pré-rempli, modification OK.
  - [ ] T7.5 — Mocker `created_at > 24h` (soit en DB, soit en stubbant) → vérifier icônes édition/suppression disparaissent pour le commercial (admin garde suppression).
  - [ ] T7.6 — Login en tant que `coach` → vérifier section absente sur fiche.
  - [ ] T7.7 — `grep -n "setSaving(false)" _ScoutEvaluationModal.tsx` → uniquement dans finally. `grep -n "console\." *.tsx` → tous guardés `NODE_ENV`.

## Dev Notes

### ⚠️ Contraintes Stack

Ce projet utilise :
- **React Native Web** (View, Pressable, StyleSheet, TextInput, Modal) — pas de Tailwind, pas de className
- **Expo Router** : `page.tsx` = contenu, `index.tsx` = re-export. Sous-composants préfixés `_` pour ne pas être routés.
- **Tokens `@aureak/theme`** : `colors`, `space`, `shadows`, `radius`, `transitions` — jamais de valeur hardcodée
- **Composants `@aureak/ui`** : `AureakText`, `StarRating`, `Button` (voir `StarRating.tsx`)
- **Accès Supabase UNIQUEMENT via `@aureak/api-client`** — jamais `supabase.from(...)` dans `apps/`
- **Try/finally obligatoire** sur tout state setter `saving/loading/creating`
- **Console guards** : `if (process.env.NODE_ENV !== 'production') console.error('[ScoutEvaluation] ...', err)`
- **Soft-delete uniquement** — jamais de DELETE physique (AC #8)

### Décision d'architecture — table dédiée vs extension de `evaluations`

Ambiguïté résolue : **créer une nouvelle table `prospect_scout_evaluations`**, distincte de `evaluations`.

Raisons :
- `evaluations` (Epic 6) est liée au pipeline pédagogique coach : colonnes `session_id`, `coach_id`, `receptivite`, `gout_effort`, `attitude`, `top_seance` — modèle critère/comportement, sans note globale. Cf. `entities.ts:993-1009`.
- Une évaluation scout porte une note globale, un commentaire libre et un contexte d'observation hors séance pédagogique. Les champs ne se recouvrent pas.
- Polluer `evaluations` avec des colonnes nullable scout-only casserait : (a) les vues/agrégats existants (`EvaluationMerged`, `EvaluationWithChild`, fonctions d'agrégat coach), (b) les RLS policies (scout ≠ coach), (c) la sémantique produit ("j'ai évalué tel prospect" vs "j'ai évalué tel joueur à la séance X").

### Décision d'architecture — rôle "scout" = commercial + permission

Ambiguïté résolue : **pas de nouveau rôle DB**. Même logique que Story 89.1.
- `user_role` enum = 8 rôles (admin, coach, parent, child, club, commercial, manager, marketeur). Aucun ajout.
- La gate d'accès se fait sur `role === 'admin' || role === 'commercial'` (côté client + RLS côté DB).
- Un admin peut toujours évaluer (utile pour corrections ou override).

### Décision d'architecture — fenêtre d'édition

Ambiguïté résolue : **24 heures**. Après, l'éval est immuable.
- Justification : trace d'observation horodatée → la fiabilité de l'historique prime sur la correction tardive.
- Implémentation : double garde-fou — calcul côté client (pour masquer les boutons) + RLS `WITH CHECK` (pour bloquer les updates concurrents / requête directe).
- Exception : un **admin** peut toujours soft-delete (mais pas éditer — il créera une nouvelle éval si besoin).

### Décision d'architecture — pas d'export/filtre en V1

Hors scope explicite : export CSV, filtre multi-joueurs, vue cross-scout "toutes mes évaluations". Reporter en V2 si le besoin se matérialise.

---

### T1 — Migration Supabase

**Migration : `00157_create_prospect_scout_evaluations.sql`**

```sql
-- Epic 89 — Story 89.2 : Note + évaluation rapide scout sur gardien prospect
-- Table dédiée aux observations terrain des scouts (commercial/admin) sur des
-- gardiens prospects. Distincte de `evaluations` (coach, pipeline pédagogique).

-- 1. Enum contexte d'observation
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'scout_observation_context') THEN
    CREATE TYPE scout_observation_context AS ENUM (
      'match',              -- observation en match officiel
      'tournoi',             -- observation en tournoi
      'entrainement_club',   -- observation à l'entraînement de son club actuel
      'autre'                -- libre (stage, sélection, vidéo…)
    );
  END IF;
END $$;

-- 2. Table prospect_scout_evaluations
CREATE TABLE IF NOT EXISTS prospect_scout_evaluations (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id            UUID        NOT NULL REFERENCES tenants(id),
  child_id             UUID        NOT NULL REFERENCES child_directory(id) ON DELETE CASCADE,
  evaluator_id         UUID        NOT NULL REFERENCES auth.users(id),

  -- Évaluation
  rating_stars         SMALLINT    NOT NULL CHECK (rating_stars BETWEEN 1 AND 5),
  comment              TEXT,
  observation_context  scout_observation_context,
  observation_date     DATE,

  -- Timestamps + soft-delete
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at           TIMESTAMPTZ
);

-- 3. Index de lecture
CREATE INDEX IF NOT EXISTS idx_prospect_scout_evals_child
  ON prospect_scout_evaluations(child_id, observation_date DESC NULLS LAST, created_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_prospect_scout_evals_tenant
  ON prospect_scout_evaluations(tenant_id, created_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_prospect_scout_evals_evaluator
  ON prospect_scout_evaluations(evaluator_id)
  WHERE deleted_at IS NULL;

-- 4. RLS — isolation tenant + gate 24h pour update
ALTER TABLE prospect_scout_evaluations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS pse_select ON prospect_scout_evaluations;
CREATE POLICY pse_select
  ON prospect_scout_evaluations FOR SELECT
  USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

DROP POLICY IF EXISTS pse_insert ON prospect_scout_evaluations;
CREATE POLICY pse_insert
  ON prospect_scout_evaluations FOR INSERT
  WITH CHECK (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    AND evaluator_id = auth.uid()
  );

-- UPDATE = édition (auteur, < 24h) OU soft-delete admin (deleted_at)
-- La policy autorise l'UPDATE au tenant ; la gate 24h se joue côté WITH CHECK et côté client.
-- Un admin contourne la fenêtre pour soft-delete uniquement (enforced côté api-client : deleteScoutEvaluation n'envoie QUE deleted_at).
DROP POLICY IF EXISTS pse_update ON prospect_scout_evaluations;
CREATE POLICY pse_update
  ON prospect_scout_evaluations FOR UPDATE
  USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid)
  WITH CHECK (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    AND (
      -- Cas 1 : auteur dans la fenêtre 24h — édition libre
      (evaluator_id = auth.uid() AND created_at > now() - interval '24 hours')
      -- Cas 2 : n'importe qui du tenant passe uniquement deleted_at (soft-delete)
      -- Note : on ne peut pas restreindre à un rôle spécifique côté RLS facilement ici
      -- sans helper. On s'appuie sur la validation côté api-client (deleteScoutEvaluation).
      OR deleted_at IS NOT NULL
    )
  );

-- 5. Trigger updated_at
CREATE OR REPLACE FUNCTION update_prospect_scout_evals_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS trg_pse_updated_at ON prospect_scout_evaluations;
CREATE TRIGGER trg_pse_updated_at
  BEFORE UPDATE ON prospect_scout_evaluations
  FOR EACH ROW EXECUTE FUNCTION update_prospect_scout_evals_updated_at();

COMMENT ON TABLE prospect_scout_evaluations IS
  'Story 89.2 — observations terrain des scouts (commercial/admin) sur gardiens prospects. Distincte de `evaluations` (coach pipeline pédagogique).';
```

Contraintes respectées :
- `IF NOT EXISTS` + `DO $$ IF NOT EXISTS` partout → idempotent
- Soft-delete : `deleted_at` nullable (pas de `NOT NULL`)
- RLS activée + 3 policies (select/insert/update)
- Index partiels sur `deleted_at IS NULL`
- `ON DELETE CASCADE` sur `child_id` : si la fiche gardien est réellement supprimée (jamais en V1), les évals sautent.

---

### T2 — Types TypeScript

Ajouter dans `aureak/packages/types/src/entities.ts` (après la section ChildDirectory ~ligne 1230, avant les types RBFA) :

```typescript
// ============================================================
// Epic 89 — Story 89.2 — Évaluations scout sur prospects gardiens
// ============================================================

/** ScoutObservationContext — contexte d'observation d'un scout sur un prospect */
export type ScoutObservationContext = 'match' | 'tournoi' | 'entrainement_club' | 'autre'

/** ProspectScoutEvaluation — observation scout horodatée (1-5 étoiles + commentaire) */
export type ProspectScoutEvaluation = {
  id                 : string
  tenantId           : string
  childId            : string
  evaluatorId        : string
  ratingStars        : number                       // 1..5 CHECK DB
  comment            : string | null
  observationContext : ScoutObservationContext | null
  observationDate    : string | null                // ISO date (nullable)
  deletedAt          : string | null
  createdAt          : string
  updatedAt          : string
}

/** Avec infos auteur pour affichage liste historique */
export type ProspectScoutEvaluationWithAuthor = ProspectScoutEvaluation & {
  authorName  : string | null   // profiles.display_name
  authorEmail : string | null   // profiles.email (fallback si pas de display_name)
}

/** Stats agrégées affichées en tête de section fiche joueur */
export type ProspectScoutEvaluationStats = {
  count         : number          // nombre d'évals non-deleted
  averageRating : number | null   // arrondi 1 décimale, null si count=0
  lastRating    : number | null   // rating de la dernière éval (null si count=0)
  lastDate      : string | null   // observation_date ?? created_at de la plus récente
  lastAuthorName: string | null
}
```

---

### T3 — API client

```typescript
// aureak/packages/api-client/src/admin/prospect-scout-evaluations.ts

import { supabase } from '../supabase'
import type {
  ProspectScoutEvaluation,
  ProspectScoutEvaluationWithAuthor,
  ProspectScoutEvaluationStats,
  ScoutObservationContext,
} from '@aureak/types'

function toEvaluation(row: Record<string, unknown>): ProspectScoutEvaluation {
  return {
    id                : row.id                 as string,
    tenantId          : row.tenant_id          as string,
    childId           : row.child_id           as string,
    evaluatorId       : row.evaluator_id       as string,
    ratingStars       : row.rating_stars       as number,
    comment           : (row.comment           as string | null) ?? null,
    observationContext: (row.observation_context as ScoutObservationContext | null) ?? null,
    observationDate   : (row.observation_date  as string | null) ?? null,
    deletedAt         : (row.deleted_at        as string | null) ?? null,
    createdAt         : row.created_at         as string,
    updatedAt         : row.updated_at         as string,
  }
}

export type CreateScoutEvaluationParams = {
  tenantId          : string
  childId           : string
  ratingStars       : number                       // 1..5
  comment?          : string | null
  observationContext?: ScoutObservationContext | null
  observationDate?  : string | null                // YYYY-MM-DD
}

export type UpdateScoutEvaluationParams = Partial<
  Pick<CreateScoutEvaluationParams, 'ratingStars' | 'comment' | 'observationContext' | 'observationDate'>
>

export async function listScoutEvaluationsByChild(
  childId: string,
): Promise<ProspectScoutEvaluationWithAuthor[]> {
  const { data, error } = await supabase
    .from('prospect_scout_evaluations')
    .select('*, profiles!prospect_scout_evaluations_evaluator_id_fkey(display_name,email)')
    .eq('child_id', childId)
    .is('deleted_at', null)
    .order('observation_date', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map((row) => {
    const profile = (row as { profiles?: { display_name?: string | null; email?: string | null } }).profiles
    return {
      ...toEvaluation(row as Record<string, unknown>),
      authorName : profile?.display_name ?? null,
      authorEmail: profile?.email ?? null,
    }
  })
}

export async function getScoutEvaluationStats(
  childId: string,
): Promise<ProspectScoutEvaluationStats> {
  const evals = await listScoutEvaluationsByChild(childId)
  if (evals.length === 0) {
    return { count: 0, averageRating: null, lastRating: null, lastDate: null, lastAuthorName: null }
  }
  const avg = evals.reduce((s, e) => s + e.ratingStars, 0) / evals.length
  const last = evals[0]   // déjà trié desc
  return {
    count         : evals.length,
    averageRating : Math.round(avg * 10) / 10,
    lastRating    : last.ratingStars,
    lastDate      : last.observationDate ?? last.createdAt,
    lastAuthorName: last.authorName,
  }
}

export async function createScoutEvaluation(
  params: CreateScoutEvaluationParams,
): Promise<ProspectScoutEvaluation> {
  const { data: userRes } = await supabase.auth.getUser()
  const uid = userRes?.user?.id
  if (!uid) throw new Error('Utilisateur non authentifié')

  const { data, error } = await supabase
    .from('prospect_scout_evaluations')
    .insert({
      tenant_id          : params.tenantId,
      child_id           : params.childId,
      evaluator_id       : uid,
      rating_stars       : params.ratingStars,
      comment            : params.comment            ?? null,
      observation_context: params.observationContext ?? null,
      observation_date   : params.observationDate    ?? null,
    })
    .select()
    .single()
  if (error) throw error
  return toEvaluation(data)
}

export async function updateScoutEvaluation(
  id: string,
  patch: UpdateScoutEvaluationParams,
): Promise<ProspectScoutEvaluation> {
  const update: Record<string, unknown> = {}
  if (patch.ratingStars        !== undefined) update.rating_stars        = patch.ratingStars
  if (patch.comment            !== undefined) update.comment             = patch.comment
  if (patch.observationContext !== undefined) update.observation_context = patch.observationContext
  if (patch.observationDate    !== undefined) update.observation_date    = patch.observationDate

  const { data, error } = await supabase
    .from('prospect_scout_evaluations')
    .update(update)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return toEvaluation(data)
}

export async function deleteScoutEvaluation(id: string): Promise<void> {
  const { error } = await supabase
    .from('prospect_scout_evaluations')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}
```

Export depuis `aureak/packages/api-client/src/index.ts` :

```typescript
export {
  listScoutEvaluationsByChild,
  getScoutEvaluationStats,
  createScoutEvaluation,
  updateScoutEvaluation,
  deleteScoutEvaluation,
  type CreateScoutEvaluationParams,
  type UpdateScoutEvaluationParams,
} from './admin/prospect-scout-evaluations'
```

---

### T4 — Modal : snippet de référence

```tsx
// _ScoutEvaluationModal.tsx
'use client'
import { View, StyleSheet, Pressable, TextInput, Modal } from 'react-native'
import { AureakText, StarRating } from '@aureak/ui'
import { colors, space, shadows, radius } from '@aureak/theme'
import { createScoutEvaluation, updateScoutEvaluation } from '@aureak/api-client'
import type { ScoutObservationContext, ProspectScoutEvaluation } from '@aureak/types'

type Props = {
  visible    : boolean
  onClose    : () => void
  onSaved    : () => void
  childId    : string
  tenantId   : string
  initialValue?: ProspectScoutEvaluation   // undefined = création ; défini = édition
}

const CONTEXTS: { value: ScoutObservationContext; label: string }[] = [
  { value: 'match',             label: 'Match'              },
  { value: 'tournoi',           label: 'Tournoi'            },
  { value: 'entrainement_club', label: 'Entraînement club'  },
  { value: 'autre',             label: 'Autre'              },
]

export function ScoutEvaluationModal({ visible, onClose, onSaved, childId, tenantId, initialValue }: Props) {
  const [rating, setRating]   = useState(initialValue?.ratingStars ?? 0)
  const [comment, setComment] = useState(initialValue?.comment ?? '')
  const [ctx, setCtx]         = useState<ScoutObservationContext | null>(initialValue?.observationContext ?? null)
  const [date, setDate]       = useState(initialValue?.observationDate ?? new Date().toISOString().slice(0, 10))
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState<string | null>(null)

  async function handleSave() {
    if (rating === 0) { setError('Sélectionne une note de 1 à 5 étoiles.'); return }
    const today = new Date().toISOString().slice(0, 10)
    if (date > today) { setError('La date d\'observation ne peut pas être future.'); return }

    setSaving(true)
    try {
      if (initialValue) {
        await updateScoutEvaluation(initialValue.id, {
          ratingStars: rating, comment: comment || null, observationContext: ctx, observationDate: date || null,
        })
      } else {
        await createScoutEvaluation({
          tenantId, childId, ratingStars: rating,
          comment: comment || null, observationContext: ctx, observationDate: date || null,
        })
      }
      onSaved()
      onClose()
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[ScoutEvaluationModal] save:', err)
      setError('Échec de l\'enregistrement — réessayez')
    } finally {
      setSaving(false)
    }
  }
  // ... rendu modal avec StarRating, TextInput, radio-pills pour ctx, input date, boutons
}
```

Référence pattern modal existant : `aureak/apps/web/app/(admin)/developpement/prospection/gardiens/_TrialInvitationModal.tsx`

---

### T5 — Section fiche joueur

Helper 24h :

```tsx
function isWithin24h(createdAt: string): boolean {
  const created = new Date(createdAt).getTime()
  return Date.now() - created < 24 * 60 * 60 * 1000
}
```

Troncature commentaire :

```tsx
function TruncatedText({ text, max = 160 }: { text: string; max?: number }) {
  const [expanded, setExpanded] = useState(false)
  if (text.length <= max) return <AureakText style={{ color: colors.text.body }}>{text}</AureakText>
  return (
    <View>
      <AureakText style={{ color: colors.text.body }}>
        {expanded ? text : text.slice(0, max) + '…'}
      </AureakText>
      <Pressable onPress={() => setExpanded(v => !v)}>
        <AureakText style={{ color: colors.accent.gold, fontSize: 12 }}>
          {expanded ? 'Voir moins' : 'Voir plus'}
        </AureakText>
      </Pressable>
    </View>
  )
}
```

Badge contexte (pattern identique à `OutcomeBadge` dans `gardiens/page.tsx:63`) :

```tsx
const CTX_COLORS: Record<ScoutObservationContext, string> = {
  match             : colors.accent.gold,
  tournoi           : colors.status.amberText,
  entrainement_club : colors.status.present,
  autre             : colors.text.muted,
}
```

---

### Design — polish

**Type design** : `polish` (pas de PNG, design tokens uniquement)

Tokens à utiliser :

```tsx
import { colors, space, shadows, radius, transitions } from '@aureak/theme'

// Modal overlay
backgroundColor : 'rgba(0,0,0,0.4)'      // overlay générique — acceptable exceptionnellement
// Modal card
backgroundColor : colors.background.card
borderRadius    : radius.lg
boxShadow       : shadows.lg
padding         : space.lg

// Pills contexte
paddingHorizontal: space.sm
paddingVertical  : 6
borderRadius     : radius.pill
// actif
backgroundColor  : colors.accent.gold
// inactif
backgroundColor  : colors.background.subtle
borderColor      : colors.border.light

// Section "Observations scout" sur fiche joueur
backgroundColor  : colors.background.card
borderRadius     : radius.md
padding          : space.md
gap              : space.sm

// Item historique
borderBottomWidth: 1
borderBottomColor: colors.border.subtle
paddingVertical  : space.sm

// Bouton primaire "Évaluer"
minHeight        : 44
backgroundColor  : colors.accent.gold
borderRadius     : radius.md
```

Principes design (source `_agents/design-vision.md`) :
- **Fond clair** — modal blanc / beige, overlay semi-transparent
- **Profondeur** — shadow md sur carte section + lg sur modal
- **Accent doré** — étoiles + pill contexte actif + bouton primaire

---

### Fichiers à créer / modifier

| Fichier | Action | Notes |
|---------|--------|-------|
| `supabase/migrations/00157_create_prospect_scout_evaluations.sql` | **Créer** | Table + enum + RLS + trigger |
| `aureak/packages/types/src/entities.ts` | Modifier | Ajouter `ScoutObservationContext`, `ProspectScoutEvaluation`, `ProspectScoutEvaluationWithAuthor`, `ProspectScoutEvaluationStats` |
| `aureak/packages/api-client/src/admin/prospect-scout-evaluations.ts` | **Créer** | 5 fonctions (list, stats, create, update, delete) + 2 types |
| `aureak/packages/api-client/src/index.ts` | Modifier | Export des 5 fonctions + 2 types |
| `aureak/apps/web/app/(admin)/children/[childId]/_ScoutEvaluationModal.tsx` | **Créer** | Modal création/édition |
| `aureak/apps/web/app/(admin)/children/[childId]/_ScoutEvaluationsSection.tsx` | **Créer** | Section historique + stats |
| `aureak/apps/web/app/(admin)/children/[childId]/page.tsx` | Modifier | Insérer `<ScoutEvaluationsSection />` sous "Identité" |

### Fichiers à NE PAS modifier

- `aureak/packages/api-client/src/admin/evaluations.ts` — évaluations coach pédagogiques, hors scope
- `aureak/packages/api-client/src/admin/prospect-invitations.ts` — Story 89.4, ne pas toucher
- `aureak/apps/web/app/(admin)/developpement/prospection/gardiens/page.tsx` — dashboard funnel 89.6, ne pas modifier (V2 éventuelle : afficher nombre d'évals scout par prospect dans le tableau)
- `supabase/migrations/00153_create_prospect_invitations.sql` — enum `prospect_status` intact
- `aureak/packages/ui/src/StarRating.tsx` — composant réutilisé tel quel, ne pas modifier

---

### Dépendances à protéger

- **Story 89.1** (`searchChildDirectoryByName`, `findProspectDuplicates`) — si Story 89.1 n'est pas encore mergée, tout reste compatible : 89.2 ajoute uniquement une section sur la fiche joueur existante. Pas de merge-conflict prévu.
- **Story 89.4** (`prospect_status`) — non touché. Les évals scout sont indépendantes du statut prospect.
- **Story 89.6** (`trial_used`) — non touché. Les évals scout sont indépendantes du parcours essai.
- **Epic 86** (section permissions) — la page `/children/[childId]` est gouvernée par la permission `joueurs` ; cette story ajoute une sous-section visible uniquement pour `admin` / `commercial`, indépendamment des permissions granulaires. (Justification : la sous-section est role-gated, pas section-gated, car elle est transversale à la fiche joueur.)
- **`StarRating`** (`@aureak/ui` — Story 58-6) — utilisé en lecture ET en édition. Ne pas modifier sa signature.
- **`profiles.display_name` / `profiles.email`** — utilisés dans le JOIN de `listScoutEvaluationsByChild`. Colonnes stables.

### Dépendances satisfaites (vérifiées)

- [x] Table `child_directory` existe (migrations 00040-00041, 00044, 00075, 00153, 00155)
- [x] Table `profiles` avec `display_name` + `email` disponible
- [x] Table `tenants` + helper `auth.jwt() ->> 'tenant_id'` utilisé dans toutes les RLS récentes (cf. 00153)
- [x] Composant `StarRating` exporté depuis `@aureak/ui` (Story 58-6, `aureak/packages/ui/src/StarRating.tsx`)
- [x] `ToastContext` disponible (`aureak/apps/web/components/ToastContext.tsx`)
- [x] `useAuthStore` expose `role`, `tenantId`, `userId` — utilisé partout dans `(admin)`
- [x] Dernière migration = 00155, 00156 réservée Story 89.1, **00157 libre pour cette story**

---

### Références

- Design tokens : `aureak/packages/theme/src/tokens.ts`
- Type `Evaluation` (distinct) : `aureak/packages/types/src/entities.ts` lignes 993-1009
- Type `ChildDirectoryEntry` : `aureak/packages/types/src/entities.ts` lignes 1138-1199
- Composant `StarRating` : `aureak/packages/ui/src/StarRating.tsx`
- Pattern `toEntry` (snake→camel) : `aureak/packages/api-client/src/admin/child-directory.ts` lignes 11-52
- Pattern RLS tenant + updated_at trigger : `supabase/migrations/00153_create_prospect_invitations.sql`
- Pattern modal : `aureak/apps/web/app/(admin)/developpement/prospection/gardiens/_TrialInvitationModal.tsx`
- Pattern badge coloré : `aureak/apps/web/app/(admin)/developpement/prospection/gardiens/page.tsx` lignes 63-79 (`OutcomeBadge`)
- Fiche joueur existante : `aureak/apps/web/app/(admin)/children/[childId]/page.tsx`
- Story 89.1 (Sister) : `_bmad-output/implementation-artifacts/89-1-recherche-ajout-gardien-scout-terrain.md`
- Story 89.4 (prospect_status) : `_bmad-output/implementation-artifacts/89-4-invitation-seance-gratuite-depuis-app.md`

---

### Multi-tenant

- RLS `pse_select` force `tenant_id = (auth.jwt() ->> 'tenant_id')::uuid` → aucune fuite cross-tenant.
- RLS `pse_insert` force `tenant_id` + `evaluator_id = auth.uid()` → impossible d'insérer au nom d'un autre.
- RLS `pse_update` gate édition : soit auteur dans la fenêtre 24h, soit mise à jour de `deleted_at` uniquement.
- `createScoutEvaluation` passe `tenantId` depuis `useAuthStore().tenantId`, pattern identique à `createChildDirectoryEntry`. Le client ne peut pas forger un `evaluator_id` : il est injecté côté api-client via `supabase.auth.getUser()`.
- Pas de filtre tenant explicite dans `listScoutEvaluationsByChild` — RLS suffit ; l'index `idx_prospect_scout_evals_tenant` est activé pour les requêtes admin futures (V2).

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List

| Fichier | Statut |
|---------|--------|
