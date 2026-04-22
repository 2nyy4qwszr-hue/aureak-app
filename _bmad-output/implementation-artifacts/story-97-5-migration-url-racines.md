# Story 97.5 — Supprimer routes racines `/seances`, `/players`, `/coaches`, `/groups`, `/stages` → sous-hiérarchies

Status: done

## Metadata

- **Epic** : 97 — Admin UI Polish Phase 2
- **Story ID** : 97.5
- **Story key** : `97-5-migration-url-racines`
- **Priorité** : P1 (prérequis de 97.6, 97.10)
- **Dépendances** : aucune ; **bloque 97.6 (academie), 97.10 (evenements/stages)**
- **Source** : Audit UI 2026-04-22. L'utilisateur a demandé : "supprime la page séances à la racine", "supprime la page players coaches groups stages". Raison produit : URLs qui reflètent la sidebar (`/activites/seances`, `/academie/joueurs`, etc.).
- **Effort estimé** : L (~6-9h — 5 migrations de route + ~40-60 imports à corriger + redirects + grep liens internes)

## Story

As an admin,
I want que les pages actuellement à la racine (`/seances`, `/players`, `/coaches`, `/groups`, `/stages`) vivent sous leur zone sidebar correspondante (`/activites/seances`, `/academie/joueurs`, `/academie/coaches`, `/academie/groupes`, `/evenements/stages`),
So that l'URL affichée dans la barre d'adresse reflète toujours la zone sidebar active et que la navigation soit cohérente avec la mental-map du produit.

## Contexte

### Migrations visées

| URL actuelle | Nouvelle URL | Dossier source | Dossier cible |
|---|---|---|---|
| `/seances` | `/activites/seances` | `app/(admin)/seances/` | `app/(admin)/activites/seances/` |
| `/seances/planner` | `/activites/seances/planner` | idem `/planner` | idem |
| `/seances/[sessionId]` | `/activites/seances/[sessionId]` | idem `/[sessionId]` | idem |
| `/players` | `/academie/joueurs` | `app/(admin)/players/` | `app/(admin)/academie/joueurs/` |
| `/players/[playerId]` | `/academie/joueurs/[playerId]` | idem | idem |
| `/coaches` | `/academie/coaches` | `app/(admin)/coaches/` | `app/(admin)/academie/coaches/` |
| `/coaches/[coachId]` | `/academie/coaches/[coachId]` | idem | idem |
| `/groups/[groupId]` | `/academie/groupes/[groupId]` | `app/(admin)/groups/` | `app/(admin)/academie/groupes/` |
| `/stages` | `/evenements/stages` | `app/(admin)/stages/` | `app/(admin)/evenements/stages/` |
| `/stages/[stageId]` | `/evenements/stages/[stageId]` | idem | idem |

### Renommage FR : `players` → `joueurs`, `groups` → `groupes`

Cohérence linguistique : tout le reste de l'admin est en français (sidebar, titres, labels). Les URLs FR sont plus lisibles pour l'utilisateur final admin francophone.

Exception : `coaches` reste `coaches` (même en anglais, usage courant en français foot). Acceptable.

### Composants déjà déplacés (95.1)

Les composants du domaine (ex. `components/admin/children/`, `components/admin/seances/`, `components/admin/groups/`) sont déjà hors `app/` depuis Epic 95.1. Les imports relatifs vont changer de profondeur.

### Grep liens internes

Avant migration, faire un recensement :
```bash
rg '"/seances|"/players|"/coaches|"/groups|"/stages' aureak/apps/web/
rg "push\('/seances|push\('/players|push\('/coaches|push\('/groups|push\('/stages" aureak/apps/web/
rg "href=\"/seances|href=\"/players|href=\"/coaches|href=\"/groups|href=\"/stages" aureak/apps/web/
```

## Acceptance Criteria

1. **5 migrations `git mv`** exécutées selon le tableau ci-dessus.
   - Renommer en FR : `players` → `joueurs`, `groups` → `groupes`.
   - Préserver structure (sous-dossiers `[id]/`, `planner/`, `new/`, `_layout.tsx`, etc.).

