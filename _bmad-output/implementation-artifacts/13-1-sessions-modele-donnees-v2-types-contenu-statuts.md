# Story 13.1 : Sessions — Modèle de Données v2 (Types, Contenu & Statuts)

Status: review

## Story

En tant qu'Admin,
Je veux que chaque séance porte son type pédagogique (Goal & Player, Technique, Situationnel, Décisionnel, Perfectionnement, Intégration, Équipe) et une référence de contenu structurée adaptée à chaque méthode,
Afin de planifier, tracer et analyser le contenu réellement dispensé sur le terrain pour chaque groupe.

## Contexte & Décisions de Design

### Les 7 types de séances
| Type | Contexte | Contenu pré-construit | Numérotation |
|---|---|---|---|
| `goal_and_player` | Académie | Oui — bibliothèque GP | 3 modules × 5 entraînements = 15, répétés 2× |
| `technique` | Académie | Oui — bibliothèque Technique | 8 modules × 4 entraînements = 32 (académie) |
| `technique` | Stage | Oui — concepts stage | Concept × 8 entraînements par concept |
| `situationnel` | Académie | Oui — blocs situationnels | TAB-01, 1V1-03, etc. |
| `décisionnel` | Académie | Non — coach crée à la volée | Blocs libres titrés |
| `perfectionnement` | On-demand | Non | Sans numérotation |
| `intégration` | Académie | Non | Sans numérotation |
| `equipe` | Académie/Stage | Non | Sans numérotation |

### Adressage du contenu (`content_ref JSONB`)
Chaque type a son propre schéma JSONB :
```jsonc
// goal_and_player
{ "module": 1, "sequence": 3, "global_number": 8, "half": "A", "repeat": 1 }

// technique — académie
{ "context": "academie", "module": 2, "sequence": 4, "global_number": 8 }

// technique — stage
{ "context": "stage", "concept": "Prise en main", "sequence": 3 }

// situationnel
{ "bloc_code": "TAB", "sequence": 1, "label": "TAB-01", "subtitle": "Saut d'allègement" }

// décisionnel
{ "blocks": [{ "title": "Échauffement 1" }, { "title": "Situation 1" }] }

// perfectionnement / intégration / equipe
{ }  // vide — pas de contenu pré-construit
```

### Blocs situationnels (codes)
`TAB` (tir au but) | `1V1` (un contre un) | `BAL_AER` (balles aériennes) | `BAL_PROF` (balles en profondeur) | `REL` (relances) | `PHA_ARR` (phases arrêtées) | `COMM` (communication/autre)

### Héritage groupe → séance (snapshot figé)
Au moment de la création d'une séance, les données du groupe (jour, heure, durée, staff, joueurs) sont **copiées en snapshot** dans la séance. Elles ne changent plus automatiquement si le groupe évolue. L'admin peut propager un changement de groupe vers les séances futures via une action explicite (Story 13-2).

### Joueur invité (gardien test)
Un joueur non-membre du groupe peut être ajouté ponctuellement à une séance via le statut `trial` dans `session_attendees`. Le flag `is_guest = true` distingue ces ajouts du roster habituel. La suppression du joueur du groupe n'efface pas sa présence dans les séances déjà validées.

## Acceptance Criteria

**AC1 — Enum `session_type` en DB**
- **Given** la migration `00057_sessions_v2_type_content.sql` appliquée
- **When** un INSERT sur `sessions` est fait
- **Then** la colonne `session_type` accepte exactement : `goal_and_player | technique | situationnel | decisionnel | perfectionnement | integration | equipe` et est NOT NULL

**AC2 — `content_ref` JSONB sur `sessions`**
- **And** la colonne `content_ref JSONB NOT NULL DEFAULT '{}'` existe sur `sessions`
- **And** aucun CHECK contraignant sur la structure JSONB (flexible par design)

**AC3 — `cancellation_reason` sur `sessions`**
- **And** la colonne `cancellation_reason TEXT NULL` existe sur `sessions`
- **And** elle n'est remplie que si `status = 'annulée'`

**AC4 — `is_guest` sur `session_attendees`**
- **And** la colonne `is_guest BOOLEAN NOT NULL DEFAULT false` existe sur `session_attendees`
- **And** un joueur avec `is_guest = true` peut être ajouté à une séance sans être membre du groupe
- **And** la suppression du joueur du groupe ne supprime pas ses lignes dans `session_attendees` pour les séances passées

