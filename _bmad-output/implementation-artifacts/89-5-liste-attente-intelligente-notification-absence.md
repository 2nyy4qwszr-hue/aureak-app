# Story 89.5 : Liste d'attente intelligente + notification absence

Status: ready-for-dev

## Story

En tant que parent d'un gardien prospect,
je veux être notifié automatiquement quand une place se libère dans un groupe,
afin que mon enfant puisse participer à sa séance d'essai gratuite au plus vite.

## Acceptance Criteria

1. Table `trial_waitlist` avec : child_id, group_id, implantation_id, parent_email, parent_phone, requested_at, notified_at, status (waiting, notified, confirmed, expired)
2. Le prospect peut être ajouté à la liste d'attente d'un ou plusieurs groupes
3. Quand une absence est enregistrée dans un groupe (via le système de présences), le système vérifie la waitlist
4. Si un prospect est en attente → notification automatique au parent (email + optionnel SMS)
5. Le parent a X heures pour confirmer (configurable, défaut 24h), sinon le slot passe au suivant
6. Si le parent confirme → statut gardien passe à `essai_planifie` + crée une entrée dans le roster de la séance
7. Vue admin : liste d'attente par groupe avec statuts

## Tasks / Subtasks

- [ ] Task 1 — Migration Supabase (AC: #1)
  - [ ] Créer table `trial_waitlist`
  - [ ] RLS policies (admin + parent concerné)
- [ ] Task 2 — Trigger détection absence (AC: #3, #4)
  - [ ] Trigger ou Edge Function : quand `attendance_records` enregistre une absence → check `trial_waitlist` pour le groupe
  - [ ] Envoi notification via Resend (email) + optionnel Twilio (SMS)
- [ ] Task 3 — API client (AC: #2, #5, #6)
  - [ ] `addToWaitlist(childId, groupId, parentEmail)` dans `@aureak/api-client`
  - [ ] `confirmTrialSlot(waitlistId)` — parent confirme
  - [ ] `listWaitlist(groupId?)` — vue admin
- [ ] Task 4 — UI admin (AC: #2, #7)
  - [ ] Section "Liste d'attente" dans la page prospection gardiens
  - [ ] Tableau : gardien, groupe, statut, date demande, date notification
- [ ] Task 5 — Expiration automatique (AC: #5)
  - [ ] Cron ou trigger pour expirer les confirmations non répondues après 24h
  - [ ] Passage au prospect suivant dans la file

## Dev Notes

- Feature avancée — dépend du système de présences (epic 4, done) et de prospection gardiens (89-1, 89-2)
- Le trigger sur `attendance_records` doit être performant (vérifie la waitlist uniquement si absence = true)
- V1 peut être simplifiée : notification manuelle par l'admin au lieu du trigger automatique
- La confirmation par le parent peut être un simple lien dans l'email (pas besoin de compte)

### References

- [Brainstorming: idées #20, #21 Prospection — séance gratuite automatisée, liste d'attente intelligente]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
