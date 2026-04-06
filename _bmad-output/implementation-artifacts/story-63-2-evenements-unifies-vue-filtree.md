# Story 63.2 : Évènements — vue unifiée filtrée par type (Stages + 4 nouveaux types)

Status: done

Epic: 63 — Navigation refactoring orientée usage

## Story

En tant qu'admin Aureak,
je veux accéder à tous les types d'évènements (Stages, Tournois, Fun Day, Detect Day, Séminaires) depuis une seule page `/evenements` avec filtres,
afin de gérer tous les évènements sans naviguer entre plusieurs sous-menus.

## Acceptance Criteria

1. La page `/evenements` affiche une liste unifiée de tous les évènements, filtrables par type : Stages · Tournois Goal à Goal · Fun Day · Detect Day · Séminaires. Le filtre "Tous" est actif par défaut.
2. Une migration idempotente ajoute le type `event_type_enum` à la table `stages` (ou crée une table `events` générique si `stages` ne peut pas être étendue sans rupture) avec les valeurs : `stage`, `tournoi`, `fun_day`, `detect_day`, `seminaire`.
3. La valeur par défaut du champ type pour les stages existants est `stage` — migration non destructive.
4. Chaque carte d'évènement dans la liste affiche : titre, type (pill colorée), date de début, implantation, statut.
5. Le clic sur une carte navigue vers la fiche détail de l'évènement — pour les stages existants, vers `/stages/[stageId]` (route préservée).
6. Un bouton "Nouvel évènement" ouvre un formulaire (ou modal) permettant de sélectionner le type en premier, puis de remplir les infos générales. Pour les types non encore implémentés (tournoi, fun_day, detect_day, seminaire), afficher "Création bientôt disponible" après la sélection du type.
7. Les filtres sont persistants en URL query param (`?type=stage`) pour pouvoir partager le lien.
8. La page `/stages` existante continue de fonctionner (backward compat) — elle peut rediriger vers `/evenements?type=stage` ou rester accessible directement.
9. Design : pills de filtre colorées par type (couleur spécifique par type via `colors.phase.*` ou token équivalent), cards avec badge type en coin supérieur droit.

## Tasks / Subtasks

- [x] T1 — Migration SQL : ajout `event_type` sur `stages` (AC: 2, 3)
  - [x] T1.1 — Créer `supabase/migrations/00135_stages_add_event_type.sql` (numérotée 00135, car 00134 était déjà pris)
  - [x] T1.2 — Ajouter type enum `event_type_enum` avec IF NOT EXISTS
  - [x] T1.3 — Ajouter colonne `event_type event_type_enum NOT NULL DEFAULT 'stage'` sur la table `stages` avec IF NOT EXISTS guard
  - [x] T1.4 — Migration créée (push à faire en local)

- [x] T2 — Types TypeScript (AC: 2)
  - [x] T2.1 — Ajouter `EventType = 'stage' | 'tournoi' | 'fun_day' | 'detect_day' | 'seminaire'` dans `aureak/packages/types/src/enums.ts`
  - [x] T2.2 — Ajouter `EVENT_TYPES: EventType[]` constant + `EVENT_TYPE_LABELS`
  - [x] T2.3 — Mettre à jour le type `Stage` dans `entities.ts` : ajouter `eventType: EventType`

- [x] T3 — API client (AC: 1, 4)
  - [x] T3.1 — Dans `aureak/packages/api-client/src/admin/stages.ts`, mettre à jour `mapStage()` pour inclure `event_type`
  - [x] T3.2 — Ajouter `listEvents(filter?: { type?: EventType })` qui query la table `stages` avec filtre optionnel sur `event_type`
  - [x] T3.3 — `listStages()` existant préservé sans modification de signature, `listEvents` exporté dans index.ts

- [x] T4 — Page `/evenements` (AC: 1, 4, 5, 6, 7, 9)
  - [x] T4.1 — Créer `aureak/apps/web/app/(admin)/evenements/page.tsx` (remplace stub story 63.1)
  - [x] T4.2 — `aureak/apps/web/app/(admin)/evenements/index.tsx` existe déjà (re-export)
  - [x] T4.3 — Filter pills horizontales (Tous + 5 types) avec `useLocalSearchParams` pour URL query
  - [x] T4.4 — Cards `EventCard` (titre, type pill, date début, implantation, statut)
  - [x] T4.5 — Modal "Nouvel évènement" → si `stage` : redirect `/stages/new` ; sinon : banner stub
  - [x] T4.6 — Loading skeleton + empty state