**AC5 — Types TypeScript miroir (ARCH-12)**
- **And** `SessionType` est exporté depuis `@aureak/types` avec les 7 valeurs
- **And** `SESSION_TYPES: SessionType[]` constante exportée
- **And** `SessionContentRef` est un type union discriminé par méthode
- **And** `SituationalBlocCode` est exporté avec les 7 codes

**AC6 — API mise à jour**
- **And** `createSession()` et `updateSession()` dans `@aureak/api-client` acceptent `sessionType` et `contentRef`
- **And** `addGuestToSession(sessionId, childId)` existe → INSERT `session_attendees` avec `is_guest = true, status = 'trial'`
- **And** `removeGuestFromSession(sessionId, childId)` existe → DELETE (seulement si `is_guest = true`)

**AC7 — Formulaire admin : champ session_type**
- **And** le formulaire `sessions/new.tsx` expose un sélecteur `session_type` (requis)
- **And** selon le type sélectionné, un sous-formulaire `content_ref` adapté s'affiche :
  - GP : sélecteur module (1-3) + séquence (1-5) → affiche le numéro global calculé + demi (A/B) + répétition (1/2)
  - Technique académie : module (1-8) + séquence (1-4) → numéro global calculé
  - Technique stage : champ concept (texte libre) + séquence (1-8)
  - Situationnel : sélecteur bloc code + séquence → affiche le label TAB-01
  - Décisionnel : liste de blocs avec titre (ajout/suppression dynamique)
  - Perfectionnement / Intégration / Équipe : aucun sous-formulaire

**AC8 — RLS propre**
- **And** `supabase db diff` reste clean après migration
- **And** aucune policy RLS cassée par les nouvelles colonnes

## Tasks / Subtasks

