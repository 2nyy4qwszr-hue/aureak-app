# Story 89.5 : Liste d'attente intelligente + notification absence

Status: done

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

- [x] Task 1 — Migration Supabase (AC: #1) — `00154_create_trial_waitlist.sql`
  - [x] Table `trial_waitlist` + enum `waitlist_status`
  - [x] RLS admin-tenant-scoped (confirmation parent via Edge Function avec service role)
- [x] Task 2 — Trigger détection absence (AC: #3, #4)
  - [x] Trigger SQL `trg_notify_waitlist_on_absence` → pg_net.http_post vers Edge Function `notify-waitlist`
  - [x] Edge Function notify-waitlist : FIFO + envoi Resend + update status='notified'
- [x] Task 3 — API client (AC: #2, #5, #6) — `@aureak/api-client/src/admin/trial-waitlist.ts`
  - [x] `addToWaitlist`, `listWaitlist`, `listWaitlistByChild`, `removeFromWaitlist`, `confirmTrialSlot`
  - [x] Confirmation parent via Edge Function `confirm-trial-slot` (token + 24h window + roster insert)
- [x] Task 4 — UI admin (AC: #2, #7)
  - [x] Page dédiée `/(admin)/waitlist/page.tsx` : StatCards par statut + filtres + tableau
  - [x] Bouton "+ Liste d'attente" + `_WaitlistModal.tsx` sur fiche gardien prospect
- [x] Task 5 — Expiration automatique (AC: #5)
  - [x] SQL function `expire_waitlist_entries()` + Edge Function `expire-waitlist` (à scheduler)
  - [x] Notification automatique du prospect suivant après expiration

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
