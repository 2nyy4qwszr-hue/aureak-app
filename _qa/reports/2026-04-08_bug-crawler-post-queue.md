# Bug Crawler — 2026-04-08 (post-queue — Playwright live)

> Méthode : crawl Playwright live — APP_URL=http://localhost:8082, APP_STATUS=200.
> Routes crawlées via SPA navigation + direct URL. SplashScreen (1.5s min) pris en compte.
> Précédent rapport du même nom (analyse statique) remplacé par cette version Playwright.

---

## Résumé

- Pages crawlées : 8 (dashboard, children, children/[id], seances/new, stages, clubs, clubs/[id], methodologie, activites, evenements)
- CRITICAL : 0 (B-BUG-C7 RÉSOLU story 77-5)
- HIGH : 2 (1 nouveau + 1 confirmé pre-existant)
- MEDIUM : 2 (1 nouveau + 1 confirmé pre-existant)
- LOW : 1 (pre-existant confirmé)
- Nouveaux bugs Playwright (non connus) : **2** (1 HIGH + 1 MEDIUM)

---

## Bugs détectés

### 🟠 HIGH — NOUVEAU — `club_directory_child_links` → 400 sur toutes les fiches club

**Page :** `/clubs/[clubId]`
**Message :** `Failed to load resource: 400 @ /rest/v1/club_directory_child_links?select=child_id,link_type,created_at,child_directory(display_name,statut,niveau_club)&club_id=eq.{id}&order=link_type.asc`
**Fichier source probable :** `aureak/packages/api-client/src/admin/club-directory.ts` — fonction `listChildrenOfClub`
**Reproductible :** Oui — naviguer vers `/clubs/[n'importe quel clubId]` → section "Joueurs actuellement" et "Joueurs affiliés" toujours vides
**Impact :** La section joueurs liés à un club est inaccessible sur toutes les fiches clubs. PostgREST ne reconnaît pas la relation `club_directory_child_links → child_directory` (FK constraint absente ou mal nommée). La requête `child_directory(...)` embedded échoue avec 400.
**Note :** `v_club_gardien_stats` répond 200 sur ce même club — seul le join sur `club_directory_child_links` échoue.
**ID registre :** B-CRAWLER-NEW-01

---

### 🟠 HIGH — CONFIRMÉ — `'performance'` absent du sélecteur GenerateModal

**Page :** `/(admin)/seances` → modale "Générer les séances"
**ID registre :** B-BUG-C9
**Fichier :** `aureak/apps/web/app/(admin)/seances/page.tsx:188`
**Détail :** Tableau inline `['goal_and_player','technique','situationnel','decisionnel','perfectionnement','integration','equipe']` omet `'performance'` — impossible de planifier des séances Performance en masse.
**Fix :** Ajouter `'performance'` ou remplacer par `SESSION_TYPES.filter(t => t !== 'equipe')`.
**Statut :** Toujours ouvert.

---

### 🟡 MEDIUM — NOUVEAU — Deep link `/children/[childId]` redirige vers `/children` (liste)

**Page :** `/(admin)/children/[childId]`
**Observation :** Navigation directe par URL (full page reload) vers `/children/{uuid}` → après SplashScreen → URL finale = `/children` (liste). La fiche détail joueur est inaccessible par lien direct.
**Action déclenchante :** `page.goto('http://localhost:8082/children/1bac8d39-6518-4867-ac79-b64eb8bf35df')` + attendre 3 secondes
**Cause probable :** Race condition entre SplashScreen dismiss (1.5s) et l'useEffect auth guard dans `_layout.tsx:460` (`if (isLoading || role !== 'admin') return null`). Au moment du dismiss, `isLoading` est encore `true` → le layout rend `null` puis le router snaps vers la route racine du groupe.
**Impact :** Liens partagés vers fiches joueurs ne fonctionnent pas. Navigation retour navigateur depuis fiche → liste ne recharge pas correctement.
**Même comportement confirmé pour :** `/activites`, `/seances/new` (redirigent vers autres routes après full reload).
**ID registre :** B-CRAWLER-NEW-02

---

### 🟡 MEDIUM — CONFIRMÉ — Console.error non guardés dans `dashboard.ts`

**Page :** API (`/dashboard` sidebar badges)
**ID registre :** B-BUG-C6
**Fichier :** `aureak/packages/api-client/src/admin/dashboard.ts:290,294,309`
**Statut :** Toujours ouvert.

---

### 🔵 LOW — CONFIRMÉ — `textDecoration` style invalide (Expo Router warning)

**Page :** Toutes les routes
**Message :** `Invalid style property of "textDecoration". Please use long-form properties.`
**Fichier :** Bundle expo-router (non modifiable directement)
**Impact :** Warning console cosmétique uniquement, pas de bug fonctionnel.

---

## Pages sans erreur ✅

- `/dashboard` — 0 erreur JS, toutes requêtes Supabase 200
- `/children` — rendu correct, 774 joueurs, search fonctionnel
- `/stages` — rendu correct après SplashScreen (3s), 14 stages listés
- `/evenements` — rendu correct, liste unifiée des 14 évènements
- `/clubs` — rendu correct, search/filtres fonctionnels
- `/methodologie` — rendu correct, hub + sections visibles
- `/activites` — rendu correct via SPA navigation (sidebar click), StatCards + TableauSeances chargés

---

## Statut bugs pré-existants

| ID | Statut | Note |
|----|--------|------|
| B-BUG-C7 | ✅ RÉSOLU | story 77-5 — vue `session_evaluations_merged` créée migration 00143 |
| B-BUG-C8 | ✅ RÉSOLU | story 78-1 — `evalMap.get(att.sessions?.id)` corrigé |
| B-BUG-C10 | ✅ RÉSOLU | story 72-14 — `performance` ajouté dans `TYPE_COLOR` |
| B-BUG-C11 | ✅ RÉSOLU | story 72-14 — `performance` ajouté dans `methodColor()` typeMap |
| B-BUG-C9 | 🔴 OUVERT | `'performance'` toujours absent du GenerateModal seances/page.tsx:188 |
| B-BUG-C6 | 🟡 OUVERT | console.error non guardés dashboard.ts:290,294,309 |
| W-CRAWLER-07 | 🟡 OUVERT | METHOD_COLOR hardcodé dans generateGroupName.ts |
| B-PATROL-01 | 🟡 OUVERT | vue `v_club_gardien_stats` — répond 200 en remote pour ce club (peut être résolu) |
| B-PATROL-02 | ✅ RÉSOLU apparemment | `/stages` charge correctement (14 stages) après SplashScreen |

---

## Recommandations prioritaires

1. **[HIGH — section joueurs cassée]** Corriger FK `club_directory_child_links.child_id → child_directory.id` dans une migration, ou réécrire la requête sans embedded join PostgREST (B-CRAWLER-NEW-01)
2. **[HIGH — 1 ligne]** Ajouter `'performance'` dans le tableau inline du GenerateModal `seances/page.tsx:188` (B-BUG-C9)
3. **[MEDIUM — UX deep links]** Investiguer race condition auth guard / SplashScreen dismiss dans `_layout.tsx` pour que les deep links fonctionnent (B-CRAWLER-NEW-02)
4. **[MEDIUM]** Wrapper console.error `dashboard.ts:290,294,309` avec NODE_ENV guard (B-BUG-C6)
