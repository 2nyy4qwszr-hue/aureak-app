# Story 4.6 : Confirmation Présence Coach & Gestion du Bloc

Status: ready-for-dev

## Story

En tant que Coach,
Je veux confirmer ma présence terrain d'un tap et effectuer le check-in matériel une seule fois pour tout un bloc de séances,
Afin que la présence coach soit prouvée sans créer de friction sur le terrain et que la clôture de séance soit sécurisée.

## Acceptance Criteria

**AC1 — Confirmation présence coach**
- **When** le Coach tape "Confirmer ma présence"
- **Then** INSERT dans `coach_presence_confirmations (session_id, coach_id, confirmed_at, device_id)` + audit log

**AC2 — Check-in bloc**
- **And** si séance dans un `session_block`, un check-in au niveau du bloc insère dans `block_checkins` — visible sur toutes les séances du bloc sans répétition

**AC3 — Règle de clôture**
- **And** une séance peut être clôturée si `coach_presence_confirmations` contient ≥ 1 confirmation du coach `lead`
- **And** `tenants.config->>'require_presence_count'` peut exiger 2 confirmations (lead + 1 assistant)

**AC4 — Changement de lead en cours**
- **And** un Admin peut transférer le rôle `lead` à un autre coach sur une séance `en_cours` (via `change_session_lead()` de Story 4.1) — journalisé dans `audit_logs`

## Tasks / Subtasks

- [ ] Task 1 — RPC `confirm_coach_presence` (AC: #1, #2)
  - [ ] 1.1 Créer une RPC SECURITY DEFINER qui insère dans `coach_presence_confirmations` et logue dans `audit_logs`
  - [ ] 1.2 Si `session_block_id` non null : insérer dans `block_checkins` (ON CONFLICT DO NOTHING)

- [ ] Task 2 — Enrichissement `tenants` (AC: #3)
  - [ ] 2.1 Vérifier que `tenants` a bien une colonne `config JSONB NOT NULL DEFAULT '{}'` (déjà défini en Story 1.2 sinon l'ajouter)

- [ ] Task 3 — `@aureak/api-client`
  - [ ] 3.1 Créer `packages/api-client/src/sessions/presence.ts` avec `confirmCoachPresence()`, `getCoachPresenceStatus()`, `performBlockCheckin()`

- [ ] Task 4 — UI Mobile (apps/mobile) (AC: #1, #2)
  - [ ] 4.1 Créer `apps/mobile/app/(coach)/session/[sessionId]/presence.tsx` — bouton "Confirmer ma présence" + état visuel (confirmé/non confirmé)
  - [ ] 4.2 Afficher le check-in bloc si la séance appartient à un bloc

## Dev Notes

### RPC `confirm_coach_presence`

```sql
CREATE OR REPLACE FUNCTION confirm_coach_presence(
  p_session_id UUID,
  p_device_id  TEXT DEFAULT NULL
) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_block_id UUID;
BEGIN
  -- Vérifier que le coach est assigné à cette séance
  IF NOT EXISTS (
    SELECT 1 FROM session_coaches
    WHERE session_id = p_session_id AND coach_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Coach non assigné à cette séance';
  END IF;

  -- Confirmer la présence
  INSERT INTO coach_presence_confirmations (session_id, coach_id, tenant_id, confirmed_at, device_id)
  VALUES (p_session_id, auth.uid(), current_tenant_id(), now(), p_device_id)
  ON CONFLICT (session_id, coach_id) DO NOTHING;

  -- Check-in bloc si applicable
  SELECT session_block_id INTO v_block_id FROM sessions WHERE id = p_session_id;
  IF v_block_id IS NOT NULL THEN
    INSERT INTO block_checkins (session_block_id, coach_id, tenant_id, checked_in_at)
    VALUES (v_block_id, auth.uid(), current_tenant_id(), now())
    ON CONFLICT (session_block_id, coach_id) DO NOTHING;
  END IF;

  -- Audit
  INSERT INTO audit_logs (tenant_id, user_id, entity_type, entity_id, action, metadata)
  VALUES (
    current_tenant_id(), auth.uid(),
    'coach_presence', p_session_id, 'coach_presence_confirmed',
    jsonb_build_object('device_id', p_device_id, 'confirmed_at', now())
  );
END; $$;
REVOKE ALL ON FUNCTION confirm_coach_presence FROM PUBLIC;
GRANT EXECUTE ON FUNCTION confirm_coach_presence TO authenticated;
```

### Vérification clôture (utilisée en Story 6.4)

```sql
-- Fonction helper pour valider les conditions de clôture
CREATE OR REPLACE FUNCTION can_close_session(p_session_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM coach_presence_confirmations cpc
    JOIN session_coaches sc ON sc.session_id = cpc.session_id AND sc.coach_id = cpc.coach_id
    WHERE cpc.session_id = p_session_id AND sc.role = 'lead'
  )
  AND (
    -- Vérifie le seuil de présence configuré dans le tenant
    (SELECT COUNT(*) FROM coach_presence_confirmations WHERE session_id = p_session_id)
    >= COALESCE(
      (SELECT (config->>'require_presence_count')::int FROM tenants
       WHERE id = current_tenant_id()), 1
    )
  );
$$;
REVOKE ALL ON FUNCTION can_close_session FROM PUBLIC;
GRANT EXECUTE ON FUNCTION can_close_session TO authenticated;
```

### UI Mobile — état visuel confirmation

```typescript
// apps/mobile/app/(coach)/session/[sessionId]/presence.tsx
import { useAuthStore } from '@aureak/business-logic'

export default function PresenceScreen({ sessionId }: { sessionId: string }) {
  const { user } = useAuthStore()
  const { data: isConfirmed } = useQuery({
    queryKey: ['presence', sessionId, user?.id],
    queryFn: () => getCoachPresenceStatus(sessionId)
  })

  const confirm = useMutation({
    mutationFn: () => confirmCoachPresence(sessionId, deviceId),
    onSuccess: () => queryClient.invalidateQueries(['presence', sessionId])
  })

  return (
    <Button
      onPress={() => confirm.mutate()}
      disabled={isConfirmed}
      variant={isConfirmed ? 'success' : 'primary'}
    >
      {isConfirmed ? '✓ Présence confirmée' : 'Confirmer ma présence'}
    </Button>
  )
}
```

### Dépendances

- **Prérequis** : Stories 4.1 (session_coaches, block_checkins) + 4.2 (coach_presence_confirmations)
- **Utilisé en Story 6.4** : `can_close_session()` vérifié avant clôture

### References
- [Source: epics.md#Story-4.6] — lignes 1508–1528

## Dev Agent Record
### Agent Model Used
claude-sonnet-4-6
### Debug Log References
### Completion Notes List
### File List
