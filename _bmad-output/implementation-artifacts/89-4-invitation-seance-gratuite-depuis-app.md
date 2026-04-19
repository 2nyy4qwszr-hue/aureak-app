# Story 89.4 : Invitation séance gratuite depuis l'app

Status: done

## Story

En tant que scout ou admin,
je veux pouvoir envoyer une invitation à une séance gratuite directement depuis l'app,
afin que le parent du gardien prospect reçoive un email professionnel avec les infos pratiques.

## Acceptance Criteria

1. Bouton "Inviter à une séance gratuite" sur la fiche d'un gardien prospect
2. Formulaire d'invitation : email parent (obligatoire), prénom parent, implantation souhaitée, message personnalisé (optionnel)
3. L'invitation est envoyée par email via Resend (Edge Function existante ou nouvelle)
4. Le statut du gardien passe automatiquement de `prospect`/`contacte` à `invite`
5. L'invitation est tracée : date d'envoi, envoyé par, email du parent
6. Si le scout ajoute l'email du parent, il peut le voir (story 89 — visibilité conditionnelle)
7. Template email professionnel avec branding Aureak

## Tasks / Subtasks

- [x] Task 1 — Migration Supabase (AC: #5)
  - [x] Table `prospect_invitations` (child_id, invited_by, parent_email, parent_name, implantation_id, message, sent_at, status) + enum `prospect_status` + colonne `child_directory.prospect_status`
  - [x] RLS policies (tenant_isolation select/insert/update)
- [x] Task 2 — Edge Function email (AC: #3, #7)
  - [x] Edge Function `send-trial-invitation` créée (envoi via Resend)
  - [x] Template HTML email Aureak (logo, implantation, message scout, CTA mailto)
- [x] Task 3 — API client (AC: #1, #2, #4)
  - [x] `sendTrialInvitation(data)` + `listProspectInvitations(childId)` dans `@aureak/api-client`
  - [x] Auto-update `prospect_status` → `invite` (effectué côté Edge Function, atomique avec l'insert invitation)
- [x] Task 4 — UI bouton + formulaire (AC: #1, #2, #6)
  - [x] Bouton "Inviter à une séance gratuite" dans l'en-tête de la fiche (visible si `prospect_status ∈ {prospect, contacte}`)
  - [x] Modale `_TrialInvitationModal.tsx` avec formulaire (React Hook Form + Zod)
  - [x] Champ email parent pré-rempli depuis la fiche, sauvegardé automatiquement si vide (Edge Function met à jour `parent1_email` ou `parent2_email`)
  - [x] Badge "Invitation envoyée" après envoi

## Dev Notes

- Resend est déjà configuré pour les notifications (Edge Functions existantes)
- L'invitation est un one-shot — pas de lien de réservation automatique (V1)
- La séance gratuite est gérée manuellement par Mika pour le moment (le système automatique = story 89-5)
- Le statut `invite` signifie "invitation envoyée, en attente de réponse"

### References

- [Brainstorming: idée #18 Prospection — invitation séance gratuite]
- [Source: supabase/functions/ — Edge Functions existantes]

## Dev Agent Record

### Agent Model Used
Claude Opus 4.7 (1M context)

### Debug Log References
n/a

### Completion Notes List
- Enum `prospect_status` ajouté + colonne nullable sur `child_directory` (un Académicien n'a pas de prospect_status)
- L'Edge Function gère **à la fois** l'envoi Resend, la trace dans `prospect_invitations`, la mise à jour de `prospect_status`, et la sauvegarde de `parent1_email` / `parent2_email` si vide — tout se fait en 1 appel depuis l'UI
- La trace est persistée même en cas d'échec Resend (status='failed'), pour l'audit
- Le bouton n'apparaît que pour les gardiens avec `prospect_status ∈ {prospect, contacte}` — un badge "Invitation envoyée" remplace le bouton après envoi
- La story 89-5 (liste d'attente auto) et 89-6 (one-shot tracable) s'appuieront sur cette trace

### File List
- `supabase/migrations/00153_create_prospect_invitations.sql` (new)
- `supabase/functions/send-trial-invitation/index.ts` (new)
- `aureak/packages/types/src/entities.ts` (edit — ajout `ProspectStatus`, `ProspectInvitation`, champ sur `ChildDirectoryEntry`)
- `aureak/packages/api-client/src/admin/child-directory.ts` (edit — mapping + UpdateParams)
- `aureak/packages/api-client/src/admin/prospect-invitations.ts` (new)
- `aureak/packages/api-client/src/index.ts` (edit — exports)
- `aureak/apps/web/app/(admin)/children/[childId]/_TrialInvitationModal.tsx` (new)
- `aureak/apps/web/app/(admin)/children/[childId]/page.tsx` (edit — bouton header + modale)
