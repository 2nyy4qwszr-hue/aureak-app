# Story 69.9 : BUG — listAttendancesByChild → 400 (session_date inexistante)

Status: done

## Story

En tant qu'admin,
je veux que la heatmap "Présences 12 mois glissants" s'affiche correctement dans la fiche joueur,
afin de visualiser l'historique de présence d'un joueur sans erreur 400.

## Acceptance Criteria

1. `listAttendancesByChild` ne retourne plus d'erreur 400 PostgREST
2. Le tri est effectué sur la bonne colonne (`scheduled_at` au lieu de `session_date`)
3. La heatmap "Présences 12 mois glissants" dans `/children/[childId]` affiche les données réelles
4. Aucune régression sur les autres fonctions d'attendances

## Tasks

- [x] T1 — Dans `aureak/packages/api-client/src/sessions/attendances.ts`, localiser la fonction `listAttendancesByChild`
- [x] T2 — Corriger la référence de colonne : remplacer `session_date` par `scheduled_at` dans la clause `.order()`
- [x] T3 — Corriger la syntaxe du tri sur table jointe si nécessaire (PostgREST ne supporte pas `.order('sessions.scheduled_at')` — utiliser la syntaxe correcte ou trier post-fetch)
- [x] T4 — Vérifier que la requête retourne bien des données sur `/children/[childId]`

## Dev Notes

**Cause exacte :** La colonne `session_date` n'existe pas dans la table `sessions` — la vraie colonne est `scheduled_at`. De plus, `.order('sessions.scheduled_at', ...)` peut ne pas être supporté par PostgREST pour un tri sur table jointe.

**Fix recommandé :** Retirer le `.order()` sur la colonne jointe et trier les résultats côté JS après fetch, ou utiliser `.order('scheduled_at', { foreignTable: 'sessions' })` si supporté par la version Supabase.

Console guard obligatoire. Try/finally obligatoire.

### Fichiers à modifier

| Fichier | Action |
|---------|--------|
| `aureak/packages/api-client/src/sessions/attendances.ts` | Corriger colonne + tri |

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### File List

| Fichier | Statut |
|---------|--------|
| `aureak/packages/api-client/src/sessions/attendances.ts` | Modifié |