- [x] T5 — Backward compat `/stages` (AC: 8)
  - [x] T5.1 — Routes `/stages`, `/stages/new`, `/stages/[stageId]` non modifiées
  - [x] T5.2 — Non implémenté (optionnel selon story)

- [x] T6 — Validation (AC: tous)
  - [x] T6.1 — Architecture permet d'afficher tous les stages avec type "stage" (default DB)
  - [x] T6.2 — Filtre par type via `listEvents({ type })` en query Supabase
  - [x] T6.3 — URL `?type=stage` → `useLocalSearchParams` → filtre appliqué au chargement
  - [x] T6.4 — `handleCardPress` → `router.push('/stages/[id]')`
  - [x] T6.5 — `npx tsc --noEmit` → 0 erreur ✅

## Dev Notes

### ⚠️ Contraintes Stack

Ce projet utilise :
- **React Native Web** (View, Pressable, StyleSheet) — pas de Tailwind
- **Tokens `@aureak/theme`** : `colors`, `space`, `shadows`, `radius`
- **Accès Supabase UNIQUEMENT via `@aureak/api-client`**
- **Try/finally obligatoire** sur tout setState de chargement

---

### T1 — Migration SQL

**Migration : 00134_stages_add_event_type.sql**

```sql
-- Migration 00134 — Story 63.2
-- Ajout du type d'évènement sur la table stages
-- Permet d'unifier stages, tournois, fun day, detect day, séminaires dans une vue unique.

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'event_type_enum') THEN
    CREATE TYPE event_type_enum AS ENUM (
      'stage',
      'tournoi',
      'fun_day',
      'detect_day',
      'seminaire'
    );
  END IF;
END $$;

ALTER TABLE stages
  ADD COLUMN IF NOT EXISTS event_type event_type_enum NOT NULL DEFAULT 'stage';

-- Index pour le filtre fréquent
CREATE INDEX IF NOT EXISTS idx_stages_event_type ON stages(event_type);
```

---

### T4 — EventCard + Filter Pills design

**Couleurs par type** (utiliser `colors.phase.*` ou définir localement avec tokens) :

```tsx
const EVENT_TYPE_CONFIG: Record<EventType, { label: string; color: string; bg: string }> = {
  stage      : { label: 'Stage',              color: colors.gold,           bg: 'rgba(201,168,76,0.12)' },
  tournoi    : { label: 'Tournoi Goal à Goal', color: colors.accent.blue,   bg: 'rgba(79,142,247,0.12)' },
  fun_day    : { label: 'Fun Day',             color: colors.status.success, bg: 'rgba(16,185,129,0.12)' },
  detect_day : { label: 'Detect Day',          color: colors.accent.red,    bg: 'rgba(224,82,82,0.12)' },
  seminaire  : { label: 'Séminaire',           color: colors.text.subtle,   bg: 'rgba(255,255,255,0.08)' },
}
```

**Pattern URL query param avec Expo Router :**
```tsx
import { useLocalSearchParams, useRouter } from 'expo-router'

const { type } = useLocalSearchParams<{ type?: string }>()
const activeType = (type as EventType | undefined) ?? null

// Changer filtre
const setFilter = (t: EventType | null) => {
  router.replace(t ? `/evenements?type=${t}` : '/evenements')
}
```

---

### Fichiers à créer / modifier

| Fichier | Action | Notes |
|---------|--------|-------|
| `supabase/migrations/00134_stages_add_event_type.sql` | Créer | Migration idempotente |
| `aureak/packages/types/src/enums.ts` | Modifier | Ajouter `EventType`, `EVENT_TYPES` |
| `aureak/packages/types/src/entities.ts` | Modifier | `Stage.eventType: EventType` |
| `aureak/packages/api-client/src/admin/stages.ts` | Modifier | `listEvents()`, update `listStages()` select |
| `aureak/apps/web/app/(admin)/evenements/page.tsx` | Créer | Vue unifiée |
| `aureak/apps/web/app/(admin)/evenements/index.tsx` | Créer | Re-export page |

