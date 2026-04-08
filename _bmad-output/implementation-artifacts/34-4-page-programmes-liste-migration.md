# Story 34.4 : Page Programmes — Liste + Migration

Status: done

## Story

En tant qu'admin,
je veux une page liste des programmes pédagogiques dans la section Méthodologie,
afin de visualiser l'organisation des entraînements par méthode et par saison académique.

## Acceptance Criteria

1. **Migration 00142** créée : table `methodology_programmes` + table de jointure `methodology_programme_sessions`.
2. **Type TS** `MethodologyProgramme` + `MethodologyProgrammeSession` dans `@aureak/types`.
3. **API** `listMethodologyProgrammes({ activeOnly? })` dans `@aureak/api-client` — retourne les programmes avec `accomplishment` calculé (nb sessions avec date / total prévu).
4. **Page** `/methodologie/programmes/index.tsx` créée avec le même shell que `seances/index.tsx` :
   - Nav 5 tabs — **PROGRAMMES** actif (gold underline), les 4 autres non-actifs
   - Stats row compact : 7 chiffres par méthode (count de programmes par méthode)
   - Filter bar underline : **GLOBAL** | **MÉTHODE ▾** | **ACADÉMIQUE** | **STAGE** (pas de tab ENTRAÎNEMENT/EXERCICE)
   - Bouton "+ Nouveau programme" (route `/methodologie/programmes/new` — lien mort pour l'instant)
5. **Table** avec colonnes : MÉTHODE (cercle coloré), TITRE, SAISON (label de l'academy_season liée), ACCOMPLISSEMENT (`X/Y`), `>` (chevron navigation).
6. Clic sur une ligne → `router.push('/methodologie/programmes/{id}')` (lien mort pour l'instant).
7. Empty state : "Aucun programme. Créez le premier." si table vide, "Aucun résultat pour ces filtres." si filtre actif.
8. `seances/index.tsx` : tab PROGRAMMES mis à jour avec `active: false` (déjà le cas) — aucun autre changement.
9. try/finally sur le chargement, console guards en place.

## Tasks / Subtasks

- [x] Task 1 — Migration Supabase (AC: #1)
  - [x] Créer `supabase/migrations/00142_create_methodology_programmes.sql`
  - [x] Table `methodology_programmes` : id, tenant_id, method TEXT, context_type TEXT CHECK, title TEXT, season_id UUID FK nullable (academy_seasons), total_sessions INT DEFAULT 0, description TEXT, is_active BOOL, created_at, updated_at, deleted_at
  - [x] Table `methodology_programme_sessions` : id, programme_id FK (CASCADE), session_id FK (methodology_sessions CASCADE), scheduled_date DATE nullable, position INT DEFAULT 0, created_at. UNIQUE(programme_id, session_id)
  - [x] RLS activé sur les deux tables (tenant_id isolation sur methodology_programmes, programme_id → tenant isolation sur methodology_programme_sessions)
  - [x] Index : tenant_id + deleted_at sur methodology_programmes ; programme_id sur join table

- [x] Task 2 — Types TypeScript (AC: #2)
  - [x] `MethodologyProgramme` dans `aureak/packages/types/src/entities.ts` (miroir DB + `accomplishment: { done: number; total: number }` calculé)
  - [x] `MethodologyProgrammeSession` dans `aureak/packages/types/src/entities.ts` (miroir DB)

- [x] Task 3 — API client (AC: #3)
  - [x] `listMethodologyProgrammes(opts?: { activeOnly?: boolean })` dans `aureak/packages/api-client/src/methodology.ts`
  - [x] Query : select programmes + LEFT JOIN COUNT programme_sessions WHERE scheduled_date IS NOT NULL pour accomplishment.done, total_sessions pour accomplishment.total, JOIN academy_seasons pour seasonLabel
  - [x] Export depuis `aureak/packages/api-client/src/index.ts`

- [x] Task 4 — UI page liste (AC: #4–#9)
  - [x] Créer `aureak/apps/web/app/(admin)/methodologie/programmes/index.tsx`
  - [x] Copier le shell de `seances/index.tsx` : même imports, même structure, même styles (réutiliser st.*)
  - [x] NAV_TABS : PROGRAMMES actif, les 4 autres inactifs (même tableau, juste `active: true` sur PROGRAMMES)
  - [x] Stats row : counts par méthode sur les programmes (pas les entraînements)
  - [x] Filter bar : GLOBAL | MÉTHODE ▾ | ACADÉMIQUE | STAGE uniquement (pas ENTRAÎNEMENT/EXERCICE)
  - [x] Table ProgrammesTable avec colonnes MÉTHODE / TITRE / SAISON / ACCOMPLISSEMENT / >
  - [x] Chaque ligne : cercle méthode coloré, titre, seasonLabel (ex: "2025-2026"), "X/Y" accomplissement, "›" chevron
  - [x] try/finally sur loadProgrammes
  - [x] Console guard sur les erreurs

## Dev Notes

### Fichiers à créer / modifier

| Fichier | Action |
|---------|--------|
| `supabase/migrations/00142_create_methodology_programmes.sql` | CRÉER |
| `aureak/packages/types/src/entities.ts` | MODIFIER — ajouter `MethodologyProgramme` + `MethodologyProgrammeSession` |
| `aureak/packages/api-client/src/methodology.ts` | MODIFIER — ajouter `listMethodologyProgrammes` |
| `aureak/packages/api-client/src/index.ts` | MODIFIER — exporter `listMethodologyProgrammes` |
| `aureak/apps/web/app/(admin)/methodologie/programmes/index.tsx` | CRÉER |

### Fichiers à NE PAS modifier

- `aureak/apps/web/app/(admin)/methodologie/seances/index.tsx` — aucune modification nécessaire (PROGRAMMES tab déjà `active: false`)
- `aureak/packages/types/src/enums.ts` — enums MethodologyMethod/MethodologyContextType déjà présents

### Migration 00142 — structure attendue

```sql
-- Table principale programmes
CREATE TABLE IF NOT EXISTS methodology_programmes (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  method         TEXT NOT NULL,
  context_type   TEXT NOT NULL DEFAULT 'academie'
                 CHECK (context_type IN ('academie', 'stage')),
  title          TEXT NOT NULL,
  season_id      UUID REFERENCES academy_seasons(id) ON DELETE SET NULL,
  total_sessions INT NOT NULL DEFAULT 0,
  description    TEXT,
  is_active      BOOLEAN NOT NULL DEFAULT true,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at     TIMESTAMPTZ
);

-- Table de jointure programme ↔ entraînements
CREATE TABLE IF NOT EXISTS methodology_programme_sessions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  programme_id   UUID NOT NULL
                 REFERENCES methodology_programmes(id) ON DELETE CASCADE,
  session_id     UUID NOT NULL
                 REFERENCES methodology_sessions(id) ON DELETE CASCADE,
  scheduled_date DATE,
  position       INT NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (programme_id, session_id)
);

-- RLS
ALTER TABLE methodology_programmes ENABLE ROW LEVEL SECURITY;
ALTER TABLE methodology_programme_sessions ENABLE ROW LEVEL SECURITY;

-- Policies tenant isolation (miroir methodology_exercises)
-- Index
CREATE INDEX IF NOT EXISTS idx_methodology_programmes_tenant
  ON methodology_programmes (tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_methodology_programme_sessions_programme
  ON methodology_programme_sessions (programme_id);
```

### Type TS — MethodologyProgramme

```typescript
export type MethodologyProgramme = {
  id            : string
  tenantId      : string
  method        : MethodologyMethod
  contextType   : MethodologyContextType
  title         : string
  seasonId      : string | null
  seasonLabel   : string | null   // join depuis academy_seasons.label
  totalSessions : number
  description   : string | null
  isActive      : boolean
  accomplishment: { done: number; total: number }  // done = sessions avec scheduled_date
  createdAt     : string
  updatedAt     : string
  deletedAt     : string | null
}

export type MethodologyProgrammeSession = {
  id            : string
  programmeId   : string
  sessionId     : string
  scheduledDate : string | null   // DATE ISO
  position      : number
  createdAt     : string
}
```

### API — listMethodologyProgrammes

Query Supabase :
```typescript
// Sélectionner programmes + season label + count sessions avec date
const { data, error } = await supabase
  .from('methodology_programmes')
  .select(`
    *,
    academy_seasons ( label ),
    methodology_programme_sessions ( id, scheduled_date )
  `)
  .is('deleted_at', null)
  .order('created_at', { ascending: false })

// Mapper : accomplishment.done = count(scheduled_date IS NOT NULL)
//          accomplishment.total = total_sessions
```

### UI — Page Programmes

**Pattern à réutiliser de seances/index.tsx :**
- Même `NAV_TABS` array (juste `active: true` sur PROGRAMMES, `active: false` sur les autres)
- Même `statsRow` / `statBlock` styles pour les compteurs méthode
- Même `filterBar` / `filterTabWrap` / `filterTabActive` / `filterTabUnderline` styles
- Même `tableWrapper` / `tableHeader` / `tableRow` / `thText` styles
- Même `methodCircle` + `methodPicto` pour la colonne MÉTHODE

**Colonnes de la table programmes :**
```
MÉTHODE (52px) | TITRE (flex:1) | SAISON (120px) | ACCOMPLISSEMENT (140px) | > (40px)
```

**Rendu ACCOMPLISSEMENT :**
```tsx
<AureakText style={st.numText}>{programme.accomplishment.done}/{programme.accomplishment.total}</AureakText>
```

**Rendu SAISON :**
```tsx
<AureakText style={st.titleText}>{programme.seasonLabel ?? '—'}</AureakText>
```

**Rendu chevron > :**
```tsx
<AureakText style={{ fontSize: 16, color: colors.text.muted }}>›</AureakText>
```

**Filter bar** (plus simple que seances) :
- GLOBAL | MÉTHODE ▾ | ACADÉMIQUE | STAGE
- Pas de tabs ENTRAÎNEMENT / EXERCICE
- Pas de state `contentType`

### Règles architecture obligatoires

- **Accès Supabase** UNIQUEMENT via `@aureak/api-client`
- **Styles** UNIQUEMENT via `@aureak/theme` tokens
- **try/finally** sur `setLoading`
- **Console guards** `if (process.env.NODE_ENV !== 'production')`
- **Soft-delete** : `deleted_at nullable` dans la migration

### Références

- Design ref : `_bmad-output/design-references/Methodologie programme-redesign.png`
- Code de référence : `aureak/apps/web/app/(admin)/methodologie/seances/index.tsx` — réutiliser patterns, styles et structure
- Type `AcademySeason` : `aureak/packages/types/src/entities.ts:535` — `label: string` (ex: "2025-2026")
- `listAcademySeasons` déjà exporté depuis `@aureak/api-client` (pas besoin de le recréer)
- Tokens : `methodologyMethodColors` depuis `@aureak/theme`

### Notes implémentation

- La page de **création/détail** programme (formulaire, ajout d'entraînements, assignation dates, duplication) sera dans une **story séparée 34-5**
- Le bouton "+ Nouveau programme" et les liens de navigation vers `/methodologie/programmes/{id}` sont des **liens morts** pour l'instant
- L'`index.tsx` est une route directe (pattern valide sans `page.tsx`, identique à `seances/index.tsx`)

## Dev Agent Record

### Agent Model Used
claude-sonnet-4-6

### Debug Log References
Aucun blocage — implémentation directe.

### Completion Notes List
- Migration 00142 créée avec RLS complet sur les deux tables (tenant isolation directe sur methodology_programmes, isolation via programme_id sur methodology_programme_sessions).
- Types TS ajoutés à la fin de entities.ts dans un bloc commenté Migration 00142.
- `mapProgramme` calcule accomplishment.done en filtrant les sessions avec scheduled_date !== null depuis le join Supabase.
- UI réutilise intégralement les styles de seances/index.tsx (même objet `st.*`). Filter bar simplifié : 4 tabs (GLOBAL / MÉTHODE / ACADÉMIQUE / STAGE) sans ENTRAÎNEMENT / EXERCICE.
- tsc --noEmit : 0 erreur.

### File List

| Fichier | Statut |
|---------|--------|
| `supabase/migrations/00142_create_methodology_programmes.sql` | Créé |
| `aureak/packages/types/src/entities.ts` | Modifié — MethodologyProgramme + MethodologyProgrammeSession ajoutés |
| `aureak/packages/api-client/src/methodology.ts` | Modifié — import + mapProgramme + listMethodologyProgrammes |
| `aureak/packages/api-client/src/index.ts` | Modifié — export listMethodologyProgrammes |
| `aureak/apps/web/app/(admin)/methodologie/programmes/index.tsx` | Créé |