- [x] Task 1 — Migration `00058_sessions_v2_type_content.sql` (AC: #1, #2, #3, #4)
  - [x] 1.1 Créer le type ENUM PostgreSQL `session_type_v2`
  - [x] 1.2 ALTER TABLE `sessions` ADD COLUMN `session_type` + `content_ref` + `cancellation_reason` (IF NOT EXISTS)
  - [x] 1.3 ALTER TABLE `session_attendees` ADD COLUMN `is_guest BOOLEAN NOT NULL DEFAULT false`
  - [x] 1.4 Backfill : `session_type` nullable — backfill manuel via Supabase dashboard si nécessaire
  - [x] 1.5 Vérifier RLS — aucune policy à modifier pour les nouvelles colonnes. COMMENT ON ajoutés.

- [x] Task 2 — Types TypeScript `@aureak/types` (AC: #5)
  - [x] 2.1 Ajouter `SessionType`, `SESSION_TYPES[]`, `SESSION_TYPE_LABELS`, `SituationalBlocCode`, `SITUATIONAL_BLOC_CODES[]`, `SITUATIONAL_BLOC_LABELS` dans `enums.ts`
  - [x] 2.2 Créer les types union discriminés `GPContentRef`, `TechniqueAcademieContentRef`, `TechniqueStageContentRef`, `SituationnelContentRef`, `DecisionnelContentRef`, `EmptyContentRef`, `SessionContentRef` dans `entities.ts`
  - [x] 2.3 Étendre le type `Session` avec `sessionType: SessionType | null`, `contentRef: SessionContentRef`
  - [x] 2.4 Étendre `SessionAttendee` avec `isGuest: boolean`

- [x] Task 3 — API `@aureak/api-client` (AC: #6)
  - [x] 3.1 Mettre à jour `createSession()` et `updateSession()` : mapper `sessionType` → `session_type`, `contentRef` → `content_ref`
  - [x] 3.2 Ajouter `addGuestToSession(sessionId, childId, tenantId)` avec upsert idempotent
  - [x] 3.3 Ajouter `removeGuestFromSession(sessionId, childId)` — sécurisé : DELETE WHERE is_guest=true
  - [x] 3.4 Mettre à jour `listSessionAttendees()` : inclure `is_guest` dans le SELECT + mapping camelCase
  - [x] 3.5 Exporter `addGuestToSession`, `removeGuestFromSession` depuis `index.ts`

- [x] Task 4 — UI Admin : formulaire sessions/new.tsx (AC: #7)
  - [x] 4.1 Ajouter le sélecteur `session_type` (chip buttons, visible dès qu'un groupe est sélectionné)
  - [x] 4.2 Sous-formulaire conditionnel `contentRef` inline par type (ss2 styles)
  - [x] 4.3 Pour GP : calculer et afficher numéro global + sélecteurs module/séquence/demi/répétition
  - [x] 4.4 Pour Technique académie : module (1-8) + séquence (1-4) → numéro global calculé
  - [x] 4.5 Pour Situationnel : sélecteur `SITUATIONAL_BLOC_CODES` + séquence → label auto TAB-01
  - [x] 4.6 Pour Décisionnel : liste de blocs avec titre + bouton "+ Ajouter un bloc" + suppression
  - [x] 4.7 Validation : `contentRefValid` = false si Technique/Stage sans concept ; step1Valid inclut contentRefValid

- [x] Task 5 — UI Admin : `sessions/[sessionId]/page.tsx` (AC: #7)
  - [x] 5.1 Afficher `session_type` (Badge goldOutline) + contenu décodé via `contentRefLabel()`
  - [x] 5.2 Section "Joueurs invités" : liste des `isGuest = true` + bouton "Ajouter un gardien"
  - [x] 5.3 PlayerPicker inline : TextInput search → `listChildDirectory({search})` → top 8 résultats → clic = `addGuestToSession()`
  - [x] 5.4 Afficher `cancellationReason` si `status = 'annulée'` avec fond rouge

## Dev Notes

### Migration `00057_sessions_v2_type_content.sql`

```sql
-- Enum session_type
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'session_type_v2') THEN
    CREATE TYPE session_type_v2 AS ENUM (
      'goal_and_player',
      'technique',
      'situationnel',
      'decisionnel',
      'perfectionnement',
      'integration',
      'equipe'
    );
  END IF;
END $$;

-- Colonnes sur sessions
ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS session_type      session_type_v2 NULL,
  ADD COLUMN IF NOT EXISTS content_ref       JSONB NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS cancellation_reason TEXT NULL;

-- Colonne is_guest sur session_attendees
ALTER TABLE session_attendees
  ADD COLUMN IF NOT EXISTS is_guest BOOLEAN NOT NULL DEFAULT false;

-- Index pour recherche par type
CREATE INDEX IF NOT EXISTS sessions_session_type_idx ON sessions (tenant_id, session_type);
```

> Note : `session_type` est nullable temporairement pour permettre le backfill sur les séances existantes. Une migration de suivi pourra le rendre NOT NULL une fois backfill validé.

### Types TypeScript à créer dans `packages/types/src/enums.ts`

```typescript
export type SessionType =
  | 'goal_and_player'
  | 'technique'
  | 'situationnel'
  | 'decisionnel'
  | 'perfectionnement'
  | 'integration'
  | 'equipe'

export const SESSION_TYPES: SessionType[] = [
  'goal_and_player', 'technique', 'situationnel', 'decisionnel',
  'perfectionnement', 'integration', 'equipe',
]

export const SESSION_TYPE_LABELS: Record<SessionType, string> = {
  goal_and_player : 'Goal & Player',
  technique       : 'Technique',
  situationnel    : 'Situationnel',
  decisionnel     : 'Décisionnel',
  perfectionnement: 'Perfectionnement',
  integration     : 'Intégration',
  equipe          : 'Équipe',
}

export type SituationalBlocCode =
  | 'TAB'      // Tir au but
  | '1V1'      // Un contre un
  | 'BAL_AER'  // Balles aériennes
  | 'BAL_PROF' // Balles en profondeur
  | 'REL'      // Relances
  | 'PHA_ARR'  // Phases arrêtées
  | 'COMM'     // Communication / Autre

export const SITUATIONAL_BLOC_CODES: SituationalBlocCode[] = [
  'TAB', '1V1', 'BAL_AER', 'BAL_PROF', 'REL', 'PHA_ARR', 'COMM',
]

export const SITUATIONAL_BLOC_LABELS: Record<SituationalBlocCode, string> = {
  TAB     : 'Tir au but',
  '1V1'   : 'Un contre un',
  BAL_AER : 'Balles aériennes',
  BAL_PROF: 'Balles en profondeur',
  REL     : 'Relances',
  PHA_ARR : 'Phases arrêtées',
  COMM    : 'Communication / Autre',
}
```

### Type `SessionContentRef` dans `packages/types/src/entities.ts`

```typescript
export type GPContentRef = {
  method: 'goal_and_player'
  module: number        // 1-3
  sequence: number      // 1-5
  globalNumber: number  // (module-1)*5 + sequence
  half: 'A' | 'B'      // demi-séquence (15 A + 15 B par an)
  repeat: 1 | 2        // 1ère ou 2ème répétition dans l'année
}

export type TechniqueAcademieContentRef = {
  method: 'technique'
  context: 'academie'
  module: number        // 1-8
  sequence: number      // 1-4
  globalNumber: number  // (module-1)*4 + sequence
}

export type TechniqueStageContentRef = {
  method: 'technique'
  context: 'stage'
  concept: string       // ex: "Prise en main"
  sequence: number      // 1-8
}

export type SituationnelContentRef = {
  method: 'situationnel'
  blocCode: SituationalBlocCode
  sequence: number      // 1..N
  label: string         // ex: "TAB-01"
  subtitle?: string     // ex: "Saut d'allègement"
}

export type DecisionnelContentRef = {
  method: 'decisionnel'
  blocks: Array<{ title: string }>
}

export type EmptyContentRef = {
  method: 'perfectionnement' | 'integration' | 'equipe'
}

export type SessionContentRef =
  | GPContentRef
  | TechniqueAcademieContentRef
  | TechniqueStageContentRef
  | SituationnelContentRef
  | DecisionnelContentRef
  | EmptyContentRef
```

### Règles métier à documenter

- Un coach ne peut avoir qu'une seule séance active dans un créneau horaire (validation côté API, warning côté UI)
- `content_ref.globalNumber` pour GP est calculé côté front et stocké en JSONB (dénormalisé intentionnellement pour lisibilité)
- Pour Situationnel, `label` = `${blocCode}-${String(sequence).padStart(2, '0')}` (ex: `TAB-01`)
- `is_guest = true` n'empêche pas l'évaluation : un gardien invité peut être évalué normalement

## File List

### New Files
- `supabase/migrations/00058_sessions_v2_type_content.sql`

### Modified Files
- `aureak/packages/types/src/enums.ts` — SessionType, SESSION_TYPES, SESSION_TYPE_LABELS, SituationalBlocCode, SITUATIONAL_BLOC_CODES, SITUATIONAL_BLOC_LABELS
- `aureak/packages/types/src/entities.ts` — GPContentRef, TechniqueAcademieContentRef, TechniqueStageContentRef, SituationnelContentRef, DecisionnelContentRef, EmptyContentRef, SessionContentRef; Session étendu (sessionType, contentRef); SessionAttendee étendu (isGuest)
- `aureak/packages/api-client/src/sessions/sessions.ts` — createSession, updateSession (sessionType+contentRef), listSessionAttendees (is_guest mapping), addGuestToSession, removeGuestFromSession
- `aureak/packages/api-client/src/index.ts` — export addGuestToSession, removeGuestFromSession
- `aureak/apps/web/app/(admin)/sessions/new.tsx` — import SESSION_TYPES/LABELS/SITUATIONAL_BLOC_CODES, nouveaux états sessionType+contentRef, sous-formulaire conditionnel, styles ss2, step1Valid mis à jour, handleCreate mis à jour
- `aureak/apps/web/app/(admin)/sessions/[sessionId]/page.tsx` — import SESSION_TYPE_LABELS, listSessionAttendees/addGuestToSession/removeGuestFromSession/listChildDirectory, état attendees+guestSearch+guestResults, contentRefLabel(), affichage type+contenu, section joueurs invités avec PlayerPicker, annulation redesignée rouge

## Dev Agent Record

- [x] Implémenté le 2026-03-09 — story 13-1 complète
- [x] Migration 00058 (numéro ajusté car 00057 déjà pris par situations_link_bloc)
- [x] `cancellation_reason` était déjà présent dans la DB (API existante) → ADD COLUMN IF NOT EXISTS idempotent
- [x] `index.ts` côté types ne nécessite pas de modification (export * from entities/enums suffit)
- [x] Story est le fondement des Stories 13-2 (Calendrier & Auto-génération) et 13-3 (Mode Séance Coach)

## Change Log

- 2026-03-09 : Implémentation complète story 13-1 — migration 00058, types TS SessionType/SessionContentRef, API addGuestToSession/removeGuestFromSession, UI sessions/new.tsx (sélecteur type + sous-formulaire contentRef), UI sessions/[sessionId]/page.tsx (affichage type/contenu, section joueurs invités)
