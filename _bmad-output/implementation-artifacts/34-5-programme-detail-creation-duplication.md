# Story 34.5 : Programme — Création, Détail, Duplication

Status: done

## Story

En tant qu'admin,
je veux créer un programme académique, gérer ses entraînements liés et le dupliquer,
afin d'organiser le plan pédagogique d'une saison par méthode.

## Acceptance Criteria

1. **Formulaire création** (`/methodologie/programmes/new`) : champs méthode, contexte pré-rempli à "académie" (non modifiable dans cette story), saison (selector academy_seasons), total prévu (nombre), titre libre, description optionnelle. Soumission → crée le programme + redirige vers la page détail.
2. **Page détail** (`/methodologie/programmes/[programmeId]`) affiche : titre, méthode (cercle coloré), saison, accomplissement (X/Y), boutons "Dupliquer" et "Supprimer".
3. **Liste des entraînements liés** : tableau avec colonnes POSITION, MÉTHODE, TITRE, DATE (simple date field éditable inline), bouton retirer (✕).
4. **Picker ajout** : bouton "+ Ajouter un entraînement" → recherche parmi les `methodology_sessions` existants (search par titre) → clic = ajout en fin de liste.
5. **Reorder** : boutons ▲ / ▼ sur chaque ligne pour déplacer un entraînement dans la liste (met à jour le champ `position`).
6. **Date inline** : champ date éditable sur chaque ligne — sauvegarde automatique au blur (met à jour `methodology_programme_sessions.scheduled_date`).
7. **Duplication** : bouton "Dupliquer" → copie le programme (titre = "Copie de {titre}", saison = null, même méthode/contexte/total) + copie toutes les liaisons entraînements SANS les dates → redirige vers la page détail du duplicata.
8. **Suppression** : bouton "Supprimer" → confirm dialog → soft-delete (`deleted_at`) sur le programme → redirige vers `/methodologie/programmes`.
9. **API** : `createMethodologyProgramme`, `getMethodologyProgramme`, `updateMethodologyProgramme`, `softDeleteMethodologyProgramme`, `addProgrammeSession`, `removeProgrammeSession`, `updateProgrammeSessionDate`, `updateProgrammeSessionPosition`, `duplicateMethodologyProgramme` dans `@aureak/api-client`.
10. try/finally sur tous les setLoading/setSaving, console guards en place.

## Tasks / Subtasks