2. **Ancienne arborescence supprimée** : les 5 dossiers racine (`seances`, `players`, `coaches`, `groups`, `stages`) sont supprimés.

3. **Redirects 301** pour les URLs connues :
   ```
   /seances              → /activites/seances
   /seances/planner      → /activites/seances/planner
   /seances/[sessionId]  → /activites/seances/[sessionId]
   /players              → /academie/joueurs
   /players/[playerId]   → /academie/joueurs/[playerId]
   /coaches              → /academie/coaches
   /coaches/[coachId]    → /academie/coaches/[coachId]
   /groups/[groupId]     → /academie/groupes/[groupId]
   /stages               → /evenements/stages
   /stages/[stageId]     → /evenements/stages/[stageId]
   ```
   Implémentation : créer des pages `<Redirect>` stub dans les anciens emplacements, ou utiliser un middleware global si disponible.
   Durée : 1 mois minimum.

4. **Mise à jour liens internes** — grep **0 match** sur :
   - `"/seances"`, `"/players"`, `"/coaches"`, `"/groups"` (hors stages qui est ambigu), `"/stages"`
   - `router.push('/seances...')` etc.
   - `<Link href="/seances...">` etc.
   - Configs breadcrumbs, topbar, nav-config si refs existent

5. **Imports relatifs corrigés** après déplacement. La profondeur change :
   - Ex. `app/(admin)/seances/[sessionId]/page.tsx` était à 4 niveaux ; devient `app/(admin)/activites/seances/[sessionId]/page.tsx` à 5 niveaux. Tous les `../../../` doivent devenir `../../../../`.
   - Utiliser alias `@/` si configuré (cf. ADR 005).
   - `cd aureak && npx tsc --noEmit` EXIT 0.

6. **Layouts parents hérités** :
   - Les routes migrées héritent désormais des `_layout.tsx` d'`activites/`, `academie/`, `evenements/`. Vérifier que les layouts cibles n'imposent pas de logique (ex. fetch de counts, Context providers) qui casserait les pages filles.
   - Si un layout racine était présent pour une page migrée (ex. `seances/_layout.tsx`) → le fusionner ou déplacer sous le dossier cible selon logique.

7. **Test Playwright** — nouvelles URLs fonctionnelles :
   - `/activites/seances` → charge liste séances (contenu inchangé vs ancien `/seances`)
   - `/activites/seances/[sessionId]` → charge détail d'une séance
   - `/academie/joueurs` → charge liste joueurs
   - `/academie/joueurs/[playerId]` → charge détail joueur
   - `/academie/coaches` → charge liste coaches
   - `/academie/groupes/[groupId]` → charge détail groupe
   - `/evenements/stages` → charge liste stages
   - `/evenements/stages/[stageId]` → charge détail stage

8. **Test Playwright** — anciennes URLs redirigent :
   - `/seances` → redirigé vers `/activites/seances`
   - idem pour les 9 autres URLs du tableau

9. **Conformité CLAUDE.md** :
   - `npx tsc --noEmit` EXIT 0
   - Pattern `page.tsx` + `index.tsx` re-export préservé
   - Non-routes hors `app/` (règle 6) respectée

