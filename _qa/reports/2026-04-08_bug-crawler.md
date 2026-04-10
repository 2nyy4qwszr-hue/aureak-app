# Bug Crawler — 2026-04-08

## Résumé
- Pages crawlées : 7 principales + 5 sous-pages/détails
- CRITICAL : 0
- HIGH : 2
- MEDIUM : 1
- LOW : 2

Crawl effectué en admin (`admin@test.com`) via Chrome DevTools MCP.
App tournait sur http://localhost:8081 — HTTP 200 confirmé.

---

## Bugs détectés

### 🟠 HIGH — `listAttendancesByChild` — colonne inexistante `session_date` → 400

**Page :** `/children/[childId]`
**Message console :**
```
Failed to load resource: the server responded with a status of 400 ()
[listAttendancesByChild] error: [object Object]
[ChildDetailPage] listAttendancesByChild error: [object Object]
```
**Fichier source :** `aureak/packages/api-client/src/sessions/attendances.ts` ligne 804–818
**Cause :** La requête PostgREST sélectionne `session_date` depuis `sessions` via join `!inner`. Mais la colonne réelle dans `sessions` est `scheduled_at` (pas `session_date`). De plus, `.order('sessions.session_date', ...)` utilise une syntaxe non supportée par PostgREST pour le tri sur une table jointe — deux erreurs cumulées.
**Impact :** L'heatmap de présences sur la fiche joueur ne se charge jamais. La section "PRÉSENCES (12 MOIS GLISSANTS)" reste vide pour tous les joueurs.
**Reproductible :** Oui — cliquer sur n'importe quel joueur dans `/children`
**Fix attendu :**
1. Remplacer `session_date` par `scheduled_at` dans le select, les filtres `.gte`/`.lte`, la mapping et le type retourné.
2. Supprimer `.order('sessions.session_date', ...)` (non supporté en PostgREST via join) — trier côté JS après réception.

---

### 🟠 HIGH — `checkAcademyMilestones` — profil absent → 406 à chaque chargement du dashboard

**Page :** `/dashboard`
**Message console :**
```
Failed to load resource: the server responded with a status of 406 ()
[milestones] checkAcademyMilestones profile error: [object Object]
[dashboard] checkAcademyMilestones error: [object Object]
```
**Fichier source :** `aureak/packages/api-client/src/gamification/milestones.ts` ligne 50–58
**Cause :** La requête `profiles.select('tenant_id').eq('user_id', user.id).single()` retourne 406 (PGRST116 — 0 lignes). Le compte `admin@test.com` existe dans `auth.users` mais n'a soit pas de profil dans la table `profiles`, soit le RLS `tenant_isolation` bloque (si `current_tenant_id()` renvoie null pour ce compte).
**Impact :** `checkAcademyMilestones` échoue systématiquement → la `MilestoneCelebration` sur le dashboard n'est jamais alimentée. L'erreur est loggée à chaque chargement du dashboard.
**Reproductible :** Oui — charger `/dashboard`
**Note :** B-CRAWLER-04 (xp_ledger introuvable) reste probablement actif également — non vérifié directement car les erreurs de milestones masquent la suite.

---

### 🟡 MEDIUM — Doublon joueur AGRO Alessandro dans la liste `/children`

**Page :** `/children`
**Observation :** Deux entrées "AGRO Alessandro" apparaissent dans la liste paginée (uid 40_114 et 40_115). L'une est probablement un doublon de création dans `child_directory`.
**Reproductible :** Oui — visible sur la première page de `/children` sans filtre
**Note :** Déjà répertorié en W-PATROL-04. Persiste.

---

### 🔵 LOW — Label filtre `En_cours` non mappé dans `/stages`

**Page :** `/stages`
**Observation :** Le bouton filtre affiche "En_cours" (avec underscore) au lieu de "En cours". La logique `st.charAt(0).toUpperCase() + st.slice(1)` capitalise mais ne remplace pas l'underscore.
**Fichier source :** `aureak/apps/web/app/(admin)/stages/index.tsx` ligne 123
**Fix :** Remplacer la logique par `st === 'all' ? 'Tous' : st === 'en_cours' ? 'En cours' : st.charAt(0).toUpperCase() + st.slice(1)`
**Note :** Déjà répertorié en W-PATROL-02. Persiste.

---

### 🔵 LOW — Warning déprécié React Native : `props.pointerEvents` et `Image.style.resizeMode`

**Pages :** `/login` (pointerEvents), `/profiles` (resizeMode)
**Message console :**
```
[warn] props.pointerEvents is deprecated. Use style.pointerEvents
[warn] Image: style.resizeMode is deprecated. Please use props.resizeMode.
```
**Fichier source :** Inconnu — probablement dans `@aureak/ui` ou Expo Router components
**Impact :** Warnings de dépréciation sans impact fonctionnel immédiat, mais à corriger avant montée de version Expo.

---

## Bugs connus confirmés persistants

| ID | Status | Vérifié |
|----|--------|---------|
| B-PATROL-01 (`v_club_gardien_stats`) | **Non visible** — aucune erreur console sur `/clubs` ni détail club | Indéterminé |
| B-PATROL-02 (400 stages load) | **Non reproduit** — stages se chargent correctement (14 stages visibles) | Résolu? |
| B-PATROL-03 ("Unexpected text node" séances) | **Non reproduit** — zéro erreur console sur `/seances` | Résolu? |
| B-CRAWLER-04 (xp_ledger) | **Non vérifié** — masqué par l'erreur milestones en cascade | Probablement persistant |
| W-PATROL-02 (En_cours label) | **Confirmé persistant** | Oui |
| W-PATROL-04 (doublon AGRO) | **Confirmé persistant** | Oui |

---

## Pages sans erreur ✅

- `/children` (liste) — 774 joueurs, zéro erreur console
- `/seances` — calendrier avril 2026, zéro erreur
- `/methodologie/seances` — 7 entraînements, zéro erreur
- `/activites` (hub) — zéro erreur
- `/activites/presences` — zéro erreur
- `/activites/evaluations` — zéro erreur
- `/stages` (liste) — 14 stages, zéro erreur
- `/stages/[stageId]` — détail stage, zéro erreur
- `/clubs` (liste) — 882 clubs, zéro erreur
- `/evaluations` — zéro erreur

---

## Screenshots

- `_qa/screenshots/crawler-01-dashboard.png` — dashboard (erreurs milestones)
- `_qa/screenshots/crawler-02-children.png` — joueurs
- `_qa/screenshots/crawler-03-seances.png` — séances
- `_qa/screenshots/crawler-04-methodologie-seances.png` — entraînements
- `_qa/screenshots/crawler-05-activites.png` — activités hub
- `_qa/screenshots/crawler-06-stages.png` — stages
- `_qa/screenshots/crawler-07-clubs.png` — clubs
- `_qa/screenshots/crawler-dashboard-2026-04-08.png` — dashboard (après login)