- [x] Task 1 — API client (AC: #9)
  - [x] `createMethodologyProgramme(data)` dans `methodology.ts`
  - [x] `getMethodologyProgramme(id)` — retourne programme + sessions liées avec entraînement joint
  - [x] `updateMethodologyProgramme(id, data)` — titre, saison, total, description
  - [x] `softDeleteMethodologyProgramme(id)` — set deleted_at
  - [x] `addProgrammeSession(programmeId, sessionId)` — insert dans join table, position = max+1
  - [x] `removeProgrammeSession(programmeId, sessionId)` — delete from join table
  - [x] `updateProgrammeSessionDate(programmeId, sessionId, date)` — update scheduled_date
  - [x] `updateProgrammeSessionPosition(programmeId, sessionId, position)` — update position
  - [x] `duplicateMethodologyProgramme(id)` — copie programme + sessions sans dates
  - [x] Exports dans `index.ts`

- [x] Task 2 — Types TypeScript (AC: #9 support)
  - [x] `MethodologyProgrammeWithSessions` dans `entities.ts` — programme + `sessions: MethodologyProgrammeSessionWithEntrainement[]`
  - [x] `MethodologyProgrammeSessionWithEntrainement` — session join + `entrainement: { id, title, method }`

- [x] Task 3 — Page création `/methodologie/programmes/new.tsx` (AC: #1)
  - [x] Formulaire : méthode (selector), saison (selector listAcademySeasons), total (number input), titre (text input), description (textarea optionnel)
  - [x] Contexte académie = valeur fixe (pas de selector dans cette story)
  - [x] Submit → `createMethodologyProgramme` → redirect vers `/methodologie/programmes/{id}`
  - [x] Bouton annuler → retour liste
  - [x] try/finally sur setSaving

- [x] Task 4 — Page détail `/methodologie/programmes/[programmeId]/index.tsx` (AC: #2–#8)
  - [x] Header : titre, cercle méthode coloré, saison label, accomplissement X/Y, boutons "Dupliquer" + "Supprimer"
  - [x] Tableau entraînements : colonnes POSITION / MÉTHODE / TITRE / DATE / ✕
  - [x] Boutons ▲▼ sur chaque ligne (appel `updateProgrammeSessionPosition`)
  - [x] Date inline éditable : `TextInput` type date → onBlur → `updateProgrammeSessionDate`
  - [x] Bouton ✕ retirer → `removeProgrammeSession` + mise à jour state local
  - [x] Picker ajout : modal ou dropdown search → `listMethodologySessions` → clic → `addProgrammeSession`
  - [x] Dupliquer → `duplicateMethodologyProgramme` → redirect
  - [x] Supprimer → ConfirmDialog → `softDeleteMethodologyProgramme` → redirect liste
  - [x] try/finally sur tous les setLoading/setSaving

- [x] Task 5 — Routing
  - [x] `aureak/apps/web/app/(admin)/methodologie/programmes/new.tsx` (route directe)
  - [x] `aureak/apps/web/app/(admin)/methodologie/programmes/[programmeId]/index.tsx`
  - [x] Mettre à jour `programmes/index.tsx` : bouton "+ Nouveau programme" → `/methodologie/programmes/new`, clic ligne → `/methodologie/programmes/{id}` (déjà en place depuis 34-4)

## Dev Notes

### Fichiers à créer / modifier

| Fichier | Action |
|---------|--------|
| `aureak/packages/types/src/entities.ts` | MODIFIER — ajouter `MethodologyProgrammeWithSessions` + `MethodologyProgrammeSessionWithEntrainement` |
| `aureak/packages/api-client/src/methodology.ts` | MODIFIER — 9 nouvelles fonctions |
| `aureak/packages/api-client/src/index.ts` | MODIFIER — exports |
| `aureak/apps/web/app/(admin)/methodologie/programmes/new.tsx` | CRÉER |
| `aureak/apps/web/app/(admin)/methodologie/programmes/[programmeId]/index.tsx` | CRÉER |
| `aureak/apps/web/app/(admin)/methodologie/programmes/index.tsx` | MODIFIER — activer liens (new + détail) |

### Fichiers à NE PAS modifier

- `supabase/migrations/` — pas de migration (tables créées en 00142)
- `aureak/apps/web/app/(admin)/methodologie/seances/index.tsx` — non impacté

### API — patterns attendus

```typescript
// getMethodologyProgramme — join avec sessions + entraînements
const { data } = await supabase
  .from('methodology_programmes')
  .select(`
    *,
    academy_seasons ( label ),
    methodology_programme_sessions (
      id, session_id, scheduled_date, position,
      methodology_sessions ( id, title, method )
    )
  `)
  .eq('id', id)
  .is('deleted_at', null)
  .single()

// duplicateMethodologyProgramme
// 1. INSERT INTO methodology_programmes (copie sans season_id, titre = 'Copie de ...')
// 2. INSERT INTO methodology_programme_sessions pour chaque session, scheduled_date = NULL

// addProgrammeSession — position = max actuel + 1
// updateProgrammeSessionPosition — simple UPDATE position WHERE programme_id + session_id
```

### Types TS attendus

```typescript
export type MethodologyProgrammeSessionWithEntrainement = {
  id            : string
  programmeId   : string
  sessionId     : string
  scheduledDate : string | null
  position      : number
  createdAt     : string
  entrainement  : {
    id    : string
    title : string
    method: MethodologyMethod
  }
}

export type MethodologyProgrammeWithSessions = MethodologyProgramme & {
  sessions: MethodologyProgrammeSessionWithEntrainement[]
}
```

### UI — Page détail patterns

**Tableau entraînements :**
```
POS(40) | MÉTHODE(52) | TITRE(flex) | DATE(140) | ▲▼(60) | ✕(40)
```

**Date inline (web) :**
```tsx
<TextInput
  style={st.dateInput}
  value={session.scheduledDate ?? ''}
  onChangeText={(v) => setLocalDate(session.id, v)}
  onBlur={() => handleSaveDate(session.id)}
  placeholder="AAAA-MM-JJ"
  placeholderTextColor={colors.text.subtle}
/>
```

**Picker ajout** — simple dropdown filtrable (pattern identique au dropdown MÉTHODE de `seances/index.tsx`) :
- State `pickerOpen: boolean` + `pickerSearch: string`
- Filtre `methodology_sessions` par titre + exclut déjà dans le programme
- Clic → `addProgrammeSession` → ferme picker → reload

**Reorder ▲▼ :**
- ▲ : swap position avec l'élément précédent (position - 1)
- ▼ : swap position avec l'élément suivant (position + 1)
- Optimistic update côté state local + appel API en background

### Shell à réutiliser

- Même header nav 5 tabs que `seances/index.tsx` (PROGRAMMES actif)
- Même tokens `colors`, `space`, `shadows`, `radius`, `methodologyMethodColors` depuis `@aureak/theme`
- Même `ConfirmDialog` depuis `@aureak/ui` pour la suppression
- `listAcademySeasons` + `listMethodologySessions` déjà exportés depuis `@aureak/api-client`

### Règles architecture obligatoires

- **Accès Supabase** UNIQUEMENT via `@aureak/api-client`
- **Styles** UNIQUEMENT via tokens `@aureak/theme`
- **try/finally** sur tous les setLoading/setSaving
- **Console guards** `if (process.env.NODE_ENV !== 'production')`
- **Soft-delete** : `deleted_at` déjà présent sur la table (migration 00142)

### Références

- Design ref liste : `_bmad-output/design-references/Methodologie programme-redesign.png`
- Code référence shell : `aureak/apps/web/app/(admin)/methodologie/seances/index.tsx`
- Code référence formulaire : `aureak/apps/web/app/(admin)/methodologie/seances/new.tsx`
- Code référence détail : `aureak/apps/web/app/(admin)/methodologie/seances/[sessionId]/page.tsx`
- Type `AcademySeason` : `entities.ts:535` — `label: string`
- Type `MethodologyProgramme` : `entities.ts` (ajouté en 34-4)

### Notes scope

- Context_type = `'academie'` uniquement dans cette story (stage = story future)
- Liaison aux séances terrain opérationnelles (dispatch Rochefort/Templiers) = story 34-6
- `scheduled_date` reste un champ date simple (pas de FK vers sessions terrain pour l'instant)

## Dev Agent Record

### Agent Model Used
claude-sonnet-4-6

### Debug Log References
- TypeScript error sur style spread `[st.badgeText, { color }]` → corrigé en `{ ...st.badgeText, color } as TextStyle`

### Completion Notes List
- Playwright skipped — app non démarrée
- Task 5 routing : `programmes/index.tsx` avait déjà les liens en place depuis 34-4, confirmé

### File List

| Fichier | Statut |
|---------|--------|
| `aureak/packages/types/src/entities.ts` | Modifié — ajout MethodologyProgrammeSessionWithEntrainement + MethodologyProgrammeWithSessions |
| `aureak/packages/api-client/src/methodology.ts` | Modifié — 9 nouvelles fonctions + mapProgrammeSession |
| `aureak/packages/api-client/src/index.ts` | Modifié — exports des 9 nouvelles fonctions + type CreateMethodologyProgrammeParams |
| `aureak/apps/web/app/(admin)/methodologie/programmes/new.tsx` | Créé |
| `aureak/apps/web/app/(admin)/methodologie/programmes/[programmeId]/index.tsx` | Créé |
| `aureak/apps/web/app/(admin)/methodologie/programmes/index.tsx` | Non modifié — liens déjà en place |
