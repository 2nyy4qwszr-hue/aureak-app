# Story 89.4 : Invitation séance gratuite depuis l'app

Status: ready-for-dev

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

- [ ] Task 1 — Migration Supabase (AC: #5)
  - [ ] Table `prospect_invitations` (child_id, invited_by, parent_email, parent_name, implantation_id, message, sent_at, status)
  - [ ] RLS policies
- [ ] Task 2 — Edge Function email (AC: #3, #7)
  - [ ] Créer ou étendre Edge Function pour envoi invitation via Resend
  - [ ] Template HTML email Aureak (logo, infos séance, CTA)
- [ ] Task 3 — API client (AC: #1, #2, #4)
  - [ ] `sendTrialInvitation(data)` dans `@aureak/api-client`
  - [ ] Auto-update `prospect_status` → `invite`
- [ ] Task 4 — UI bouton + formulaire (AC: #1, #2, #6)
  - [ ] Bouton "Inviter" dans la fiche gardien prospect
  - [ ] Modale avec formulaire (React Hook Form + Zod)
  - [ ] Champ email parent avec sauvegarde dans la fiche

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

### Debug Log References

### Completion Notes List

### File List
