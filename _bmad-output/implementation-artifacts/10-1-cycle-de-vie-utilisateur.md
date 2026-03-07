# Story 10.1 : Cycle de Vie Utilisateur

Status: ready-for-dev

## Story

En tant qu'Admin,
Je veux gérer le cycle de vie complet d'un utilisateur (création → activation → suspension → suppression douce),
Afin d'assurer que seuls les utilisateurs actifs accèdent à l'application et que les données sont correctement archivées.

## Acceptance Criteria

**AC1 — Colonne `profiles.status`**
- **When** la migration Story 10.1 est exécutée
- **Then** `profiles.status TEXT NOT NULL DEFAULT 'active'` avec CHECK sur les 5 états

**AC2 — Table `user_lifecycle_events` immuable**
- **And** table append-only avec policy `no_update` et `no_delete`

**AC3 — RPCs cycle de vie**
- **And** `suspend_user(p_user_id, p_reason)` : UPDATE status + INSERT lifecycle event
- **And** `request_user_deletion(p_user_id)` : UPDATE status='pending_deletion' + INSERT lifecycle event + délai 30 jours

**AC4 — Blocage connexion**
- **And** utilisateur `status = 'suspended'` ou `'deleted'` ne peut pas se connecter — RLS global enrichi

**AC5 — Anonymisation après 30 jours**
- **And** suppression effective : `name → 'Supprimé'`, `email → NULL`, données anonymisées conservées pour statistiques

**AC6 — Couverture FRs**
- **And** FR53 couvert : cycle de vie complet avec traçabilité immuable
- **And** `supabase db diff` reste clean

## Tasks / Subtasks

- [ ] Task 1 — Migration `00023_lifecycle.sql` (AC: #1, #2)
  - [ ] 1.1 `ALTER TABLE profiles ADD COLUMN status TEXT`
  - [ ] 1.2 Créer `user_lifecycle_events` + RLS immuable

- [ ] Task 2 — RPCs cycle de vie (AC: #3)
  - [ ] 2.1 `suspend_user` + `reactivate_user`
  - [ ] 2.2 `request_user_deletion`

- [ ] Task 3 — RLS blocage connexion (AC: #4)
  - [ ] 3.1 Ajouter `AND profiles.status = 'active'` aux policies RLS existantes
  - [ ] 3.2 Enrichir `is_active_user()` helper existant

- [ ] Task 4 — Edge Function `anonymize-deleted-users` (AC: #5)
  - [ ] 4.1 Cron mensuel : détecter `status='pending_deletion' AND lifecycle_event.created_at < now() - 30 days`
  - [ ] 4.2 Anonymiser `first_name`, `last_name`, `email` dans `profiles`

- [ ] Task 5 — UI Admin (AC: #3)
  - [ ] 5.1 Actions "Suspendre" / "Réactiver" / "Demander suppression" dans `apps/web/app/(admin)/users/[userId]/index.tsx`

## Dev Notes

### Migration `00023_lifecycle.sql`

```sql
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('pending','active','suspended','pending_deletion','deleted'));

-- Journal immuable des événements de cycle de vie
CREATE TABLE user_lifecycle_events (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  UUID NOT NULL REFERENCES tenants(id),
  user_id    UUID NOT NULL REFERENCES profiles(user_id),
  event_type TEXT NOT NULL CHECK (event_type IN (
    'created','activated','suspended','reactivated',
    'deletion_requested','deleted','data_exported'
  )),
  actor_id   UUID REFERENCES profiles(user_id),  -- NULL si système
  reason     TEXT,
  metadata   JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE user_lifecycle_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON user_lifecycle_events
  FOR ALL USING (tenant_id = current_tenant_id());
CREATE POLICY "admin_only" ON user_lifecycle_events
  FOR ALL USING (current_user_role() = 'admin');
CREATE POLICY "no_update" ON user_lifecycle_events FOR UPDATE USING (false);
CREATE POLICY "no_delete" ON user_lifecycle_events FOR DELETE USING (false);
```

### RPCs cycle de vie

```sql
CREATE OR REPLACE FUNCTION suspend_user(p_user_id UUID, p_reason TEXT DEFAULT NULL)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF current_user_role() != 'admin' THEN RAISE EXCEPTION 'Accès refusé'; END IF;
  UPDATE profiles SET status = 'suspended'
    WHERE user_id = p_user_id AND tenant_id = current_tenant_id();
  INSERT INTO user_lifecycle_events (tenant_id, user_id, event_type, actor_id, reason)
  VALUES (current_tenant_id(), p_user_id, 'suspended', auth.uid(), p_reason);
END;
$$;

CREATE OR REPLACE FUNCTION request_user_deletion(p_user_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF current_user_role() != 'admin' THEN RAISE EXCEPTION 'Accès refusé'; END IF;
  UPDATE profiles SET status = 'pending_deletion'
    WHERE user_id = p_user_id AND tenant_id = current_tenant_id();
  INSERT INTO user_lifecycle_events (tenant_id, user_id, event_type, actor_id)
  VALUES (current_tenant_id(), p_user_id, 'deletion_requested', auth.uid());
END;
$$;

REVOKE ALL ON FUNCTION suspend_user, request_user_deletion FROM PUBLIC;
GRANT EXECUTE ON FUNCTION suspend_user, request_user_deletion TO authenticated;
```

### Enrichissement `is_active_user()`

```sql
-- Modifier le helper existant pour inclure status check
CREATE OR REPLACE FUNCTION is_active_user()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE user_id = auth.uid()
      AND tenant_id = current_tenant_id()
      AND status = 'active'
  );
$$;
```

### Dépendances

- **Prérequis** : Story 2.2 (profiles, RLS helpers) + Story 1.2 (audit_logs)
- **Consommé par** : Story 10.2 (révocation consentements), Story 10.3 (effacement RGPD)

### References
- [Source: epics.md#Story-10.1] — lignes 3136–3208

## Dev Agent Record
### Agent Model Used
claude-sonnet-4-6
### Debug Log References
### Completion Notes List
### File List
