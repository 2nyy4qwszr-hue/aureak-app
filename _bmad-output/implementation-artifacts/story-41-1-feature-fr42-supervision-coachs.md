# Story 41-1 — Feature: FR42 supervision coachs

**Epic:** 41
**Status:** ready-for-dev
**Priority:** medium

## Story
En tant qu'admin, je veux voir un tableau de supervision des coachs avec leurs indicateurs d'activité afin de suivre l'engagement et détecter les coachs inactifs ou avec des taux de check-in faibles.

## Acceptance Criteria
- [ ] AC1: Une page `/coaches/supervision` est accessible depuis le menu admin
- [ ] AC2: Un tableau liste tous les coachs (profiles avec role='coach') avec les colonnes: Nom, Séances ce mois, Taux check-in (%), Dernière connexion
- [ ] AC3: "Séances ce mois" = nombre de sessions où le coach est responsable (via `group_staff` role='principal' + sessions de ce mois)
- [ ] AC4: "Taux check-in" = (présences enregistrées par ce coach / total attendus dans ses groupes) × 100
- [ ] AC5: "Dernière connexion" = `last_sign_in_at` depuis `auth.users` ou `profiles.updated_at` si non disponible
- [ ] AC6: Les coachs avec taux < 50% sont mis en évidence visuellement (badge rouge ou row colorée)
- [ ] AC7: Le tableau est triable par colonne (réutiliser pattern story 40-1)
- [ ] AC8: Pas de migration SQL nécessaire — les données sont déjà dans les tables existantes

## Tasks
- [ ] Créer `aureak/packages/api-client/src/admin/coaches-supervision.ts` — function `getCoachesSupervision(tenantId, month)` avec query join: `profiles` + `group_staff` + `sessions` + `attendance`
- [ ] Créer `aureak/apps/web/app/(admin)/coaches/supervision/page.tsx` — tableau avec les colonnes définies, badge rouge si taux < 50%
- [ ] Créer `aureak/apps/web/app/(admin)/coaches/supervision/index.tsx` — re-export de `./page`
- [ ] Ajouter lien "Supervision" dans la section Coachs de `aureak/apps/web/app/(admin)/_layout.tsx`
- [ ] Exporter `getCoachesSupervision` depuis `@aureak/api-client/src/index.ts`
- [ ] Vérifier QA: try/finally sur le fetch, console guards présents

## Dev Notes
- Fichiers à modifier:
  - `aureak/packages/api-client/src/admin/coaches-supervision.ts` (nouveau)
  - `aureak/packages/api-client/src/index.ts`
  - `aureak/apps/web/app/(admin)/coaches/supervision/page.tsx` (nouveau)
  - `aureak/apps/web/app/(admin)/coaches/supervision/index.tsx` (nouveau)
  - `aureak/apps/web/app/(admin)/_layout.tsx`
- Query SQL approximative (à adapter en Supabase client):
  ```sql
  SELECT
    p.id,
    p.display_name,
    COUNT(DISTINCT s.id) FILTER (WHERE s.date >= date_trunc('month', NOW())) AS sessions_this_month,
    COUNT(a.id) FILTER (WHERE a.status = 'present') * 100.0 / NULLIF(COUNT(a.id), 0) AS checkin_rate,
    p.updated_at AS last_activity
  FROM profiles p
  JOIN group_staff gs ON gs.coach_id = p.id
  LEFT JOIN sessions s ON s.group_id = gs.group_id
  LEFT JOIN attendance a ON a.session_id = s.id AND a.recorded_by = p.id
  WHERE p.role = 'coach'
  GROUP BY p.id, p.display_name, p.updated_at
  ```
- Alternativement: utiliser une Edge Function ou plusieurs queries séquentielles si la join complexe est difficile en SDK
- Type TS à créer: `CoachSupervisionRow { coachId, displayName, sessionsThisMonth, checkinRate, lastActivity }`
- Pas de migration Supabase nécessaire
