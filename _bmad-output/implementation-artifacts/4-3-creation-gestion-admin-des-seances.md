# Story 4.3 : Création & Gestion Admin des Séances

Status: ready-for-dev

## Story

En tant qu'Admin,
Je veux créer, modifier et annuler des séances avec tous leurs attributs, en associant des unités pédagogiques en version snapshot,
Afin de piloter le planning de toutes les implantations depuis l'interface web.

## Acceptance Criteria

**AC1 — Création de séance complète**
- **Given** un Admin connecté, les tables de Stories 4.1 et 4.2 existent
- **When** l'Admin crée une séance
- **Then** `sessions` INSERT avec `status = 'planifiée'`, `session_attendees` pré-rempli depuis `group_members`, `session_themes` avec versions `is_current = true` figées, `session_coaches` avec ≥ 1 coach `lead`

**AC2 — Modification**
- **And** l'Admin peut modifier tous les champs d'une séance `planifiée` (date, durée, lieu, groupe, coaches, thèmes/situations)
- **And** le changement de lead coach est atomique via `change_session_lead()` RPC (défini en Story 4.1)

**AC3 — Archivage soft-delete**
- **And** un Admin peut archiver une séance passée (`deleted_at`) — elle reste dans l'historique

**AC4 — Tables notifications créées**
- **And** `notification_preferences` et `notification_send_logs` sont créées dans cette story

**AC5 — RLS et migration propre**
- **And** RLS activé sur les nouvelles tables
- **And** `supabase db diff` reste clean

## Tasks / Subtasks

- [ ] Task 1 — Migration `00013_notifications_infra.sql` (AC: #4)
  - [ ] 1.1 Créer `notification_preferences` et `notification_send_logs` + `push_tokens`
  - [ ] 1.2 Activer RLS sur ces tables

- [ ] Task 2 — RPC `create_session_full` (AC: #1)
  - [ ] 2.1 Créer une RPC atomique qui insère `sessions` + appelle `prefill_session_attendees()` + insère `session_themes` + `session_coaches`

- [ ] Task 3 — `@aureak/api-client` admin sessions (AC: #1, #2, #3)
  - [ ] 3.1 Créer `packages/api-client/src/sessions/admin-sessions.ts` avec `createSession()`, `updateSession()`, `archiveSession()`

- [ ] Task 4 — UI Admin (web) (AC: #1, #2)
  - [ ] 4.1 Créer `apps/web/app/(admin)/sessions/new.tsx` — formulaire complet : groupe, date/heure, durée, lieu, coaches, thèmes, situations
  - [ ] 4.2 Créer `apps/web/app/(admin)/sessions/[sessionId]/edit.tsx`
  - [ ] 4.3 Créer `apps/web/app/(admin)/sessions/page.tsx` — calendrier/liste des séances par implantation + filtres
  - [ ] 4.4 Valider avec React Hook Form + Zod : `scheduled_at` dans le futur, ≥ 1 coach lead obligatoire

- [ ] Task 5 — Policies RLS dans `00010_rls_policies.sql` (AC: #5)
  - [ ] 5.1 `notification_preferences` : user peut gérer ses propres préférences, admin voit tout
  - [ ] 5.2 `notification_send_logs` : admin=SELECT, service_role=INSERT (Edge Functions)
  - [ ] 5.3 `push_tokens` : user gère ses propres tokens

## Dev Notes

### Migration `00013_notifications_infra.sql`

```sql
-- Tokens push par utilisateur (1 par appareil)
CREATE TABLE push_tokens (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id  UUID NOT NULL,
  token      TEXT NOT NULL,
  platform   TEXT NOT NULL CHECK (platform IN ('ios','android','web')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, token)
);

CREATE TABLE notification_preferences (
  user_id       UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id     UUID NOT NULL,
  push_enabled  BOOLEAN NOT NULL DEFAULT true,
  email_enabled BOOLEAN NOT NULL DEFAULT true,
  sms_enabled   BOOLEAN NOT NULL DEFAULT false,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE notification_send_logs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    UUID NOT NULL,
  recipient_id UUID NOT NULL REFERENCES auth.users(id),
  channel      TEXT NOT NULL CHECK (channel IN ('push','email','sms')),
  event_type   TEXT NOT NULL,
  reference_id UUID,
  status       TEXT NOT NULL CHECK (status IN ('sent','failed','skipped')),
  error_text   TEXT,
  sent_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE push_tokens                ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences   ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_send_logs     ENABLE ROW LEVEL SECURITY;
```

### RPC `create_session_full`

```sql
CREATE OR REPLACE FUNCTION create_session_full(p_params JSONB)
RETURNS sessions LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_session sessions;
  v_theme_id UUID;
  v_coach    JSONB;
BEGIN
  IF current_user_role() != 'admin' THEN RAISE EXCEPTION 'Accès refusé'; END IF;

  INSERT INTO sessions (tenant_id, implantation_id, group_id, scheduled_at,
    duration_minutes, location, status)
  VALUES (
    current_tenant_id(),
    (p_params->>'implantation_id')::uuid,
    (p_params->>'group_id')::uuid,
    (p_params->>'scheduled_at')::timestamptz,
    COALESCE((p_params->>'duration_minutes')::int, 90),
    p_params->>'location',
    'planifiée'
  ) RETURNING * INTO v_session;

  -- Pré-remplir le roster
  PERFORM prefill_session_attendees(v_session.id);

  -- Themes snapshot
  FOR v_theme_id IN SELECT jsonb_array_elements_text(p_params->'theme_ids')::uuid
  LOOP
    INSERT INTO session_themes (session_id, theme_id, tenant_id)
    VALUES (v_session.id, v_theme_id, current_tenant_id());
  END LOOP;

  -- Coaches
  FOR v_coach IN SELECT jsonb_array_elements(p_params->'coaches')
  LOOP
    INSERT INTO session_coaches (session_id, coach_id, tenant_id, role)
    VALUES (v_session.id, (v_coach->>'coach_id')::uuid,
            current_tenant_id(), COALESCE(v_coach->>'role','lead'));
  END LOOP;

  RETURN v_session;
END; $$;
REVOKE ALL ON FUNCTION create_session_full FROM PUBLIC;
GRANT EXECUTE ON FUNCTION create_session_full TO authenticated;
```

### Dépendances

- **Prérequis** : Stories 4.1 + 4.2
- **À compléter en Story 4.5** : `notification_send_logs` enrichie (urgency, provider_response, unique constraint)
- **À compléter en Story 7.1** : `push_tokens` policies complètes

### References
- [Source: epics.md#Story-4.3] — lignes 1415–1456

## Dev Agent Record
### Agent Model Used
claude-sonnet-4-6
### Debug Log References
### Completion Notes List
### File List
