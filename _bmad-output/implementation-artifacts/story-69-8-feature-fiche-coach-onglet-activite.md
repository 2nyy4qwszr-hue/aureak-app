# Story 69.8 : FEATURE — Fiche coach : onglet Activité (stats séances + évaluations)

Status: done

## Story
En tant qu'admin, je veux voir les données opérationnelles d'un coach dans sa fiche (séances animées, présence moyenne, évaluations saisies), afin de superviser son activité sans passer par des exports manuels.

## Acceptance Criteria
1. Nouvel onglet "Activité" dans la fiche coach `/coaches/[coachId]` (après les onglets existants)
2. Section stats (3 cards) : Séances animées (count total) · Présence moyenne (% calculé sur ses séances) · Évaluations saisies (count)
3. Liste des 10 dernières séances animées : date + groupe + statut + lien vers la fiche séance
4. Si aucune séance : empty state "Aucune séance animée pour ce coach"
5. Données depuis l'API — aucune valeur mockée
6. Aucune migration DB — jointures `session_coaches` + `attendances` + `evaluations` existantes

## Dev Notes
La fiche coach est `aureak/apps/web/app/(admin)/coaches/[coachId]/page.tsx`. Elle utilise déjà le pattern `MetricTile` avec `div` + style inline (HTML natif, pas React Native). Conserver ce style pour les nouvelles stat cards.

Le fichier `aureak/packages/api-client/src/admin/coaches.ts` existe et contient uniquement `listCoaches`. Il faut y ajouter :

**`getCoachSessionStats(coachId: string)`** :
```sql
SELECT
  COUNT(DISTINCT s.id)   AS sessions_count,
  COUNT(DISTINCT e.id)   AS evaluations_count,
  AVG(
    CASE WHEN a.total > 0 THEN (a.present::float / a.total) * 100 END
  ) AS avg_presence_pct
FROM session_coaches sc
JOIN sessions s ON s.id = sc.session_id AND s.deleted_at IS NULL
LEFT JOIN evaluations e ON e.session_id = s.id AND e.coach_id = $coachId
LEFT JOIN LATERAL (
  SELECT
    COUNT(*) FILTER (WHERE status = 'present') AS present,
    COUNT(*) AS total
  FROM attendances WHERE session_id = s.id
) a ON true
WHERE sc.coach_id = $coachId
```
Adapter en Supabase JS si nécessaire (ou utiliser RPC si disponible).

**Alternative pragmatique** si les jointures complexes posent problème : récupérer `listSessionsAdminView` filtré par coachId (si le paramètre existe), puis calculer les stats côté client.

**`listCoachRecentSessions(coachId: string, limit = 10)`** :
Retourner les 10 dernières séances (via `session_coaches` JOIN `sessions`), triées par `scheduled_at DESC`. Champs : id, scheduledAt, groupId (+ groupName si disponible), status.

**Type de retour** à définir dans `coaches.ts` :
```typescript
export type CoachSessionStats = {
  sessionsCount    : number
  evaluationsCount : number
  avgPresencePct   : number | null
}

export type CoachRecentSession = {
  id          : string
  scheduledAt : string
  groupName   : string | null
  status      : string
}
```

Style stat cards : identique au composant `MetricTile` existant dans `page.tsx` (fond `colors.light.surface`, shadow `shadows.sm`, bordure `colors.border.divider`, label 10px uppercase, valeur 28px bold).

Liste séances : ligne 52px avec date formattée + nom groupe + badge statut + `Pressable` → `router.push('/seances/[sessionId]')`.

Try/finally obligatoire sur TOUT state loader. Console guards obligatoires.

## Tasks
- [ ] T1 — Dans `coaches/[coachId]/page.tsx`, ajouter "Activité" aux onglets de navigation (après les onglets existants) ; gérer l'état `activeTab`
- [ ] T2 — Dans `api-client/src/admin/coaches.ts`, ajouter :
  - Type `CoachSessionStats` + `CoachRecentSession`
  - Fonction `getCoachSessionStats(coachId: string): Promise<CoachSessionStats>`
  - Fonction `listCoachRecentSessions(coachId: string, limit?: number): Promise<CoachRecentSession[]>`
  - Les 2 fonctions utilisent la jointure `session_coaches` JOIN `sessions`
- [ ] T3 — Créer le bloc `CoachActiviteTab` inline dans `[coachId]/page.tsx` :
  - 3 stat cards grille 3 colonnes (Séances · Présence moy. · Évaluations)
  - Liste des 10 séances récentes (date + groupe + statut + lien)
  - Empty state si 0 séances
- [ ] T4 — Ajouter les imports nécessaires, gérer loading + error avec try/finally
- [ ] T5 — Exporter les nouvelles fonctions depuis `@aureak/api-client` (vérifier `index.ts` ou barrel d'export)
- [ ] T6 — QA scan : try/finally, console guards, zéro couleur hardcodée

## Dépendances
Aucune migration DB. Nécessite que `session_coaches` et `sessions` existent (c'est le cas).

## Dev Agent Record
### Agent Model Used
### File List
| Fichier | Statut |
|---------|--------|
| `aureak/apps/web/app/(admin)/coaches/[coachId]/page.tsx` | À modifier |
| `aureak/packages/api-client/src/admin/coaches.ts` | À modifier |
