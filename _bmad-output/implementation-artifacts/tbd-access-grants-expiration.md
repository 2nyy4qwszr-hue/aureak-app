# Story: Accès temporaires — alertes d'expiration

**ID:** tbd-access-grants-expiration
**Status:** done
**Source:** new
**Epic:** TBD — Admin Actions

## Description
Améliorer la page `/access-grants/` pour signaler les grants expirant bientôt.

## Changements effectués
- `supabase/migrations/00109_access_grants_expiration_index.sql` :
  - Index `idx_coach_access_grants_expires_at` sur `expires_at` WHERE `revoked_at IS NULL`
- `access-grants/page.tsx` :
  - Calcul des grants expirant dans moins de 24h (`expiringSoon`)
  - Bannière d'alerte si des grants expirent bientôt
  - Badge "(Expire dans X h/min)" sur chaque carte concernée
  - Bordure orange gauche sur les cartes expirant bientôt
  - Styles `expiryAlert` et `grantCardExpiring` ajoutés

## Acceptance Criteria
- [x] Migration 00109 créée
- [x] Bannière d'alerte expiration imminente (< 24h)
- [x] Badge de délai sur chaque grant concerné
- [x] Style visuel distinctif pour les grants expirants

## Commit
`feat(access-grants): alertes expiration imminente — migration 00109`
