# Bug Crawler — 2026-04-05

## Résumé

- Pages crawlées : 9 (run initial) + 8 (run complémentaire 2026-04-05 après-midi)
- CRITICAL : 2
- HIGH : 4
- MEDIUM : 4
- LOW : 1

---

## Bugs détectés

### 🔴 CRITICAL — Colonne `unassigned_at` inexistante dans `coach_implantation_assignments`

**Page :** `/dashboard` (erreur silencieuse), reproduite aussi au chargement `/clubs`
**Message console exact :** `[dashboard] getImplantationStats error: {"code":"42703","hint":"Perhaps you meant to reference the column \"cia.assigned_at\".","message":"column cia.unassigned_at does not exist"}`
**HTTP :** `400 Bad Request`
**Fichier source :** `aureak/packages/api-client/src/admin/dashboard.ts` ligne 75 — `.is('unassigned_at', null)`
**Cause racine :** La table `coach_implantation_assignments` (créée dans migration `00090_rls_policies_complete.sql`) n'a pas de colonne `unassigned_at`. L'archive `aureak/supabase/_archive/migrations/00026_admin_supervision.sql` référençait cette colonne, mais elle n'a pas été portée dans le schéma actif.
**Reproductible :** Oui — tout rechargement du dashboard déclenche l'erreur
**Impact :** Le KPI IMPLANTATIONS affiche `—` en permanence. Le comptage de coachs actifs par implantation est impossible. Cette erreur est catchée silencieusement côté API (le guard `console.error` en dev est absent — bug QA additionnel).

---

### 🔴 CRITICAL — Vue SQL `v_club_gardien_stats` manquante en DB remote

**Page :** `/clubs`
**Message :** `[club-directory] v_club_gardien_stats fetch failed: Could not find the table 'public.v_club_gardien_stats' in the schema cache`
**Fichier source probable :** `aureak/packages/api-client/src/admin/club-directory.ts`
**Reproductible :** Oui — naviguer vers `/clubs` → la page se charge mais les stats gardiens sont toujours vides
**Impact :** Les statistiques de gardiens par club ne s'affichent jamais. Les 882 clubs affichent des barres vides au bas de chaque card. La vue est requêtée mais n'existe pas dans la base remote — probablement une migration non poussée.

---

### 🟠 HIGH — Erreur 400 + `[dashboard] getImplantationStats error` au chargement dashboard

**Page :** `/dashboard`
**Message :** `[dashboard] getImplantationStats error: [object Object]` + `Failed to load resource: 400`
**Fichier source probable :** `aureak/apps/web/app/(admin)/dashboard/index.tsx` — appel à `getImplantationStats`
**Action déclenchante :** Naviguer vers `/dashboard` (se produit immédiatement au mount)
**Impact :** Les tiles "TAUX DE PRÉSENCE" et "TAUX DE MAÎTRISE" affichent des barres vides sans valeurs. L'admin voit un dashboard partiellement fonctionnel sans comprendre pourquoi les stats sont absentes. L'erreur est loggée en console mais aucun message utilisateur n'est affiché.

---

### 🟠 HIGH — Erreur 400 + `[stages/index] load error` sur la page Stages

**Page :** `/stages`
**Message :** `[stages/index] load error: [object Object]` + `Failed to load resource: 400`
**Fichier source probable :** `aureak/apps/web/app/(admin)/stages/index.tsx` — appel `listStages`
**Action déclenchante :** Naviguer vers `/stages`
**Impact :** La page affiche une bannière rouge "Impossible de charger les stages." visible au premier plan. L'état vide sous la bannière dit "Aucun stage / Créez votre premier stage." — double message contradictoire (erreur ET état vide simultanément). L'erreur 400 suggère un problème RLS ou une table manquante.

---

### 🟠 HIGH — Erreurs React "Unexpected text node" dans la page Séances

**Page :** `/seances`
**Message :** `Unexpected text node: . A text node cannot be a child of a <View>.` (×2)
**Fichier source probable :** `aureak/apps/web/app/(admin)/seances/index.tsx` — composant calendrier (probable whitespace entre balises JSX `<View>`)
**Action déclenchante :** Naviguer vers `/seances` (se produit au mount)
**Impact :** Erreurs React en console à chaque chargement. Sur mobile (Expo), ce type d'erreur peut causer un crash de rendu. Sur web, l'affichage semble fonctionnel mais les erreurs polluent le monitoring et masquent d'autres issues.

---

### 🟠 HIGH — UUIDs bruts dans la liste présences (fallback groupMap manquant)

**Page :** `/presences`
**Observation :** Les séances affichent leur UUID technique brut (ex: `610ac8c9-47be-4340-b5b3-873683d9d031`) dans la colonne nom de séance
**Fichier source :** `aureak/apps/web/app/(admin)/presences/page.tsx` ligne 753
**Code exact :** `groupName={groupMap.get(s.groupId) ?? s.groupId}` — le fallback affiche l'UUID quand le groupe n'est pas résolu
**Cause :** `groupMap` est vide si aucune implantation n'est configurée (liste vide → aucun groupe chargé). Les séances existent mais leur `groupId` ne matche rien dans la map.
**Reproductible :** Oui — naviguer vers `/presences` avec des séances existantes mais 0 implantations actives
**Impact :** L'admin ne peut pas identifier les séances. Dashboard présences inexploitable dans cet état.

