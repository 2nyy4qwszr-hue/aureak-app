# Bug Crawler — 2026-04-06

> Focus prioritaire : `dashboard/page.tsx` (story 50-11) + `evenements/page.tsx` + `developpement/page.tsx`
> App vérifiée active : HTTP 200 sur http://localhost:8081 ✓
> Mode : Playwright live crawl + analyse statique API client

---

## Résumé

- Pages crawlées : 9 (`/dashboard`, `/children`, `/seances`, `/seances/new`, `/stages`, `/clubs`, `/methodologie`, `/evenements`, `/developpement`)
- **CRITICAL : 3**
- **HIGH : 2**
- **MEDIUM : 1**
- **LOW : 1**

---

## Bugs détectés

---

### 🔴 CRITICAL — Table `attendance_records` inexistante en DB

**Page :** `/dashboard` (et toute page utilisant le dashboard layout)
**Message :**
```
Could not find the table 'public.attendance_records' in the schema cache
(hint: Perhaps you meant the table 'public.attendance_corrections')
[dashboard] getTopStreakPlayers attendance error: { code: PGRST205 }
```
**Fichiers sources :**
- `aureak/packages/api-client/src/admin/dashboard.ts` — `getTopStreakPlayers()` ligne 29, `fetchActivityFeed()` ligne 123
- `aureak/packages/api-client/src/gamification/academy-score.ts` — lignes 41, 46, 109–112
- `aureak/packages/api-client/src/realtime/liveSessionCounts.ts` — ligne 45
- `aureak/packages/api-client/src/analytics.ts` — lignes 23, 83, 240, 437

**Reproductible :** Oui — naviguer vers `/dashboard` → chargement automatique → HTTP 404 sur toutes les requêtes `attendance_records`.
**Impact :** StreakTile vide, score académie (composante présence) = 0, compteur live présences inopérant. Le schéma DB utilise `session_attendees` (présences par séance) et `attendances` — la table plate `attendance_records` n'a jamais été migrée.
**Correction :** Remplacer les appels `.from('attendance_records')` par la table réelle (`session_attendees` + jointure sur `sessions`, ou vue SQL dédiée).

---

### 🔴 CRITICAL — Table `xp_ledger` introuvable — migration 00129 non appliquée en remote

**Page :** `/dashboard`
**Message :**
```
[xp] getXPLeaderboard totals error: Could not find the table 'public.xp_ledger' in the schema cache
(hint: Perhaps you meant the table 'public.player_points_ledger')
[dashboard] getXPLeaderboard error: { code: PGRST205 }
```
**Fichiers sources :**
- `aureak/packages/api-client/src/gamification/xp.ts` — lignes 65, 143, 153, 164
- `aureak/packages/api-client/src/gamification/academy-score.ts` — ligne 61
- `aureak/packages/api-client/src/gamification/admin-profile.ts` — ligne 25

**Contexte :** Migration 00129 (`xp_ledger_and_progression.sql`) crée `xp_ledger`. Migration 00106 crée `player_points_ledger`. Supabase remote suggère que seule `player_points_ledger` existe — migration 00129 non appliquée en remote.
**Impact :** Leaderboard XP vide, score académie composante "progression" = 0, tuile Joueur de la semaine brisée. 3 tuiles Zone 3 dashboard inutilisables.
**Reproductible :** Oui — naviguer vers `/dashboard` → chargement automatique.
**Correction :** Vérifier `supabase migrations list` en remote. Si migration 00129 absente → `supabase db push`. Alternativement, renommer les appels `xp_ledger` → `player_points_ledger` dans api-client si 00129 a été abandonnée au profit de 00106.

---

### 🔴 CRITICAL — `profiles.id` inexistant — PK correcte : `user_id`

**Page :** `/dashboard`
**Message :**
```
[milestones] checkAcademyMilestones profile error: { code: 42703, message: column profiles.id does not exist }
[dashboard] checkAcademyMilestones error: { code: 42703 }
```
**Fichier source :** `aureak/packages/api-client/src/gamification/milestones.ts` ligne 52
**Code fautif :**
```typescript
await supabase
  .from('profiles')
  .select('tenant_id')
  .eq('id', user.id)   // ← FAUX : PK de profiles = user_id
  .single()
```
**Migration de référence :** `supabase/migrations/00003_create_profiles.sql` ligne 9 :
```sql
user_id UUID PRIMARY KEY REFERENCES auth.users(id)
```
**Impact :** `checkAcademyMilestones()` échoue à chaque montage du dashboard → la célébration de milestones (`MilestoneCelebration`) ne s'affiche jamais, même si des milestones sont atteints.
**Correction :** Remplacer `.eq('id', user.id)` par `.eq('user_id', user.id)` dans `milestones.ts:52`.

---

### 🟠 HIGH — `getNavBadgeCounts` : `session_attendees.status` inexistante

**Page :** Toutes pages admin (appelé depuis le layout global à chaque navigation)
**Message :**
```
[dashboard] getNavBadgeCounts unvalidated error: column session_attendees_1.status does not exist
```
**Fichier source :** `aureak/packages/api-client/src/admin/dashboard.ts` lignes 278–280
**Code fautif :**
```typescript
supabase
  .from('sessions')
  .select('id, session_attendees!inner(status)')
  .eq('status', 'réalisée')
  .is('session_attendees.status', null)
```
La table `session_attendees` ne possède pas de colonne `status` — la présence est dans la table `attendances` séparée.
**Impact :** Badge "présences non saisies" dans la sidebar toujours à 0 (faux négatif). L'erreur polue la console à chaque navigation dans l'app.
**Correction :** Restructurer la requête pour joindre `attendances` ou utiliser une autre logique de détection.

