# Story: Digest hebdomadaire coach

**ID:** tbd-digest-coach
**Status:** done
**Source:** new
**Epic:** TBD — Notifications

## Description
Créer une Edge Function `weekly-digest-coach` qui envoie un digest hebdomadaire
aux coaches actifs via Resend.

## Changements effectués
- `supabase/functions/weekly-digest-coach/index.ts` :
  - Charge tous les coaches actifs (profiles WHERE role = 'coach' AND is_active = true)
  - Pour chaque coach : charge les séances de la semaine passée via `v_session_presence_summary`
  - Construit un email HTML responsive (palette Aureak, gold, beige)
  - KPIs : nombre de séances, taux présence, séances clôturées/total
  - Tableau des séances (date, statut, taux présence)
  - Envoi via Resend API
  - Retourne `{ sent, errors }`

## Variables d'environnement requises
- `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` (auto-injectés)
- `RESEND_API_KEY` : clé API Resend
- `RESEND_FROM_EMAIL` : ex. `noreply@aureak.be`

## Cron suggéré
Lundi 08h00 : `0 8 * * 1`

## Acceptance Criteria
- [x] Edge Function créée
- [x] Email HTML responsive avec KPIs
- [x] Tableau des séances par coach
- [x] Envoi via Resend
- [x] Gestion erreurs par coach (pas de blocage global)

## Commit
`feat(digest): edge function weekly-digest-coach via Resend`