---

### 🟡 MEDIUM — Navigation directe vers routes admin échoue (redirect `/tableau-de-bord` → 404)

**Page :** Toute route admin (ex: `/children`, `/clubs`)
**Observation :** Une URL tapée directement dans la barre d'adresse ou un refresh page redirige vers `/tableau-de-bord` qui affiche "Unmatched Route — Page could not be found."
**Action déclenchante :** Coller `http://localhost:8082/children` dans l'adresse → redirect → 404
**Impact :** MEDIUM en dev, CRITICAL en production — les liens partagés, bookmarks et rafraîchissements de page ne fonctionnent pas. La route `/tableau-de-bord` n'existe pas dans le routeur Expo.

---

### 🟡 MEDIUM — Doublon de joueur dans la liste `/children` (AGRO Alessandro ×2)

**Page :** `/children`
**Observation :** Deux cartes identiques "AGRO Alessandro" sont affichées côte à côte dans la grille, sans indicateur de doublon
**Action déclenchante :** Chargement de la liste avec filtre "Tous"
**Impact :** L'admin peut croire qu'il s'agit de deux joueurs différents, ou cliquer deux fois sur la même fiche. Peut indiquer un problème de déduplication dans `child_directory` ou une jointure erronée dans `listChildDirectory`.

---

### 🟡 MEDIUM — Page Évaluations : état vide sans CTA ni empty state stylisé

**Page :** `/evaluations`
**Observation :** La page affiche uniquement "Aucune évaluation sur cette période." en texte plain sur fond beige — aucun bouton d'action, aucune illustration
**Action déclenchante :** Naviguer vers `/evaluations` sans séances évaluées
**Impact :** L'admin ne sait pas comment créer une évaluation depuis cette page. Friction UX importante pour les nouveaux utilisateurs.

---

### 🟡 MEDIUM — Label de filtre "En_cours" avec underscore visible dans `/stages`

**Page :** `/stages`
**Observation :** Le filtre de statut affiche `En_cours` au lieu de `En cours`
**Action déclenchante :** Chargement de la page stages
**Impact :** Faute de présentation — l'enum DB est exposé directement sans mapping vers label humain.

---

### 🔵 LOW — 404 sur favicon / ressource statique (toutes les pages)

**Page :** Toutes
**Message :** `Failed to load resource: the server responded with a status of 404 ()` — une ressource statique (probablement favicon.ico ou manifest.json) retourne 404 sur chaque navigation
**Fichier source probable :** Configuration Expo Router / fichiers publics manquants
**Impact :** Bruit en console à chaque navigation. Pas d'impact fonctionnel mais pollue le monitoring.

---

## Pages sans erreur ✅

- `/seances/new` — aucune erreur (hors 404 favicon)
- `/methodologie/seances` — aucune erreur (hors 404 favicon)
- `/groups` — aucune erreur (hors 404 favicon)
- `/presences` — aucune erreur (hors 404 favicon)
- `/children` — aucune erreur fonctionnelle (hors doublon et 404 favicon)
- `/children/[childId]` — une erreur 400 mineure (probable RLS sur sous-ressource)

---

## Recommandations

### P0 — Corrections bloquantes (CRITICAL)
1. **`dashboard.ts` ligne 75** — Supprimer `.is('unassigned_at', null)` ; compter les coachs sans ce filtre ou ajouter la colonne via migration
2. **Migration `00113`** — Relancer `supabase db push` pour appliquer `v_club_gardien_stats` en local et vérifier le Supabase remote

### P1 — Corrections urgentes (HIGH)
3. **`getImplantationStats`** — Ajouter try/finally + afficher `—` si l'appel échoue (ne pas planter silencieusement). Ajouter le console guard manquant.
4. **Bannière erreur stages** — Distinguer "erreur de chargement" vs "liste vide" — ne pas afficher les deux états simultanément
5. **Nœuds texte orphelins séances** — Supprimer les whitespace entre balises JSX `<View>` dans `seances/index.tsx`
6. **UUID bruts présences** — Remplacer le fallback `?? s.groupId` par `?? 'Séance sans groupe'` dans `presences/page.tsx` ligne 753

### P2 — Corrections importantes (MEDIUM)
7. **Navigation directe admin** — Corriger le guard d'auth dans `_layout.tsx` pour rediriger vers la route demandée (pas `/tableau-de-bord` inexistant)
8. **Doublon AGRO Alessandro** — Investiguer et dédupliquer dans `child_directory` ; contrainte UNIQUE sur `(tenant_id, notion_page_id)` ou `(display_name, birth_date, tenant_id)`

### P3 — Corrections à planifier (LOW)
9. **Favicon 404** — Ajouter `favicon.ico` dans `apps/web/public/` ou configurer le manifest Expo correctement
10. **`style.resizeMode` deprecated** — Migrer vers `props.resizeMode` dans les composants Image
