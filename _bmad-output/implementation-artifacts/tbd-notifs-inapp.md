# Story: Notifications in-app

**ID:** tbd-notifs-inapp
**Status:** done
**Source:** new
**Epic:** TBD — Admin UX

## Description
Créer un système de notifications in-app (table DB + API + badge sidebar).

## Changements effectués
- `supabase/migrations/00110_inapp_notifications.sql` :
  - Table `inapp_notifications` (id, tenant_id, user_id, title, body, type, read_at, created_at)
  - Index sur (user_id, created_at DESC) WHERE read_at IS NULL
  - RLS : chaque utilisateur voit ses propres notifs, admin peut insérer
- `packages/api-client/src/notifications.ts` :
  - `listInAppNotifications(opts)` avec filtre unreadOnly
  - `markNotificationRead(notifId)`
  - `markAllNotificationsRead()`
  - `countUnreadNotifications()` — retourne le count
- `packages/api-client/src/index.ts` : exports ajoutés
- `components/NotificationBadge.tsx` :
  - Bouton avec 🔔 et badge rouge avec count
  - Rafraîchissement auto toutes les 60s
  - Navigation vers `/notifications`
- `_layout.tsx` : `<NotificationBadge />` ajouté dans la sidebar

## Acceptance Criteria
- [x] Table `inapp_notifications` avec RLS
- [x] API listInAppNotifications + mark read + count
- [x] Badge dans la sidebar avec count des non lues
- [x] Rafraîchissement automatique

## Commit
`feat(notifs): notifications in-app — migration 00110 + badge sidebar`
