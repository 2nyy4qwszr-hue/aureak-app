# Story 89.3 : Visibilité conditionnelle des coordonnées parent (RGPD) sur prospects gardiens

Status: ready-for-dev

## Story

En tant que **commercial/admin d'une académie**,
je veux que **les coordonnées parent d'un prospect gardien (email, téléphone, adresse) ne soient visibles qu'aux utilisateurs strictement attribués à ce prospect** (créateur initial, inviteur, évaluateur, grant explicite), et masquées (`m****@gmail.com`) pour les autres commerciaux du tenant,
afin de **respecter le principe RGPD de minimisation de l'accès aux données à caractère personnel** tout en conservant une visibilité totale pour l'admin et un mécanisme de demande d'accès trace.

## Acceptance Criteria

1. Une nouvelle table `prospect_access_grants` existe (tenant-scopée, `child_id` + `granted_to` profile id + `granted_by` + `reason` + `granted_at` + `deleted_at`). Un index unique partiel `(child_id, granted_to) WHERE deleted_at IS NULL` empêche les doublons de grant actifs. RLS `tenant_isolation` stricte.
2. Une seconde table `prospect_access_requests` existe (demandes d'accès en attente/approuvées/rejetées) avec RLS tenant-scoped, `requester_id`, `child_id`, `status` (`pending | approved | rejected`), `requested_at`, `resolved_at`, `resolved_by`, `resolved_note`, `deleted_at`.
3. Une troisième table `prospect_rgpd_access_log` existe pour tracer chaque accès effectif aux champs masqués (`accessor_id`, `child_id`, `accessed_at`, `granted_via` parmi `creator | invitation | evaluation | explicit_grant | admin | request_approved`). Insert-only, RLS tenant-isolée, pas d'update ni delete côté client.
4. Une vue SQL `v_child_directory_rgpd` retourne les lignes `child_directory` avec, pour l'utilisateur courant, soit les valeurs brutes (si `role=admin` OU grant actif OU créateur initial) soit des valeurs masquées (`mask_email()`, `mask_phone()`, `mask_address()`) pour `parent1_email`, `parent1_tel`, `parent2_email`, `parent2_tel`, `email`, `tel`, `adresse_rue`, `code_postal`, `localite`. Chaque ligne expose aussi un flag `rgpd_masked` (boolean) et `rgpd_access_via` (enum nullable).
5. Le flag de création **auto-grant** — lorsqu'une ligne `child_directory` est créée avec `prospect_status IS NOT NULL`, un grant `reason='creator'` est inséré pour l'auteur (`created_by`) via trigger DB. Lorsqu'une invitation est envoyée (`prospect_invitations` insert), un grant `reason='invitation'` pour `invited_by` est créé si absent. Lorsqu'une évaluation scout est créée (`prospect_scout_evaluations` insert), un grant `reason='evaluation'` pour `evaluator_id` est créé si absent.
6. Sur toutes les pages listant ou affichant des prospects (`/developpement/prospection/gardiens`, `/developpement/prospection/gardiens/[childId]`, `/children/[childId]` quand `prospectStatus IS NOT NULL`), les champs parent masqués s'affichent au format `m****@example.com` / `+32 47X XX XX 12` / `Rue du P**** 15, 1000 ****` avec un badge **"Masqué (RGPD)"** à côté et un bouton **"Demander l'accès"**.
7. Le bouton "Demander l'accès" ouvre un modal avec textarea raison (obligatoire, max 500 caractères). La soumission insère une ligne `prospect_access_requests` (status `pending`) et déclenche une notification email (Edge Function `notify-rgpd-access-request`) vers l'admin du tenant ET le créateur initial. Toast succès "Demande envoyée" + désactivation du bouton pour ce childId jusqu'à résolution.
8. Un admin dispose d'une page `/admin/rgpd/prospect-access` listant les demandes `pending` du tenant avec actions **Approuver** (crée un grant + met `resolved_at/resolved_by`, status=`approved`) ou **Rejeter** (status=`rejected`, `resolved_note` optionnelle). Notification email au requester sur résolution.
8. Un admin peut à tout moment révoquer un grant explicite depuis la page admin RGPD (soft-delete via `deleted_at`). Les grants de type `creator/invitation/evaluation` restent révocables mais sont réinstaurés automatiquement si l'événement déclencheur se répète (idempotence trigger).
9. Chaque lecture via `v_child_directory_rgpd` qui retourne un champ dé-masqué écrit une ligne dans `prospect_rgpd_access_log` (via RPC wrapper `get_child_directory_rgpd(child_id)` appelé côté api-client). Les lectures masquées ne sont PAS loggées.
10. Un admin (rôle `admin`) voit toujours les valeurs brutes sans grant requis (RLS + vue) — loggé avec `granted_via='admin'`.
11. Validation client : si l'utilisateur tente une demande d'accès alors qu'une demande `pending` existe déjà pour ce child, le bouton affiche "Demande en cours" désactivé. Si un grant actif existe, le bouton n'apparaît pas (les champs sont déjà visibles).
12. Zéro couleur/espacement hardcodé — tous les styles via tokens `@aureak/theme`. Accès Supabase uniquement via `@aureak/api-client`. Console guards `NODE_ENV !== 'production'` systématiques. Try/finally sur tous les setters `saving/loading/requesting`.

## Tasks / Subtasks

- [ ] **T1 — Migration Supabase : tables + trigger créateur** (AC: #1, #2, #3, #5, #8)
  - [ ] T1.1 — Créer `supabase/migrations/00158_prospect_rgpd_access_grants.sql` : (a) colonne `child_directory.created_by UUID REFERENCES auth.users(id)` (nullable, ajoutée IF NOT EXISTS), (b) table `prospect_access_grants`, (c) table `prospect_access_requests`, (d) table `prospect_rgpd_access_log`, (e) enum `rgpd_grant_reason` (`creator | invitation | evaluation | explicit_grant | admin | request_approved`), (f) enum `rgpd_request_status` (`pending | approved | rejected`), (g) index unique partiel `(child_id, granted_to) WHERE deleted_at IS NULL` sur `prospect_access_grants`, (h) RLS tenant-isolée sur les 3 tables, (i) trigger `trg_child_directory_prospect_creator_grant` : AFTER INSERT si `prospect_status IS NOT NULL` → INSERT grant `creator` (idempotent ON CONFLICT DO NOTHING), (j) trigger `trg_prospect_invitation_auto_grant` : AFTER INSERT sur `prospect_invitations` → grant `invitation`, (k) trigger `trg_prospect_scout_evaluation_auto_grant` : AFTER INSERT sur `prospect_scout_evaluations` → grant `evaluation`. SQL complet dans Dev Notes.
  - [ ] T1.2 — Vérifier idempotence complète : `IF NOT EXISTS` sur toutes les tables, `DO $$ IF NOT EXISTS` sur les enums, `DROP POLICY IF EXISTS` + `CREATE POLICY`, `DROP TRIGGER IF EXISTS` + `CREATE TRIGGER`.

- [ ] **T2 — Migration Supabase : vue `v_child_directory_rgpd` + RPC + fonctions mask** (AC: #4, #9, #10)
  - [ ] T2.1 — Créer `supabase/migrations/00159_v_child_directory_rgpd_view.sql` : (a) fonction SQL `mask_email(text) RETURNS text` (`x****@domain.tld`, retourne `NULL` si input NULL), (b) fonction `mask_phone(text) RETURNS text` (garde 2 derniers chiffres, ex `+32 47X XX XX 12`), (c) fonction `mask_address_street(text) RETURNS text` (garde 4 premiers caractères + `****`), (d) fonction `mask_postal_code(text) RETURNS text` (garde 2 premiers caractères + `****`), (e) fonction `user_has_rgpd_access(p_child_id UUID) RETURNS TABLE(has_access boolean, via rgpd_grant_reason)` — retourne `(true, 'admin')` si current_user_role()='admin', sinon cherche un grant actif et retourne la reason, (f) vue `v_child_directory_rgpd` : SELECT toutes colonnes `child_directory.*` + colonnes masquées conditionnellement selon `user_has_rgpd_access()`, + flag `rgpd_masked` + `rgpd_access_via`, (g) RPC SECURITY DEFINER `get_child_directory_rgpd(p_child_id UUID)` : SELECT depuis la vue + insère une ligne dans `prospect_rgpd_access_log` si `rgpd_masked=false`. SQL complet dans Dev Notes.
  - [ ] T2.2 — Créer `get_child_directory_rgpd_list(p_child_ids UUID[])` RPC batch pour éviter N+1 sur les listes (mêmes règles, insère N lignes de log pour les accès démasqués). 
  - [ ] T2.3 — GRANT EXECUTE sur les 2 RPC à `authenticated`.

- [ ] **T3 — Types TypeScript** (AC: #1, #2, #3, #4)
  - [ ] T3.1 — Dans `aureak/packages/types/src/entities.ts`, ajouter après `ProspectInvitation` :
    - `RgpdGrantReason = 'creator' | 'invitation' | 'evaluation' | 'explicit_grant' | 'admin' | 'request_approved'`
    - `RgpdRequestStatus = 'pending' | 'approved' | 'rejected'`
    - `ProspectAccessGrant` (snake→camel miroir DB : `id`, `tenantId`, `childId`, `grantedTo`, `grantedBy`, `reason`, `grantedAt`, `deletedAt`).
    - `ProspectAccessRequest` (`id`, `tenantId`, `childId`, `requesterId`, `reason`, `status`, `requestedAt`, `resolvedAt`, `resolvedBy`, `resolvedNote`, `deletedAt`).
    - `ProspectRgpdAccessLog` (`id`, `tenantId`, `childId`, `accessorId`, `grantedVia`, `accessedAt`).
    - `ChildDirectoryEntryRgpd = ChildDirectoryEntry & { rgpdMasked: boolean; rgpdAccessVia: RgpdGrantReason | null }` — type renvoyé par la vue.
  - [ ] T3.2 — Exporter depuis `aureak/packages/types/src/index.ts` (si index, sinon c'est un barrel direct via entities.ts).

- [ ] **T4 — API client : grants + requests + vue RGPD** (AC: #4, #6, #7, #8, #9, #11)
  - [ ] T4.1 — Créer `aureak/packages/api-client/src/admin/prospect-rgpd.ts` avec :
    - `getChildDirectoryRgpd(childId: string): Promise<ChildDirectoryEntryRgpd>` — appelle RPC `get_child_directory_rgpd`. Log automatique côté DB.
    - `listChildDirectoryRgpd(childIds: string[]): Promise<ChildDirectoryEntryRgpd[]>` — appelle RPC `get_child_directory_rgpd_list`.
    - `requestRgpdAccess(params: { childId: string; reason: string }): Promise<ProspectAccessRequest>` — INSERT dans `prospect_access_requests`, appel suivant de Edge Fn `notify-rgpd-access-request` via `supabase.functions.invoke`.
    - `listRgpdAccessRequests(opts?: { status?: RgpdRequestStatus }): Promise<ProspectAccessRequest[]>` — SELECT JOIN profiles (pour display_name du requester) + JOIN child_directory (pour display_name du prospect). Admin only (RLS gère, mais gate UI aussi).
    - `resolveRgpdAccessRequest(id: string, decision: 'approved' | 'rejected', note?: string): Promise<ProspectAccessRequest>` — UPDATE status + resolved_at + resolved_by + resolved_note. Si `approved`, INSERT grant `request_approved`.
    - `listRgpdGrants(childId?: string): Promise<ProspectAccessGrant[]>` — SELECT JOIN profiles pour `granted_to` name.
    - `revokeRgpdGrant(grantId: string): Promise<void>` — UPDATE `deleted_at = now()`.
    - `hasPendingRgpdRequest(childId: string): Promise<boolean>` — helper UI pour désactiver le bouton.
  - [ ] T4.2 — Exporter les 8 fonctions + 5 types depuis `aureak/packages/api-client/src/index.ts`.

- [ ] **T5 — Edge Function `notify-rgpd-access-request`** (AC: #7, #8)
  - [ ] T5.1 — Créer `supabase/functions/notify-rgpd-access-request/index.ts` : reçoit `{ requestId: UUID }`, charge la request + le child + les destinataires (admins du tenant + `child_directory.created_by`), envoie un email via Resend avec CTA vers `/admin/rgpd/prospect-access`. Pattern : s'inspirer de `supabase/functions/send-trial-invitation/index.ts`.
  - [ ] T5.2 — Créer `supabase/functions/notify-rgpd-access-resolved/index.ts` : notifie le requester à la résolution (approved/rejected). Appelé depuis `resolveRgpdAccessRequest`.
  - [ ] T5.3 — Variables d'environnement : réutiliser `RESEND_API_KEY` + `RESEND_FROM` déjà configurées (cf. `send-trial-invitation`).

- [ ] **T6 — UI : composant `MaskedField` + `RgpdAccessRequestModal`** (AC: #6, #7, #11)
  - [ ] T6.1 — Créer `aureak/apps/web/components/rgpd/MaskedField.tsx` : props `{ value: string | null; masked: boolean; onRequestAccess?: () => void; fieldType: 'email' | 'phone' | 'address'; hasPendingRequest?: boolean }`. Rendu : si `value === null` → "—", sinon affiche valeur + si `masked` un badge "Masqué (RGPD)" + bouton "Demander l'accès" (ou "Demande en cours" désactivé si `hasPendingRequest`). Pas de bouton si pas masqué.
  - [ ] T6.2 — Créer `aureak/apps/web/components/rgpd/RgpdAccessRequestModal.tsx` : modal avec textarea raison (obligatoire, max 500), boutons Annuler/Envoyer. Submit → `requestRgpdAccess` → toast succès → onClose. Try/finally strict sur `setSaving`.

- [ ] **T7 — Intégration fiche prospect + page funnel** (AC: #6, #11)
  - [ ] T7.1 — Dans `aureak/apps/web/app/(admin)/developpement/prospection/gardiens/[childId]/page.tsx` (créer si n'existe pas, sinon modifier) : remplacer l'affichage direct de `parent1Email`, `parent1Tel`, `parent2Email`, `parent2Tel`, `adresseRue`, `codePostal`, `localite` par `<MaskedField />` piloté par le résultat de `getChildDirectoryRgpd(childId)` au lieu de `getChildDirectoryEntry(childId)`. Mapper `rgpdMasked` vers la prop `masked` du composant.
  - [ ] T7.2 — Dans `aureak/apps/web/app/(admin)/children/[childId]/page.tsx` : identique — si `prospectStatus !== null`, utiliser la vue RGPD ; sinon l'entry direct (non-prospect = pas de masking RGPD en V1).
  - [ ] T7.3 — Dans `aureak/apps/web/app/(admin)/developpement/prospection/gardiens/page.tsx` (tableau funnel) : la colonne email/tel du prospect affiche la valeur masquée si `rgpdMasked=true`, sans bouton "Demander l'accès" inline (pour ne pas surcharger la liste). Le bouton est dispo depuis la fiche détail.

- [ ] **T8 — Page admin `/admin/rgpd/prospect-access`** (AC: #8, #10)
  - [ ] T8.1 — Créer `aureak/apps/web/app/(admin)/admin/rgpd/prospect-access/page.tsx` + `index.tsx` (re-export). Gate : `role === 'admin'` uniquement (sinon "Accès refusé" in-page).
  - [ ] T8.2 — Onglets : **Demandes en attente** (default) · **Historique** · **Grants actifs**. 
  - [ ] T8.3 — Table demandes pending : colonnes "Demandeur | Prospect | Raison | Demandé le | Actions". Actions = 2 boutons Approuver/Rejeter. Au click, modal confirmation avec textarea note optionnelle → `resolveRgpdAccessRequest`.
  - [ ] T8.4 — Table grants actifs : liste tous les grants `deleted_at IS NULL` du tenant, avec colonne "Révoquer" (admin uniquement, avec modal confirmation). Réinstauration : si le grant est auto (`creator/invitation/evaluation`) et que l'utilisateur retrigger l'événement, le trigger DB idempotent `ON CONFLICT DO NOTHING` recréera automatiquement le grant le prochain trigger. Un message d'info dans l'UI l'indique.
  - [ ] T8.5 — Ajouter entrée sidebar dynamique pour admin : section `admin` + sous-lien "RGPD Prospects" (utiliser `useEffectivePermissions` + condition `role === 'admin'`).

- [ ] **T9 — Backfill grants pour données existantes** (AC: #5)
  - [ ] T9.1 — Dans `00158_prospect_rgpd_access_grants.sql`, ajouter un bloc `DO $$ ... END $$` de backfill idempotent qui : (a) pour chaque `prospect_invitations` historique, INSERT grant `invitation` si absent, (b) pour chaque `prospect_scout_evaluations` historique, INSERT grant `evaluation` si absent. Pas de grant `creator` rétroactif : `created_by` est NULL pour les lignes pré-migration (aucun `uid` à attribuer → laissé à l'admin en cas de demande).

- [ ] **T10 — Validation Playwright + QA** (AC: tous)
  - [ ] T10.1 — Lancer dev server, login `admin` → naviguer `/developpement/prospection/gardiens/[idProspect]` → vérifier valeurs parent non masquées + pas de badge "Masqué".
  - [ ] T10.2 — Login `commercial` créateur du prospect → vérifier données visibles (grant `creator`).
  - [ ] T10.3 — Login `commercial` différent (non-créateur, pas d'invitation/évaluation sur ce prospect) → vérifier champs masqués `m****@...` + badge + bouton "Demander l'accès".
  - [ ] T10.4 — Soumettre une demande → vérifier toast "Demande envoyée" + bouton passe à "Demande en cours" désactivé + email arrivé (mock ou Mailtrap).
  - [ ] T10.5 — Login admin → `/admin/rgpd/prospect-access` → voir la demande → Approuver avec note → vérifier grant créé.
  - [ ] T10.6 — Retour commercial non-créateur → F5 fiche prospect → valeurs brutes visibles, badge disparu, log écrit dans `prospect_rgpd_access_log`.
  - [ ] T10.7 — Login commercial B qui crée une invitation vers le prospect via Story 89.4 → vérifier auto-grant `invitation` créé, coordonnées visibles sans demande.
  - [ ] T10.8 — QA grep : `grep -n "setSaving(false)\|setLoading(false)" apps/web/components/rgpd/*.tsx` → uniquement dans finally. `grep -rn "console\." apps/web/components/rgpd` → tous guardés `NODE_ENV`.
  - [ ] T10.9 — Playwright `browser_console_messages` zéro erreur JS sur toutes les pages testées.

## Dev Notes

### ⚠️ Contraintes Stack

Ce projet utilise :
- **React Native Web** (View, Pressable, StyleSheet, TextInput, Modal) — pas de Tailwind, pas de className
- **Expo Router** : `page.tsx` = contenu, `index.tsx` = re-export. Composants partagés dans `apps/web/components/rgpd/`.
- **Tokens `@aureak/theme`** : `colors`, `space`, `shadows`, `radius`, `transitions` — jamais de valeur hardcodée
- **Composants `@aureak/ui`** : `AureakText`, `Button`, `Badge`, `Card`, `Input`
- **Accès Supabase UNIQUEMENT via `@aureak/api-client`** — jamais `supabase.from(...)` dans `apps/`
- **Try/finally obligatoire** sur tout state setter `saving/loading/requesting`
- **Console guards** : `if (process.env.NODE_ENV !== 'production') console.error('[RgpdXxx] ...', err)`
- **Soft-delete uniquement** — grants et requests révoqués via `deleted_at`
- **Edge Functions** : plateforme Deno, pattern de référence `supabase/functions/send-trial-invitation/index.ts`

### Décision d'architecture — grains de permissions : ligne RGPD vs section Epic 86

Ambiguïté résolue : **Epic 86 `section_permissions` + `user_section_overrides` gouvernent l'accès CRUD à une *section* entière (onglet sidebar, page).** Cette story 89.3 introduit un grain supplémentaire, **orthogonal** : visibilité *champ-par-ligne* des coordonnées parent RGPD.

- Un commercial avec permission section `prospection` → peut **ouvrir** la page prospect, voir `displayName`, `birthDate`, `currentClub`, notes, évaluations — tout **sauf** les coordonnées parent (masquées) s'il n'a pas de grant RGPD.
- Admin → bypass total (via `current_user_role() = 'admin'` dans la vue).
- Pas de dédoublement avec `getEffectivePermissions` : la logique RGPD s'appuie exclusivement sur `prospect_access_grants` + rôle admin.

**Conséquence** : l'UI doit combiner les deux niveaux — (a) section_permissions pour afficher le lien sidebar et autoriser la route, (b) grants RGPD pour démasquer les champs coordonnées sur la ligne.

### Décision d'architecture — table `prospect_access_grants` vs colonne calculée

**Choix : table séparée.** Raisons :
- Un grant est un **événement avec traçabilité** (qui, quand, par quoi) — pas un flag booléen.
- Support natif de la révocation (soft-delete sur la ligne de grant).
- Performance : index partiel `(child_id, granted_to) WHERE deleted_at IS NULL` lookup O(log n).
- Extension future facile : expiration optionnelle, scopes plus fins (un grant ne concerne aujourd'hui que *toutes* les coordonnées parent ; on pourrait plus tard scoper à `email` vs `tel` via une colonne `fields JSONB`).

### Décision d'architecture — masquage SQL (vue) vs TypeScript

**Choix : masquage côté SQL via `v_child_directory_rgpd` + RPC.** Raisons :
- **Sécurité** : le masquage côté TS serait contournable par un utilisateur qui appelle directement `.from('child_directory').select()`. La vue/RPC est la seule source de vérité.
- **Logging atomique** : l'insertion dans `prospect_rgpd_access_log` se fait dans la même transaction que la lecture via RPC `SECURITY DEFINER`. Impossible de lire sans logger.
- **RLS cohérente** : `child_directory` garde sa RLS tenant_isolation générique ; la couche RGPD est une **vue appliquée** au-dessus, pas une modification de la policy.
- **Coût** : 1 RPC vs 1 SELECT direct — impact négligeable (PostgREST sait appeler les RPC efficacement).

### Décision d'architecture — logging des accès

**Choix : insert-only, via RPC `SECURITY DEFINER`, uniquement sur accès démasqués.** Raisons :
- Le log est **une preuve RGPD**, pas une métrique produit → immuable côté app (pas d'UPDATE/DELETE possible pour `authenticated`).
- Éviter de logger chaque lecture masquée (fort volume, faible valeur) → on ne log que les accès effectifs à la donnée claire.
- Rétention : pas d'expiration automatique en V1. Un job de purge RGPD (service_role Edge Fn planifiée) pourra être ajouté plus tard pour les logs > 5 ans (cf. Epic 10 audit).

### Décision d'architecture — pas d'expiration automatique V1

Hors scope explicite : expiration des grants. Si le besoin apparaît (turnover commercial, par exemple), ajouter une colonne `expires_at TIMESTAMPTZ` + job périodique. Pour V1, les grants sont permanents jusqu'à révocation explicite.

### Décision d'architecture — scope limité aux prospects

**RGPD activée uniquement pour les lignes `child_directory` avec `prospect_status IS NOT NULL`.** Les joueurs Académie actifs (statut `Académicien`) conservent la visibilité standard — leurs parents ont déjà consenti au traitement par l'académie (Epic 10 consents). Cette restriction est portée par la vue : si `prospect_status IS NULL`, la vue retourne les valeurs brutes sans vérifier de grant et `rgpd_masked=false` systématiquement, `rgpd_access_via='not_prospect'` (valeur synthétique hors enum — ou NULL + flag dédié pour rester propre). **Choix final : `rgpd_masked=false` + `rgpd_access_via=NULL` quand `prospect_status IS NULL` ; pas de ligne log écrite.**

### Décision d'architecture — qui est "le créateur initial"

**`child_directory.created_by` (nouveau champ, nullable).** Ajouté dans la migration 00158 car absent du schéma d'origine (00044 = import Notion sans auth). Pour les lignes existantes, `created_by IS NULL` → aucun auto-grant créateur possible, mais l'admin peut approuver une demande manuelle. Les nouvelles lignes créées via Story 89.1 (formulaire scout) écrivent `created_by = auth.uid()` — la modif de `createChildDirectoryEntry` côté api-client est à faire **dans cette story 89.3** (Story 89.1 ne sait pas encore que `created_by` existera).

---

### T1 — Migration `00158_prospect_rgpd_access_grants.sql`

```sql
-- Epic 89 — Story 89.3 : Visibilité conditionnelle RGPD des coordonnées parent prospects
-- Crée : tables grants/requests/log + enums + colonne created_by + triggers auto-grant.

-- 1. Colonne created_by sur child_directory (pour auto-grant créateur)
ALTER TABLE child_directory
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

CREATE INDEX IF NOT EXISTS idx_child_directory_created_by
  ON child_directory(created_by)
  WHERE created_by IS NOT NULL AND deleted_at IS NULL;

-- 2. Enums
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'rgpd_grant_reason') THEN
    CREATE TYPE rgpd_grant_reason AS ENUM (
      'creator',           -- a saisi le prospect lui-même
      'invitation',        -- a envoyé une invitation
      'evaluation',        -- a saisi une éval scout
      'explicit_grant',    -- grant manuel (admin)
      'admin',             -- rôle admin (n'a pas besoin de grant)
      'request_approved'   -- demande d'accès approuvée
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'rgpd_request_status') THEN
    CREATE TYPE rgpd_request_status AS ENUM ('pending', 'approved', 'rejected');
  END IF;
END $$;

-- 3. Table prospect_access_grants
CREATE TABLE IF NOT EXISTS prospect_access_grants (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      UUID        NOT NULL REFERENCES tenants(id),
  child_id       UUID        NOT NULL REFERENCES child_directory(id) ON DELETE CASCADE,
  granted_to     UUID        NOT NULL REFERENCES auth.users(id),
  granted_by     UUID        REFERENCES auth.users(id),  -- NULL si trigger système
  reason         rgpd_grant_reason NOT NULL,
  granted_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at     TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_prospect_access_grants_active
  ON prospect_access_grants(child_id, granted_to)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_prospect_access_grants_granted_to
  ON prospect_access_grants(granted_to, child_id)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_prospect_access_grants_tenant
  ON prospect_access_grants(tenant_id)
  WHERE deleted_at IS NULL;

-- 4. Table prospect_access_requests
CREATE TABLE IF NOT EXISTS prospect_access_requests (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      UUID        NOT NULL REFERENCES tenants(id),
  child_id       UUID        NOT NULL REFERENCES child_directory(id) ON DELETE CASCADE,
  requester_id   UUID        NOT NULL REFERENCES auth.users(id),
  reason         TEXT        NOT NULL CHECK (length(reason) BETWEEN 1 AND 500),
  status         rgpd_request_status NOT NULL DEFAULT 'pending',
  requested_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at    TIMESTAMPTZ,
  resolved_by    UUID        REFERENCES auth.users(id),
  resolved_note  TEXT,
  deleted_at     TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prospect_access_requests_pending
  ON prospect_access_requests(tenant_id, status, requested_at DESC)
  WHERE status = 'pending' AND deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_prospect_access_requests_child
  ON prospect_access_requests(child_id, requester_id)
  WHERE deleted_at IS NULL;

-- 5. Table prospect_rgpd_access_log (insert-only)
CREATE TABLE IF NOT EXISTS prospect_rgpd_access_log (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      UUID        NOT NULL REFERENCES tenants(id),
  child_id       UUID        NOT NULL REFERENCES child_directory(id) ON DELETE CASCADE,
  accessor_id    UUID        NOT NULL REFERENCES auth.users(id),
  granted_via    rgpd_grant_reason NOT NULL,
  accessed_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prospect_rgpd_access_log_child
  ON prospect_rgpd_access_log(child_id, accessed_at DESC);

CREATE INDEX IF NOT EXISTS idx_prospect_rgpd_access_log_accessor
  ON prospect_rgpd_access_log(accessor_id, accessed_at DESC);

-- 6. RLS
ALTER TABLE prospect_access_grants   ENABLE ROW LEVEL SECURITY;
ALTER TABLE prospect_access_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE prospect_rgpd_access_log ENABLE ROW LEVEL SECURITY;

-- prospect_access_grants : tenant read ; insert par admin OU par trigger (service_role) ;
-- update/revoke par admin uniquement
DROP POLICY IF EXISTS pag_select ON prospect_access_grants;
CREATE POLICY pag_select ON prospect_access_grants FOR SELECT
  USING (tenant_id = current_tenant_id());

DROP POLICY IF EXISTS pag_insert ON prospect_access_grants;
CREATE POLICY pag_insert ON prospect_access_grants FOR INSERT
  WITH CHECK (
    tenant_id = current_tenant_id()
    AND (current_user_role() = 'admin' OR granted_by IS NULL)  -- NULL = trigger système
  );

DROP POLICY IF EXISTS pag_update ON prospect_access_grants;
CREATE POLICY pag_update ON prospect_access_grants FOR UPDATE
  USING (tenant_id = current_tenant_id() AND current_user_role() = 'admin')
  WITH CHECK (tenant_id = current_tenant_id());

-- prospect_access_requests : requester + admin voient ; insert = tenant ; update = admin
DROP POLICY IF EXISTS par_select ON prospect_access_requests;
CREATE POLICY par_select ON prospect_access_requests FOR SELECT
  USING (
    tenant_id = current_tenant_id()
    AND (requester_id = auth.uid() OR current_user_role() = 'admin')
  );

DROP POLICY IF EXISTS par_insert ON prospect_access_requests;
CREATE POLICY par_insert ON prospect_access_requests FOR INSERT
  WITH CHECK (
    tenant_id = current_tenant_id()
    AND requester_id = auth.uid()
  );

DROP POLICY IF EXISTS par_update ON prospect_access_requests;
CREATE POLICY par_update ON prospect_access_requests FOR UPDATE
  USING (tenant_id = current_tenant_id() AND current_user_role() = 'admin')
  WITH CHECK (tenant_id = current_tenant_id());

-- prospect_rgpd_access_log : admin read ; insert via RPC SECURITY DEFINER uniquement
DROP POLICY IF EXISTS pral_select ON prospect_rgpd_access_log;
CREATE POLICY pral_select ON prospect_rgpd_access_log FOR SELECT
  USING (tenant_id = current_tenant_id() AND current_user_role() = 'admin');

-- Pas de policy INSERT/UPDATE/DELETE → bloque toute écriture directe
-- (seul le RPC SECURITY DEFINER peut écrire)

-- 7. Triggers auto-grant

-- 7.a — Créateur initial lors d'un insert prospect
CREATE OR REPLACE FUNCTION auto_grant_prospect_creator()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NEW.prospect_status IS NOT NULL AND NEW.created_by IS NOT NULL THEN
    INSERT INTO prospect_access_grants (tenant_id, child_id, granted_to, granted_by, reason)
    VALUES (NEW.tenant_id, NEW.id, NEW.created_by, NULL, 'creator')
    ON CONFLICT (child_id, granted_to) WHERE deleted_at IS NULL DO NOTHING;
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_child_directory_prospect_creator_grant ON child_directory;
CREATE TRIGGER trg_child_directory_prospect_creator_grant
  AFTER INSERT ON child_directory
  FOR EACH ROW EXECUTE FUNCTION auto_grant_prospect_creator();

-- 7.b — Envoyeur d'invitation
CREATE OR REPLACE FUNCTION auto_grant_prospect_inviter()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO prospect_access_grants (tenant_id, child_id, granted_to, granted_by, reason)
  VALUES (NEW.tenant_id, NEW.child_id, NEW.invited_by, NULL, 'invitation')
  ON CONFLICT (child_id, granted_to) WHERE deleted_at IS NULL DO NOTHING;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_prospect_invitation_auto_grant ON prospect_invitations;
CREATE TRIGGER trg_prospect_invitation_auto_grant
  AFTER INSERT ON prospect_invitations
  FOR EACH ROW EXECUTE FUNCTION auto_grant_prospect_inviter();

-- 7.c — Évaluateur scout (prospect_scout_evaluations existe via Story 89.2 / migration 00157)
CREATE OR REPLACE FUNCTION auto_grant_prospect_evaluator()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO prospect_access_grants (tenant_id, child_id, granted_to, granted_by, reason)
  VALUES (NEW.tenant_id, NEW.child_id, NEW.evaluator_id, NULL, 'evaluation')
  ON CONFLICT (child_id, granted_to) WHERE deleted_at IS NULL DO NOTHING;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_prospect_scout_evaluation_auto_grant ON prospect_scout_evaluations;
CREATE TRIGGER trg_prospect_scout_evaluation_auto_grant
  AFTER INSERT ON prospect_scout_evaluations
  FOR EACH ROW EXECUTE FUNCTION auto_grant_prospect_evaluator();

-- 8. Backfill grants pour données historiques (idempotent via ON CONFLICT)
DO $$
BEGIN
  -- Invitations existantes → grant invitation
  INSERT INTO prospect_access_grants (tenant_id, child_id, granted_to, granted_by, reason)
  SELECT tenant_id, child_id, invited_by, NULL, 'invitation'
  FROM prospect_invitations
  WHERE deleted_at IS NULL
  ON CONFLICT (child_id, granted_to) WHERE deleted_at IS NULL DO NOTHING;

  -- Évaluations scout existantes → grant evaluation
  INSERT INTO prospect_access_grants (tenant_id, child_id, granted_to, granted_by, reason)
  SELECT tenant_id, child_id, evaluator_id, NULL, 'evaluation'
  FROM prospect_scout_evaluations
  WHERE deleted_at IS NULL
  ON CONFLICT (child_id, granted_to) WHERE deleted_at IS NULL DO NOTHING;
END $$;

-- 9. Trigger updated_at
CREATE OR REPLACE FUNCTION set_prospect_rgpd_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS trg_pag_updated_at ON prospect_access_grants;
CREATE TRIGGER trg_pag_updated_at BEFORE UPDATE ON prospect_access_grants
  FOR EACH ROW EXECUTE FUNCTION set_prospect_rgpd_updated_at();

DROP TRIGGER IF EXISTS trg_par_updated_at ON prospect_access_requests;
CREATE TRIGGER trg_par_updated_at BEFORE UPDATE ON prospect_access_requests
  FOR EACH ROW EXECUTE FUNCTION set_prospect_rgpd_updated_at();

COMMENT ON TABLE prospect_access_grants   IS 'Story 89.3 — grants d''accès aux coordonnées parent (RGPD, per-line).';
COMMENT ON TABLE prospect_access_requests IS 'Story 89.3 — demandes d''accès RGPD en attente de résolution admin.';
COMMENT ON TABLE prospect_rgpd_access_log IS 'Story 89.3 — log immuable des accès démasqués (preuve RGPD).';
```

Contraintes respectées :
- `IF NOT EXISTS` / `DO $$ IF NOT EXISTS` → idempotent total
- Soft-delete `deleted_at` nullable sur grants/requests (log = insert-only, immuable)
- RLS activée sur les 3 tables
- `ON DELETE CASCADE` sur `child_id` cohérent avec les autres tables prospects
- Index unique partiel empêche les grants actifs dupliqués
- Triggers `SECURITY DEFINER` + `granted_by IS NULL` → passent la policy insert (voir cas "trigger système")

---

### T2 — Migration `00159_v_child_directory_rgpd_view.sql`

```sql
-- Epic 89 — Story 89.3 : Vue + RPC pour accès RGPD masqué aux prospects gardiens

-- 1. Fonctions de masquage (déterministes, idempotentes)
CREATE OR REPLACE FUNCTION mask_email(v_email TEXT)
RETURNS TEXT LANGUAGE plpgsql IMMUTABLE AS $$
BEGIN
  IF v_email IS NULL OR v_email = '' THEN RETURN v_email; END IF;
  -- "alice@domain.tld" → "a****@domain.tld"
  RETURN substring(v_email from 1 for 1) || '****' || substring(v_email from position('@' in v_email));
END; $$;

CREATE OR REPLACE FUNCTION mask_phone(v_phone TEXT)
RETURNS TEXT LANGUAGE plpgsql IMMUTABLE AS $$
DECLARE
  v_clean TEXT;
  v_last  TEXT;
BEGIN
  IF v_phone IS NULL OR v_phone = '' THEN RETURN v_phone; END IF;
  -- Garder 2 derniers chiffres, remplacer le reste par X
  v_clean := regexp_replace(v_phone, '[^0-9+]', '', 'g');
  IF length(v_clean) < 4 THEN RETURN repeat('X', length(v_clean)); END IF;
  v_last  := substring(v_clean from length(v_clean) - 1);
  RETURN substring(v_clean from 1 for 3) || ' XX XX XX ' || v_last;
END; $$;

CREATE OR REPLACE FUNCTION mask_address_street(v_street TEXT)
RETURNS TEXT LANGUAGE plpgsql IMMUTABLE AS $$
BEGIN
  IF v_street IS NULL OR v_street = '' THEN RETURN v_street; END IF;
  IF length(v_street) <= 4 THEN RETURN '****'; END IF;
  RETURN substring(v_street from 1 for 4) || ' ****';
END; $$;

CREATE OR REPLACE FUNCTION mask_postal_code(v_cp TEXT)
RETURNS TEXT LANGUAGE plpgsql IMMUTABLE AS $$
BEGIN
  IF v_cp IS NULL OR v_cp = '' THEN RETURN v_cp; END IF;
  IF length(v_cp) <= 2 THEN RETURN '****'; END IF;
  RETURN substring(v_cp from 1 for 2) || '****';
END; $$;

CREATE OR REPLACE FUNCTION mask_locality(v_loc TEXT)
RETURNS TEXT LANGUAGE plpgsql IMMUTABLE AS $$
BEGIN
  IF v_loc IS NULL OR v_loc = '' THEN RETURN v_loc; END IF;
  RETURN '****';
END; $$;

-- 2. Helper : l'utilisateur courant a-t-il un accès RGPD ?
CREATE OR REPLACE FUNCTION user_has_rgpd_access(p_child_id UUID)
RETURNS TABLE(has_access BOOLEAN, via rgpd_grant_reason)
LANGUAGE plpgsql STABLE SECURITY DEFINER AS $$
DECLARE
  v_role       TEXT;
  v_grant      rgpd_grant_reason;
  v_is_prospect BOOLEAN;
BEGIN
  SELECT prospect_status IS NOT NULL INTO v_is_prospect
  FROM child_directory WHERE id = p_child_id;

  -- Non-prospect : pas de masking
  IF v_is_prospect IS NOT TRUE THEN
    RETURN QUERY SELECT TRUE, NULL::rgpd_grant_reason;
    RETURN;
  END IF;

  -- Admin : bypass
  v_role := current_user_role();
  IF v_role = 'admin' THEN
    RETURN QUERY SELECT TRUE, 'admin'::rgpd_grant_reason;
    RETURN;
  END IF;

  -- Grant actif ?
  SELECT reason INTO v_grant
  FROM prospect_access_grants
  WHERE child_id   = p_child_id
    AND granted_to = auth.uid()
    AND deleted_at IS NULL
  ORDER BY granted_at DESC
  LIMIT 1;

  IF v_grant IS NOT NULL THEN
    RETURN QUERY SELECT TRUE, v_grant;
    RETURN;
  END IF;

  -- Aucun accès
  RETURN QUERY SELECT FALSE, NULL::rgpd_grant_reason;
END; $$;

-- 3. Vue v_child_directory_rgpd
-- Pour chaque ligne, applique le masking selon user_has_rgpd_access.
-- La vue fait un CROSS JOIN LATERAL sur le helper pour récupérer flag + via.
CREATE OR REPLACE VIEW v_child_directory_rgpd AS
SELECT
  cd.id,
  cd.tenant_id,
  cd.display_name,
  cd.nom,
  cd.prenom,
  cd.birth_date,
  cd.statut,
  cd.current_club,
  cd.niveau_club,
  cd.club_directory_id,
  cd.actif,
  cd.notes_internes,
  cd.age_category,
  cd.player_type,
  cd.youth_level,
  cd.senior_division,
  cd.team_level_stars,
  cd.prospect_status,
  cd.trial_used,
  cd.trial_date,
  cd.trial_outcome,
  cd.notion_page_id,
  cd.notion_synced_at,
  cd.deleted_at,
  cd.created_at,
  cd.updated_at,
  cd.created_by,

  -- Champs RGPD conditionnellement masqués
  CASE WHEN acc.has_access THEN cd.email         ELSE mask_email(cd.email)         END AS email,
  CASE WHEN acc.has_access THEN cd.tel           ELSE mask_phone(cd.tel)           END AS tel,
  CASE WHEN acc.has_access THEN cd.parent1_email ELSE mask_email(cd.parent1_email) END AS parent1_email,
  CASE WHEN acc.has_access THEN cd.parent1_tel   ELSE mask_phone(cd.parent1_tel)   END AS parent1_tel,
  cd.parent1_nom,
  CASE WHEN acc.has_access THEN cd.parent2_email ELSE mask_email(cd.parent2_email) END AS parent2_email,
  CASE WHEN acc.has_access THEN cd.parent2_tel   ELSE mask_phone(cd.parent2_tel)   END AS parent2_tel,
  cd.parent2_nom,
  CASE WHEN acc.has_access THEN cd.adresse_rue   ELSE mask_address_street(cd.adresse_rue) END AS adresse_rue,
  CASE WHEN acc.has_access THEN cd.code_postal   ELSE mask_postal_code(cd.code_postal)    END AS code_postal,
  CASE WHEN acc.has_access THEN cd.localite      ELSE mask_locality(cd.localite)          END AS localite,
  cd.contact_declined,

  -- Flags RGPD
  (NOT acc.has_access) AS rgpd_masked,
  acc.via              AS rgpd_access_via
FROM child_directory cd
CROSS JOIN LATERAL user_has_rgpd_access(cd.id) AS acc;

-- La vue hérite de la RLS de child_directory (tenant_isolation).

-- 4. RPC : get_child_directory_rgpd (écrit un log si accès démasqué)
CREATE OR REPLACE FUNCTION get_child_directory_rgpd(p_child_id UUID)
RETURNS SETOF v_child_directory_rgpd
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_row      v_child_directory_rgpd;
  v_tenant   UUID;
BEGIN
  SELECT tenant_id INTO v_tenant FROM child_directory WHERE id = p_child_id;
  IF v_tenant IS NULL THEN RETURN; END IF;

  -- RLS : vérif tenant
  IF v_tenant <> current_tenant_id() THEN
    RAISE EXCEPTION 'forbidden: tenant mismatch';
  END IF;

  SELECT * INTO v_row FROM v_child_directory_rgpd WHERE id = p_child_id;
  IF v_row IS NULL THEN RETURN; END IF;

  -- Log uniquement si accès démasqué (rgpd_masked=false) ET si prospect (rgpd_access_via non NULL)
  IF NOT v_row.rgpd_masked AND v_row.rgpd_access_via IS NOT NULL THEN
    INSERT INTO prospect_rgpd_access_log (tenant_id, child_id, accessor_id, granted_via)
    VALUES (v_tenant, p_child_id, auth.uid(), v_row.rgpd_access_via);
  END IF;

  RETURN NEXT v_row;
END; $$;

-- 5. RPC batch : get_child_directory_rgpd_list (évite N+1 sur listes)
CREATE OR REPLACE FUNCTION get_child_directory_rgpd_list(p_child_ids UUID[])
RETURNS SETOF v_child_directory_rgpd
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_row    v_child_directory_rgpd;
  v_tenant UUID;
BEGIN
  v_tenant := current_tenant_id();

  FOR v_row IN
    SELECT * FROM v_child_directory_rgpd
    WHERE id = ANY(p_child_ids) AND tenant_id = v_tenant
  LOOP
    IF NOT v_row.rgpd_masked AND v_row.rgpd_access_via IS NOT NULL THEN
      INSERT INTO prospect_rgpd_access_log (tenant_id, child_id, accessor_id, granted_via)
      VALUES (v_tenant, v_row.id, auth.uid(), v_row.rgpd_access_via);
    END IF;
    RETURN NEXT v_row;
  END LOOP;
END; $$;

-- 6. GRANTs
GRANT EXECUTE ON FUNCTION get_child_directory_rgpd(UUID)           TO authenticated;
GRANT EXECUTE ON FUNCTION get_child_directory_rgpd_list(UUID[])    TO authenticated;
GRANT EXECUTE ON FUNCTION user_has_rgpd_access(UUID)               TO authenticated;
GRANT SELECT  ON v_child_directory_rgpd                            TO authenticated;
```

---

### T4 — API client : snippets de référence

```typescript
// aureak/packages/api-client/src/admin/prospect-rgpd.ts

import { supabase } from '../supabase'
import type {
  ChildDirectoryEntryRgpd,
  ProspectAccessGrant,
  ProspectAccessRequest,
  RgpdRequestStatus,
} from '@aureak/types'

function toEntryRgpd(row: Record<string, unknown>): ChildDirectoryEntryRgpd {
  // Réutiliser le pattern toEntry de child-directory.ts + ajout des flags
  // ... (mapping complet snake→camel identique à child-directory.ts:11-52)
  return {
    // ... toutes les colonnes standard
    rgpdMasked   : (row.rgpd_masked     as boolean)                          ?? false,
    rgpdAccessVia: (row.rgpd_access_via as ChildDirectoryEntryRgpd['rgpdAccessVia']) ?? null,
  } as ChildDirectoryEntryRgpd
}

export async function getChildDirectoryRgpd(childId: string): Promise<ChildDirectoryEntryRgpd> {
  const { data, error } = await supabase.rpc('get_child_directory_rgpd', { p_child_id: childId })
  if (error) throw error
  if (!data || data.length === 0) throw new Error('child not found')
  return toEntryRgpd(data[0])
}

export async function listChildDirectoryRgpd(childIds: string[]): Promise<ChildDirectoryEntryRgpd[]> {
  if (childIds.length === 0) return []
  const { data, error } = await supabase.rpc('get_child_directory_rgpd_list', { p_child_ids: childIds })
  if (error) throw error
  return (data ?? []).map(toEntryRgpd)
}

export async function requestRgpdAccess(params: {
  childId: string
  reason : string
}): Promise<ProspectAccessRequest> {
  const { data: userRes } = await supabase.auth.getUser()
  const uid = userRes?.user?.id
  if (!uid) throw new Error('not authenticated')

  // tenantId injecté par JWT / current_tenant_id côté RLS.
  // On récupère tenantId côté client via authStore pour l'insert.
  const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', uid).single()
  if (!profile?.tenant_id) throw new Error('no tenant')

  const { data, error } = await supabase
    .from('prospect_access_requests')
    .insert({
      tenant_id   : profile.tenant_id,
      child_id    : params.childId,
      requester_id: uid,
      reason      : params.reason,
    })
    .select()
    .single()
  if (error) throw error

  // Notifier admin + créateur
  await supabase.functions.invoke('notify-rgpd-access-request', { body: { requestId: data.id } })

  return toRequest(data)
}

export async function resolveRgpdAccessRequest(
  id: string,
  decision: 'approved' | 'rejected',
  note?: string,
): Promise<ProspectAccessRequest> {
  const { data: userRes } = await supabase.auth.getUser()
  const uid = userRes?.user?.id
  if (!uid) throw new Error('not authenticated')

  const { data, error } = await supabase
    .from('prospect_access_requests')
    .update({
      status       : decision,
      resolved_at  : new Date().toISOString(),
      resolved_by  : uid,
      resolved_note: note ?? null,
    })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error

  if (decision === 'approved') {
    // Créer le grant
    await supabase.from('prospect_access_grants').insert({
      tenant_id : data.tenant_id,
      child_id  : data.child_id,
      granted_to: data.requester_id,
      granted_by: uid,
      reason    : 'request_approved',
    })
  }

  // Notifier le requester
  await supabase.functions.invoke('notify-rgpd-access-resolved', { body: { requestId: id } })

  return toRequest(data)
}

export async function hasPendingRgpdRequest(childId: string): Promise<boolean> {
  const { data: userRes } = await supabase.auth.getUser()
  const uid = userRes?.user?.id
  if (!uid) return false
  const { count, error } = await supabase
    .from('prospect_access_requests')
    .select('id', { count: 'exact', head: true })
    .eq('child_id', childId)
    .eq('requester_id', uid)
    .eq('status', 'pending')
    .is('deleted_at', null)
  if (error) throw error
  return (count ?? 0) > 0
}
```

Export depuis `aureak/packages/api-client/src/index.ts` :

```typescript
export {
  getChildDirectoryRgpd,
  listChildDirectoryRgpd,
  requestRgpdAccess,
  listRgpdAccessRequests,
  resolveRgpdAccessRequest,
  listRgpdGrants,
  revokeRgpdGrant,
  hasPendingRgpdRequest,
} from './admin/prospect-rgpd'
```

---

### T6 — Composant `MaskedField` de référence

```tsx
// aureak/apps/web/components/rgpd/MaskedField.tsx
'use client'
import { View, Pressable, StyleSheet } from 'react-native'
import { AureakText } from '@aureak/ui'
import { colors, space, radius } from '@aureak/theme'

type Props = {
  value            : string | null
  masked           : boolean
  fieldType        : 'email' | 'phone' | 'address'
  hasPendingRequest: boolean
  onRequestAccess  : () => void
}

export function MaskedField({ value, masked, hasPendingRequest, onRequestAccess }: Props) {
  if (value === null) return <AureakText style={{ color: colors.text.muted }}>—</AureakText>

  return (
    <View style={styles.row}>
      <AureakText style={{ color: masked ? colors.text.muted : colors.text.body }}>
        {value}
      </AureakText>
      {masked && (
        <>
          <View style={styles.badge}>
            <AureakText style={{ fontSize: 10, color: colors.status.amberText }}>
              Masqué (RGPD)
            </AureakText>
          </View>
          <Pressable
            onPress={hasPendingRequest ? undefined : onRequestAccess}
            style={[styles.requestBtn, hasPendingRequest && styles.requestBtnDisabled]}
          >
            <AureakText style={{ fontSize: 12, color: colors.accent.gold }}>
              {hasPendingRequest ? 'Demande en cours' : 'Demander l\'accès'}
            </AureakText>
          </Pressable>
        </>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  row              : { flexDirection: 'row', alignItems: 'center', gap: space.sm, flexWrap: 'wrap' },
  badge            : { backgroundColor: colors.status.amberBg, paddingHorizontal: space.xs, paddingVertical: 2, borderRadius: radius.pill },
  requestBtn       : { paddingHorizontal: space.sm, paddingVertical: space.xs, borderRadius: radius.md, borderWidth: 1, borderColor: colors.accent.gold },
  requestBtnDisabled: { opacity: 0.5 },
})
```

---

### Design — polish

**Type design** : `polish` (pas de PNG, design tokens uniquement)

Tokens à utiliser :

```tsx
import { colors, space, shadows, radius } from '@aureak/theme'

// Badge "Masqué (RGPD)"
backgroundColor : colors.status.amberBg
color           : colors.status.amberText
borderRadius    : radius.pill

// Bouton "Demander l'accès"
borderColor     : colors.accent.gold
color           : colors.accent.gold
borderRadius    : radius.md

// Modal demande d'accès
backgroundColor : colors.background.card
boxShadow       : shadows.lg
borderRadius    : radius.lg

// Table admin RGPD
borderBottomColor: colors.border.subtle
```

Principes design (source `_agents/design-vision.md`) :
- **Fond clair** — modal blanc/beige
- **Accent doré** — CTA "Demander l'accès" discret mais visible
- **Contraste sémantique** — badge "Masqué" en tons ambrés (attention, non-critique)

---

### Fichiers à créer / modifier

| Fichier | Action | Notes |
|---------|--------|-------|
| `supabase/migrations/00158_prospect_rgpd_access_grants.sql` | **Créer** | Tables grants/requests/log + enums + triggers + backfill |
| `supabase/migrations/00159_v_child_directory_rgpd_view.sql` | **Créer** | Fonctions mask + vue RGPD + RPC get_child_directory_rgpd[_list] |
| `aureak/packages/types/src/entities.ts` | Modifier | Ajouter `RgpdGrantReason`, `RgpdRequestStatus`, `ProspectAccessGrant`, `ProspectAccessRequest`, `ProspectRgpdAccessLog`, `ChildDirectoryEntryRgpd` |
| `aureak/packages/api-client/src/admin/prospect-rgpd.ts` | **Créer** | 8 fonctions + mapping toEntryRgpd |
| `aureak/packages/api-client/src/admin/child-directory.ts` | Modifier | Étendre `createChildDirectoryEntry` : injecter `created_by = auth.uid()` côté insert (nouvelle responsabilité) |
| `aureak/packages/api-client/src/index.ts` | Modifier | Exports des 8 nouvelles fonctions + types |
| `supabase/functions/notify-rgpd-access-request/index.ts` | **Créer** | Edge Fn Resend notif admin + créateur |
| `supabase/functions/notify-rgpd-access-resolved/index.ts` | **Créer** | Edge Fn Resend notif requester |
| `aureak/apps/web/components/rgpd/MaskedField.tsx` | **Créer** | Champ avec badge + CTA demande |
| `aureak/apps/web/components/rgpd/RgpdAccessRequestModal.tsx` | **Créer** | Modal raison + submit |
| `aureak/apps/web/app/(admin)/developpement/prospection/gardiens/[childId]/page.tsx` | Créer/Modifier | Utiliser `getChildDirectoryRgpd` + MaskedField |
| `aureak/apps/web/app/(admin)/children/[childId]/page.tsx` | Modifier | Si prospectStatus !== null, utiliser vue RGPD |
| `aureak/apps/web/app/(admin)/developpement/prospection/gardiens/page.tsx` | Modifier | Utiliser `listChildDirectoryRgpd` pour la liste (valeurs masquées inline, sans CTA) |
| `aureak/apps/web/app/(admin)/admin/rgpd/prospect-access/page.tsx` | **Créer** | Page admin demandes + grants |
| `aureak/apps/web/app/(admin)/admin/rgpd/prospect-access/index.tsx` | **Créer** | Re-export |
| `aureak/apps/web/app/(admin)/_nav-config.ts` | Modifier | Ajouter entrée sidebar "RGPD Prospects" visible admin uniquement |

### Fichiers à NE PAS modifier

- `supabase/migrations/00044_seed_child_directory.sql` — table initiale, ne pas rétro-modifier
- `supabase/migrations/00153_create_prospect_invitations.sql` — Story 89.4, table intacte (trigger ajouté *sur* la table, pas dans sa migration)
- `supabase/migrations/00157_create_prospect_scout_evaluations.sql` — Story 89.2, idem
- `supabase/migrations/00150_create_section_permissions.sql` — Epic 86, niveau de permission orthogonal, ne pas toucher
- `aureak/packages/api-client/src/admin/prospect-invitations.ts` — Story 89.4, le trigger DB gère l'auto-grant côté DB
- `aureak/packages/api-client/src/admin/prospect-scout-evaluations.ts` — Story 89.2, idem
- `aureak/packages/ui/src/*` — pas de nouveau composant dans le package partagé, uniquement dans `apps/web/components/rgpd/` (scoped à la feature)

---

### Dépendances à protéger

- **Story 89.1** (`createChildDirectoryEntry`, scout adding) : cette story 89.3 **étend** `createChildDirectoryEntry` pour injecter `created_by`. Si 89.1 n'est pas encore mergée, bien coordonner le merge : 89.1 crée les nouveaux prospects via cette fonction, donc après merge les nouveaux prospects auront un `created_by` et le trigger créera le grant `creator` automatiquement.
- **Story 89.2** (`prospect_scout_evaluations`) : le trigger `trg_prospect_scout_evaluation_auto_grant` dépend de la table existante (migration 00157). **Dépendance stricte** — 89.2 doit être mergée avant 89.3, sinon la migration 00158 échoue. Si 89.2 n'est pas prête, alternative : conditionner la création du trigger via `IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename='prospect_scout_evaluations')`. Recommandé pour éviter un blocage.
- **Story 89.4** (`prospect_invitations`) : merge confirmé (00153). Le trigger `trg_prospect_invitation_auto_grant` s'ajoute sur la table existante sans modifier son contenu.
- **Epic 86** (`section_permissions`, `getEffectivePermissions`) : orthogonal. Cette story ne touche ni à la table, ni au helper. Le bouton d'accès à la page `/admin/rgpd/prospect-access` apparaîtra dans la sidebar via une entrée dédiée conditionnée sur `role === 'admin'` (pas une section_permissions).
- **Story 9.4** (`implantations`, `groups`) : non touché.
- **`child_directory` RLS `tenant_isolation`** (00044:54) : vue `v_child_directory_rgpd` hérite de cette policy via FROM child_directory. Pas de fuite cross-tenant.

### Dépendances satisfaites (vérifiées)

- [x] Table `child_directory` existe (00044 + ajouts)
- [x] Table `prospect_invitations` existe (00153)
- [x] Table `prospect_scout_evaluations` — Story 89.2 en parallèle, migration 00157. Bloquant strict : merger 89.2 AVANT 89.3.
- [x] Fonction `current_tenant_id()` + `current_user_role()` disponibles (Epic 86 + antérieures)
- [x] `auth.uid()` disponible partout
- [x] Pattern Edge Function Resend + Deno : `supabase/functions/send-trial-invitation/index.ts`
- [x] `ToastContext` disponible
- [x] `useAuthStore` expose `role`, `tenantId`, `userId`
- [x] Dernière migration : 00155. 00156 = 89-1, 00157 = 89-2, **00158 + 00159 libres pour 89-3**.

---

### Références

- Pattern RLS tenant + policies `current_*()` : `supabase/migrations/00150_create_section_permissions.sql` + `00149_create_profile_roles.sql`
- Pattern triggers `SECURITY DEFINER` + `ON CONFLICT DO NOTHING` : cherché dans migrations récentes, pattern autonome défini dans cette story (voir T1)
- Pattern Edge Function Resend : `supabase/functions/send-trial-invitation/index.ts`
- Type `ChildDirectoryEntry` : `aureak/packages/types/src/entities.ts` lignes 1138-1199
- Mapping snake→camel : `aureak/packages/api-client/src/admin/child-directory.ts` lignes 11-52 (`toEntry`)
- Fiche joueur existante : `aureak/apps/web/app/(admin)/children/[childId]/page.tsx`
- Page funnel prospection : `aureak/apps/web/app/(admin)/developpement/prospection/gardiens/page.tsx`
- Story 89.1 (créateur initial via scout form) : `_bmad-output/implementation-artifacts/89-1-recherche-ajout-gardien-scout-terrain.md`
- Story 89.2 (évaluations scout) : `_bmad-output/implementation-artifacts/89-2-note-evaluation-scout-rapide.md`
- Story 89.4 (invitations — trigger auto-grant s'applique) : `_bmad-output/implementation-artifacts/89-4-invitation-seance-gratuite-depuis-app.md`
- Epic 86 (permissions section — orthogonal) : `_bmad-output/implementation-artifacts/story-86-3-permissions-granulaires-matrice-admin.md`

---

### Multi-tenant

- Les 3 nouvelles tables ont `tenant_id NOT NULL REFERENCES tenants(id)` + RLS `tenant_id = current_tenant_id()`.
- La vue `v_child_directory_rgpd` hérite de la RLS tenant de `child_directory`.
- Le RPC `get_child_directory_rgpd` vérifie explicitement `tenant_id = current_tenant_id()` avant tout retour + log.
- Les triggers sont `SECURITY DEFINER` mais ils utilisent exclusivement les valeurs de la row NEW (qui contient déjà `tenant_id` validé par RLS lors de l'insert parent) — pas de fuite cross-tenant possible.
- Pas de service_role dans les RPC client-appelées : toutes `SECURITY DEFINER` définies dans un schéma public restent gouvernées par les vérifications `current_tenant_id()` / `auth.uid()` explicites.

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List

| Fichier | Statut |
|---------|--------|