### Fichiers à NE PAS modifier

- `aureak/apps/web/app/(admin)/stages/` — routes existantes préservées
- `aureak/apps/web/app/(admin)/_layout.tsx` — déjà mis à jour en story 63.1

---

### Dépendances à protéger

- Story 53.8 (Season Planner) utilise `listStages()` → ne pas modifier la signature de retour, seulement ajouter `eventType`
- Story 49.6 utilise la table `stages` → la migration doit être strictement additive

### Dépendances prérequises

- Story 63.1 doit être `done` (sidebar pointe vers `/evenements`)

---

### Multi-tenant

RLS existant sur `stages` inclut déjà le filtre `tenant_id` — la vue `/evenements` hérite automatiquement de l'isolation tenant.

## Dev Agent Record

### Agent Model Used
claude-sonnet-4-6

### Debug Log References
- Migration numérotée 00135 (pas 00134 comme dans la story — 00134 était déjà pris par `coach_implantation_assignments_add_unassigned_at.sql`)
- `academyStatus.ts` avait son propre `mapStage()` → corrigé pour inclure `eventType`
- `export type { EventType }` retiré de entities.ts (déjà exporté depuis enums.ts → doublon TS interdit)

### Completion Notes List
- Migration strictement additive (IF NOT EXISTS) — zéro risque de rupture
- `listStages()` inchangé en signature — compatibilité Story 53.8 préservée
- Filter pills avec scroll horizontal pour accommoder 6 options
- Modal type-picker : stage → redirect /stages/new ; autres types → banner stub "bientôt disponible"
- `npx tsc --noEmit` → 0 erreur

### Code Review (claude-sonnet-4-6 — 2026-04-06)

#### Problèmes trouvés et corrigés

| Sévérité | Fichier | Ligne | Problème | Correction |
|----------|---------|-------|----------|------------|
| MEDIUM | `evenements/page.tsx` | 20-24 | `bg` dans `EVENT_TYPE_CONFIG` utilisait des valeurs `rgba()` hardcodées au lieu de tokens `@aureak/theme` | Remplacé par `colors.TOKEN + '1f'` (pattern codebase — hex 0x1f ≈ 12% opacité) |
| LOW | `evenements/page.tsx` | 311 | `colors.accent.red + '15'` — suffixe hex `'15'` incohérent (devrait être `'1f'` comme le reste) | Corrigé → `colors.accent.red + '1f'` |

#### Vérifications conformité (PASS)

| Règle | Résultat |
|-------|----------|
| try/finally sur setLoading | ✅ PASS — `setLoading(false)` dans `finally` (load(), ligne 204-206) |
| Console guard `NODE_ENV !== 'production'` | ✅ PASS — ligne 202 |
| Accès Supabase via `@aureak/api-client` uniquement | ✅ PASS — `import { listEvents } from '@aureak/api-client'` |
| Styles via tokens `@aureak/theme` | ✅ PASS après corrections |
| Routing Expo : `page.tsx` + `index.tsx` re-export | ✅ PASS — `evenements/index.tsx` existe |
| TypeScript `npx tsc --noEmit` | ✅ PASS — 0 erreur post-correction |

#### Verdict : PASS — tous les problèmes HIGH et MEDIUM corrigés

### File List

| Fichier | Statut |
|---------|--------|
| `supabase/migrations/00135_stages_add_event_type.sql` | Créé |
| `aureak/packages/types/src/enums.ts` | Modifié — EventType, EVENT_TYPES, EVENT_TYPE_LABELS |
| `aureak/packages/types/src/entities.ts` | Modifié — Stage.eventType, import EventType |
| `aureak/packages/api-client/src/admin/stages.ts` | Modifié — mapStage + listEvents |
| `aureak/packages/api-client/src/academy/academyStatus.ts` | Modifié — mapStage eventType |
| `aureak/packages/api-client/src/index.ts` | Modifié — export listEvents |
| `aureak/apps/web/app/(admin)/evenements/page.tsx` | Remplacé (stub → implémentation complète) + corrigé (code review) |
