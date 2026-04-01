# Story 4.7 : Vue Coach — Fiche Séance, Notes & Feedback Contenu

Status: done

## Story

En tant que Coach,
Je veux accéder à la fiche complète de ma séance du jour avec les unités pédagogiques filtrées par audience, laisser une note personnelle et soumettre des suggestions d'amélioration sur le contenu,
Afin d'être pleinement outillé sur le terrain et de contribuer à l'amélioration continue du référentiel.

## Acceptance Criteria

**AC1 — Fiche séance filtrée**
- **When** le Coach ouvre la fiche d'une séance assignée
- **Then** `session_themes` avec séquences, critères et cues filtrés par `filterByAudience` selon `age_group` du groupe
- **And** `session_situations` filtrées également
- **And** `session_attendees` affichés (nom + photo)

**AC2 — Tables notes et feedback**
- **And** `coach_session_notes` et `coach_content_feedback` créées (1 note par coach par séance, UNIQUE)

**AC3 — CRUD notes et feedback**
- **And** Coach peut créer ou mettre à jour sa note
- **And** Coach peut soumettre un feedback sur thème/situation/séquence (status = 'submitted')

**AC4 — RLS**
- **And** `coach_session_notes` : visible coach auteur + admin ; `coach_content_feedback` : visible coach auteur + admin

## Tasks / Subtasks

- [ ] Task 1 — Migration `00014_session_notes.sql` (AC: #2)
  - [ ] 1.1 Créer `coach_session_notes` et `coach_content_feedback` + activer RLS

- [ ] Task 2 — Policies RLS dans `00010_rls_policies.sql` (AC: #4)
  - [ ] 2.1 `coach_session_notes` : coach auteur = ALL, admin = SELECT
  - [ ] 2.2 `coach_content_feedback` : coach auteur = ALL, admin = ALL

- [ ] Task 3 — `@aureak/api-client`
  - [ ] 3.1 Créer `packages/api-client/src/sessions/notes.ts` : `upsertSessionNote()`, `getSessionNote()`, `submitContentFeedback()`, `listFeedback()` (admin)

- [ ] Task 4 — Types TypeScript
  - [ ] 4.1 Ajouter `CoachSessionNote`, `CoachContentFeedback`, `FeedbackStatus`

- [ ] Task 5 — UI Mobile Coach (AC: #1, #3)
  - [ ] 5.1 Créer `apps/mobile/app/(coach)/session/[sessionId]/fiche.tsx` — fiche complète avec thèmes/situations/roster/note
  - [ ] 5.2 Créer `apps/mobile/app/(coach)/session/[sessionId]/feedback.tsx` — formulaire feedback contenu

- [ ] Task 6 — UI Admin web (AC: #3)
  - [ ] 6.1 Ajouter panel "Feedbacks" dans le back-office référentiel avec gestion du statut (submitted → accepted/rejected/testing)

## Dev Notes

### Migration `00014_session_notes.sql`

```sql
CREATE TABLE coach_session_notes (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id       UUID NOT NULL REFERENCES sessions(id),
  coach_id         UUID NOT NULL REFERENCES profiles(user_id),
  tenant_id        UUID NOT NULL,
  note             TEXT NOT NULL,
  visible_to_admin BOOLEAN NOT NULL DEFAULT true,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ,
  UNIQUE (session_id, coach_id)
);

CREATE TABLE coach_content_feedback (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id  UUID NOT NULL REFERENCES profiles(user_id),
  tenant_id UUID NOT NULL,
  unit_type TEXT NOT NULL CHECK (unit_type IN ('theme','situation','sequence')),
  unit_id   UUID NOT NULL,
  content   TEXT NOT NULL,
  status    TEXT NOT NULL DEFAULT 'submitted'
    CHECK (status IN ('submitted','accepted','rejected','testing')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE coach_session_notes    ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_content_feedback ENABLE ROW LEVEL SECURITY;
```

### Filtrage `filterByAudience` côté serveur

La fiche séance récupère les thèmes via `session_themes → themes` et applique `filterByAudience` en JavaScript dans l'api-client (pas de filtrage SQL pour garder la flexibilité) :

```typescript
// packages/api-client/src/sessions/fiche.ts
import { filterByAudience } from '@aureak/business-logic'

export async function getSessionFiche(sessionId: string, userProfile: UserProfile) {
  const { data: session } = await supabase
    .from('sessions')
    .select(`
      *,
      session_themes(theme_id, themes(*,
        theme_sequences(*, criteria(*, faults(*, cues(*))))
      )),
      session_situations(situation_id, situations(*, situation_criteria(*))),
      session_attendees(child_id, profiles(first_name, last_name, avatar_url))
    `)
    .eq('id', sessionId).single()

  // Filtrer les thèmes par audience
  const filteredThemes = filterByAudience(
    session.session_themes.map(st => st.themes),
    userProfile
  )

  return { ...session, filteredThemes }
}
```

### Dépendances

- **Prérequis** : Stories 3.6 (filterByAudience) + 4.1 (sessions, session_themes) + 4.2 (session_attendees)
- **Utilisé en Story 8.5** : `coach_session_notes` visible dans le rapport de séance admin

### References
- [Source: epics.md#Story-4.7] — lignes 1532–1575

## Dev Agent Record
### Agent Model Used
claude-sonnet-4-6
### Debug Log References
### Completion Notes List
### File List