10. **Non-goals explicites** :
    - **Pas de modification UI** des pages (pas de template — c'est 97.6/97.10)
    - **Pas de changement fonctionnel**
    - **Pas de renommage `[sessionId]` / `[playerId]` / `[coachId]` / `[groupId]` / `[stageId]`** — conserver les noms paramètres pour éviter propagation de renommage dans les api-client et types
    - **Pas d'inclusion de `/children`** — `children/[childId]` / `children/new` sont liés à la zone "enfant du parent" (différent de "joueur admin"). Hors scope 97.5

## Tasks / Subtasks

- [ ] **T1 — Inventaire liens internes** (AC #4)
  - [ ] `rg` sur les 5 patterns URL dans tout `aureak/apps/web/`
  - [ ] Documenter la liste des fichiers à mettre à jour (liste brute en dev notes)

- [ ] **T2 — Migration `/seances`** (AC #1, #5, #6)
  - [ ] `git mv app/(admin)/seances app/(admin)/activites/seances`
  - [ ] Vérifier layout parent `activites/_layout.tsx` compatible
  - [ ] Corriger imports relatifs (profondeur +1)
  - [ ] `tsc --noEmit` OK

- [ ] **T3 — Migration `/players`** (AC #1, #5)
  - [ ] `git mv app/(admin)/players app/(admin)/academie/joueurs`
  - [ ] Corriger imports

- [ ] **T4 — Migration `/coaches`** (AC #1, #5)
  - [ ] `git mv app/(admin)/coaches app/(admin)/academie/coaches`

- [ ] **T5 — Migration `/groups`** (AC #1, #5)
  - [ ] `git mv app/(admin)/groups app/(admin)/academie/groupes`

- [ ] **T6 — Migration `/stages`** (AC #1, #5)
  - [ ] `git mv app/(admin)/stages app/(admin)/evenements/stages`
  - [ ] Vérifier layout parent `evenements/_layout.tsx` (s'il existe)

- [ ] **T7 — Mise à jour liens internes** (AC #4)
  - [ ] Remplacer tous les hrefs/router.push/breadcrumbs identifiés en T1
  - [ ] Grep final : 0 match sur les patterns URL anciens

- [ ] **T8 — Redirects** (AC #3)
  - [ ] Créer 5-10 pages stub `<Redirect>` aux anciens chemins racine

- [ ] **T9 — QA final** (AC #7, #8, #9)
  - [ ] Playwright sur toutes les nouvelles URLs
  - [ ] Playwright sur anciennes URLs → redirect
  - [ ] `npx tsc --noEmit` EXIT 0
  - [ ] Console zéro erreur

## Dev Notes

### Commits recommandés

Vu l'ampleur, 2-3 commits :
1. `refactor(epic-97): migrer /seances, /players, /coaches, /groups, /stages → sous-hiérarchies` (git mv + imports)
2. `refactor(epic-97): mettre à jour liens internes post-migration URL`
3. `feat(epic-97): ajouter redirects 301 anciennes URLs racine`

### Décision FR : `players` → `joueurs`, `groups` → `groupes`

Cohérent avec :
- Sidebar (Académie, pas "Academy")
- Titres (Joueurs, pas Players)
- Vocabulaire officiel MEMORY.md : "Admin UI → 'Joueurs' (jamais 'Enfants')"

Garder `coaches` en anglais car le terme est naturalisé en français football belge.

### Cas des layouts

Les routes migrées héritent des `_layout.tsx` parents :
- `/activites/seances` hérite de `activites/_layout.tsx` (qui fetch `getActivitesCounts` en Context)
- `/academie/joueurs` hérite de `academie/_layout.tsx` (à vérifier s'il existe)
- `/evenements/stages` hérite de `evenements/_layout.tsx` (à vérifier)

Si un layout `seances/_layout.tsx` existait à la racine, le conserver **à l'intérieur** du dossier migré pour préserver comportement. L'héritage est additif (cumul des layouts).

### Vocabulaire URL parameter

`[sessionId]`, `[playerId]`, etc. restent inchangés car :
- Utilisés dans les api-client (`useLocalSearchParams<{ playerId: string }>`)
- Changement = propagation vers @aureak/api-client + @aureak/types si typé
- Trop de risque pour un gain cosmétique

### Impact sur l'alias `@/`

Cf. ADR 005 — alias pas toujours configuré. Utiliser chemins relatifs pour cohérence avec le reste du code actuel, sauf si `@/` est déjà disponible (à vérifier dans `tsconfig.json`).

### References

- Dossiers source : `app/(admin)/{seances,players,coaches,groups,stages}/`
- Dossiers cible : `app/(admin)/{activites/seances,academie/joueurs,academie/coaches,academie/groupes,evenements/stages}/`
- Composants associés (hors `app/`, inchangés) : `components/admin/{children,seances,groups,clubs}/`
- Stories dépendantes : 97.6 (template Académie), 97.10 (événements + stages)
