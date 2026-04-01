# Story 6.3 : Double Validation Coach (Realtime + Fallback Polling)

Status: done

## Story

En tant que Coach,
Je veux confirmer la clôture de séance conjointement avec le co-coach via synchronisation en temps réel, avec un fallback polling si le WebSocket est indisponible,
Afin que la double validation soit toujours possible sur le terrain même en conditions réseau dégradées.

## Acceptance Criteria

**AC1 — Machine d'état `validation_status`**
- **And** colonne `validation_status` ajoutée sur `sessions` : `pending → validated_lead → validated_both`
- **And** transitions sécurisées par RPC (vérification `session_coaches`)

**AC2 — Realtime WebSocket**
- **And** Supabase channel `postgres_changes` sur UPDATE de `sessions` pour `id = sessionId`

**AC3 — Fallback polling**
- **And** si WebSocket non disponible après 3s → polling `refetchInterval: 9000` via TanStack Query
- **And** polling annulé dès que WebSocket repasse à `joined`

**AC4 — Coach seul = `validated_both` direct**
- **And** si 1 seul coach assigné : `validation_status = 'validated_both'` dès la confirmation du lead

## Tasks / Subtasks

- [ ] Task 1 — Migration colonne `validation_status` (AC: #1)
  - [ ] 1.1 `ALTER TABLE sessions ADD COLUMN validation_status TEXT NOT NULL DEFAULT 'pending' CHECK (validation_status IN ('pending','validated_lead','validated_both'))`

- [ ] Task 2 — RPC `validate_session` (AC: #1)
  - [ ] 2.1 RPC SECURITY DEFINER qui vérifie le rôle du coach et avance l'état

- [ ] Task 3 — Hook `useSessionValidation` dans `@aureak/business-logic` (AC: #2, #3)
  - [ ] 3.1 Créer le hook avec Supabase Realtime + fallback polling TanStack Query

- [ ] Task 4 — UI Mobile validation (AC: #1–#4)
  - [ ] 4.1 Créer `apps/mobile/app/(coach)/session/[sessionId]/validation.tsx`

## Dev Notes

### RPC `validate_session`

```sql
CREATE OR REPLACE FUNCTION validate_session(p_session_id UUID)
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_role        TEXT;
  v_curr_status TEXT;
  v_coach_count INT;
  v_new_status  TEXT;
BEGIN
  SELECT role INTO v_role FROM session_coaches
  WHERE session_id = p_session_id AND coach_id = auth.uid();

  IF v_role IS NULL THEN RAISE EXCEPTION 'Non assigné à cette séance'; END IF;

  SELECT validation_status INTO v_curr_status
  FROM sessions WHERE id = p_session_id AND tenant_id = current_tenant_id();

  SELECT COUNT(*) INTO v_coach_count FROM session_coaches WHERE session_id = p_session_id;

  v_new_status := CASE
    WHEN v_role = 'lead' AND v_curr_status = 'pending' THEN
      CASE WHEN v_coach_count = 1 THEN 'validated_both' ELSE 'validated_lead' END
    WHEN v_role = 'assistant' AND v_curr_status = 'validated_lead' THEN 'validated_both'
    ELSE v_curr_status  -- idempotent si déjà validé
  END;

  UPDATE sessions SET validation_status = v_new_status WHERE id = p_session_id;

  RETURN v_new_status;
END; $$;
REVOKE ALL ON FUNCTION validate_session FROM PUBLIC;
GRANT EXECUTE ON FUNCTION validate_session TO authenticated;
```

### Hook `useSessionValidation`

```typescript
// packages/business-logic/src/sessions/useSessionValidation.ts
import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@aureak/api-client'

export function useSessionValidation(sessionId: string) {
  const [validationStatus, setValidationStatus] = useState<string>('pending')
  const [wsConnected, setWsConnected] = useState(false)

  useEffect(() => {
    const channel = supabase
      .channel(`session-validation:${sessionId}`)
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'sessions',
        filter: `id=eq.${sessionId}`
      }, (payload) => {
        setValidationStatus(payload.new.validation_status)
      })
      .subscribe((status) => {
        setWsConnected(status === 'SUBSCRIBED')
      })

    const wsTimeout = setTimeout(() => {
      if (!wsConnected) {
        // Fallback polling activé automatiquement via refetchInterval ci-dessous
      }
    }, 3000)

    return () => {
      supabase.removeChannel(channel)
      clearTimeout(wsTimeout)
    }
  }, [sessionId])

  // Fallback polling : actif si WS non connecté
  const { data } = useQuery({
    queryKey     : ['session-validation', sessionId],
    queryFn      : () => supabase.from('sessions').select('validation_status').eq('id', sessionId).single(),
    refetchInterval: wsConnected ? false : 9000,
    onSuccess    : (data) => setValidationStatus(data.data?.validation_status ?? 'pending'),
  })

  const validate = async () => {
    const { data } = await supabase.rpc('validate_session', { p_session_id: sessionId })
    setValidationStatus(data)
  }

  return { validationStatus, validate }
}
```

### Dépendances

- **Prérequis** : Story 4.1 (sessions, session_coaches) + Story 4.6 (can_close_session)
- **Utilisé en Story 6.4** : `validation_status = 'validated_both'` requis pour clôture

### References
- [Source: epics.md#Story-6.3] — lignes 1974–2006

## Dev Agent Record
### Agent Model Used
claude-sonnet-4-6
### Debug Log References
### Completion Notes List
### File List
