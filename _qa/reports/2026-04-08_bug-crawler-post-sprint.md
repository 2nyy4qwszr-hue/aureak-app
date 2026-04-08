# Bug Crawler — 2026-04-08 (post-sprint)

## Résumé

- **Pages crawlées** : 10 (dashboard, /children, /children/[id], /activites séances, /activites présences, /activites évaluations, /seances/new, /stages, /stages/[id], /methodologie/seances)
- **Interactions testées** : recherche joueurs, onglets Activités, clic sidebar, bouton + Nouvelle séance
- **CRITICAL** : 0
- **HIGH** : 1 (nouveau)
- **MEDIUM** : 1 (connu)
- **LOW** : 1 (connu)

---

## Bugs détectés

### 🟠 HIGH — Requête API 400 : `column sessions_1.name does not exist` sur fiche joueur

**Page :** `/children/[childId]` — onglet Profil (section Profil Technique / GrowthChart)
**Message :** `{"code":"42703","details":null,"hint":null,"message":"column sessions_1.name does not exist"}`
**URL PostgREST :** `GET /rest/v1/evaluations?select=updated_at,receptivite,gout_effort,attitude,sessions!evaluations_session_id_fkey(name)&child_id=eq.{id}&order=updated_at.desc&limit=10` → **400**
**Fichier source :** `aureak/packages/api-client/src/evaluations/evaluations.ts:131`
**Reproductible :** Naviguer vers `/children/b213a367-7f4f-46e1-ba7f-9d73848fe32f` → erreur console `Failed to load resource: 400`
**Impact :** Le GrowthChart (Story 55-3) ne reçoit aucune donnée — affiche une courbe vide ou un état dégradé silencieux. L'erreur est swallowée (`if (error) return { data: [], error }`) donc invisible pour l'utilisateur mais les données d'évaluation ne sont jamais affichées dans le graphe de progression.
**Cause :** La table `sessions` n'a pas de colonne `name`. Le select `sessions!evaluations_session_id_fkey(name)` est invalide. La colonne correcte serait à retirer ou remplacer (ex: `scheduled_at` pour un label de date).

---

### 🟡 MEDIUM — Navigation directe par URL → redirections incorrectes (connu W-CRAWLER-01)

**Statut :** Déjà connu sous W-CRAWLER-01 (historique : redirigait vers `/tableau-de-bord`, maintenant vers des routes différentes).
**Comportement observé ce crawl :**
- `http://localhost:8082/dashboard` → `/methodologie` → `/joueurs` → **404 Unmatched Route**
- `http://localhost:8082/children` → `/activites`
- `http://localhost:8082/seances` → `/dashboard`
- `http://localhost:8082/seances/new` → `/methodologie`
- `http://localhost:8082/stages` → `/clubs`

**Note :** La navigation SPA (clic sidebar) fonctionne correctement sur toutes les pages. Ce bug n'affecte que les hard navigations (saisie URL directe, F5, lien externe). Expo Router SPA sans configuration de rewrites serveur. Les routes `/stages/[id]`, `/children/[id]`, `/methodologie/seances` sont accessibles directement.

---

### 🔵 LOW — Doublon AGRO Alessandro dans la liste joueurs (connu W-PATROL-04)

**Statut :** Déjà connu sous W-PATROL-04.
**Détail :** Confirmé en DB remote — 2 entrées distinctes avec UUIDs différents :
- `b955cf40-5382-4997-a782-93110a51e78f`
- `3152e087-0a84-4a6f-b2e9-4d6449677114`
**Impact :** Doublon visible dans la liste joueurs — confusion potentielle pour l'admin.

---

## Pages sans erreur ✅

- `/dashboard` (via SPA) — aucune erreur JS, toutes requêtes 200
- `/activites/seances` — aucune erreur, tableau empty state correct
- `/activites/presences` — aucune erreur, KPIs affichés, empty state correct
- `/activites/evaluations` — aucune erreur, empty state correct
- `/seances/new` (via clic bouton) — formulaire monté, aucune erreur
- `/stages` (via clic sidebar) — 14 stages chargés, aucune erreur
- `/stages/[id]` — fiche stage chargée, toutes requêtes 200
- `/clubs` — 882 clubs chargés, aucune erreur
- `/methodologie/seances` — liste séances pédagogiques chargée, toutes requêtes 200
- `/children` — 774 joueurs, recherche fonctionnelle, empty state OK

---

## Recommandations

1. **[HIGH — NOUVEAU]** `evaluations/evaluations.ts:131` — Retirer `sessions!evaluations_session_id_fkey(name)` du select. La table `sessions` n'a pas de colonne `name`. Remplacer par `scheduled_at` si un label de date est nécessaire, ou supprimer la jointure si elle n'est pas utilisée dans `EvaluationPoint`.

2. **[MEDIUM — CONNU]** W-CRAWLER-01 — Ajouter un fichier de rewrites pour Expo Router web (ex: `_redirects` pour Netlify ou `vercel.json`). En dev local, le comportement SPA est normal mais doit être documenté comme limitation connue.

3. **[LOW — CONNU]** W-PATROL-04 — Dédupliquer AGRO Alessandro dans `child_directory` (garder l'entrée la plus complète, soft-delete l'autre via `deleted_at`).