---

### 🟠 HIGH — `getAcademyScore` : double bug `profiles.role` + `id` inexistants

**Page :** `/dashboard` — tuile "Niveau Académie"
**Messages :**
```
HTTP 400 — profiles?select=id&role=eq.child
```
**Fichier source :** `aureak/packages/api-client/src/gamification/academy-score.ts` lignes 64–67
**Code fautif :**
```typescript
supabase
  .from('profiles')
  .select('id', { count: 'exact', head: true })
  .eq('role', 'child')
  // ↑ Deux erreurs : (1) colonne 'role' inexistante → c'est 'user_role'
  //                  (2) colonne 'id' inexistante → c'est 'user_id'
```
**Impact :** La composante "progressionScore" du score académie = 0 (division par totalActivePlayers=0). Le score académie affiché est systématiquement sous-évalué.
**Correction :** `.select('user_id', ...).eq('user_role', 'child')` dans `academy-score.ts:64-67`.

---

### 🟡 MEDIUM — `listNextSessionForDashboard` : erreur 400 silencieuse — CountdownTile inopérante

**Page :** `/dashboard` — tuile Countdown (story 50.3)
**Message :**
```
HTTP 400 — sessions?select=id,scheduled_at,...,session_attendees(status)&status=eq.planifiée
```
**Fichier source :** `aureak/packages/api-client/src/sessions/sessions.ts` lignes 1151, 1218
**Contexte :** La requête inclut `session_attendees(status)` dans le select, mais `session_attendees` n'a pas de colonne `status`. HTTP 400 → `data = null` → CountdownTile affiche "Aucune séance dans les 24h" même si des séances sont planifiées.
**Impact :** Fonctionnalité Countdown (story 50.3) inopérante. UX dégradée sans message d'erreur visible.
**Correction :** Supprimer `session_attendees(status)` du select dans `sessions.ts` aux deux emplacements.

---

### 🔵 LOW — Double guard `NODE_ENV` redondant (dead code)

**Page :** N/A — qualité du code
**Fichier source :** `aureak/packages/api-client/src/admin/dashboard.ts` lignes 37, 83, 138, 142
**Exemple :**
```typescript
if ((process.env.NODE_ENV as string) !== 'production')
  if ((process.env.NODE_ENV as string) !== 'production') console.error(...)
```
Le guard intérieur est redondant — probablement introduit lors de l'automatisation des guards.
**Impact :** Aucun impact fonctionnel, code confus.
**Correction :** Supprimer les guards internes en double.

---

## Pages sans erreur ✅

- `/children` — rendu correct (774 joueurs en grille cards), zéro erreur JS
- `/seances` — calendrier Avril 2026, zéro erreur JS au montage
- `/seances/new` — formulaire Step 1 opérationnel, zéro erreur au montage
- `/stages` — liste 14 stages avec filtres statuts, zéro erreur JS
- `/clubs` — liste 882 clubs avec logos RBFA, zéro erreur JS
- `/evenements` — page chargée correctement, filtres fonctionnels, modal "Nouvel évènement" OK
- `/developpement` — hub 3 sections (Prospection/Marketing/Partenariats), zéro erreur JS
- `/developpement/prospection` — page placeholder opérationnelle
- `/methodologie` — hub avec tuile "Thème de la semaine", chargement correct

---

## Observations complémentaires

**Dashboard (story 50-11) — rendu visuel :** Les 3 zones (Briefing du jour / KPIs académie / Performance & Gamification) se rendent correctement malgré les erreurs API. Dégradation gracieuse vers états vides et skeletons. Aucun blank screen, aucun crash React.

**StreakTile / LeaderboardTile :** Affichent "Aucune streak active" / "Aucun joueur classé" par dégradation correcte des erreurs — UX acceptable mais données inutilisables.

**WeatherWidget :** Fonctionne — API open-meteo accessible, météo Bruxelles affichée correctement.

**BriefingDuJour :** "Aucune implantation configurée" (base de test vide) — comportement attendu.

**Erreurs récurrentes toutes pages :** Les erreurs `getNavBadgeCounts` + `listNextSessionForDashboard` se répètent à chaque navigation (appelées depuis le layout admin global).

---

## Recommandations (ordre priorité)

1. **[CRITICAL]** `milestones.ts:52` — fix 1 ligne : `.eq('id', ...)` → `.eq('user_id', ...)` — correction < 1 min.
2. **[CRITICAL]** Migration 00129 — vérifier application remote : `supabase migrations list` → `supabase db push` si absente.
3. **[CRITICAL + HIGH]** `academy-score.ts:64-67` — fix `role` → `user_role`, `id` → `user_id`. Traiter les 4 appels `attendance_records` dans le même fichier.
4. **[HIGH]** `dashboard.ts getNavBadgeCounts` — revoir la détection de présences non saisies (sans `session_attendees.status`).
5. **[MEDIUM]** `sessions.ts` lignes 1151/1218 — supprimer `session_attendees(status)` du select.
6. **[CRITICAL]** `attendance_records` — décision architecture nécessaire : vue SQL ou refactor vers `session_attendees + attendances`.
7. **[LOW]** Nettoyer les double-guards `NODE_ENV` dans `dashboard.ts`.
