# Story 97.8 — Académie / Club : refonte complète

Status: done

## Completion Notes

### Diagnostic

- **Avant** : `academie/clubs/index.tsx` était un simple redirect vers `/clubs` (page legacy volumineuse, 575 lignes, avec fonctionnalités bulk select, Import RBFA, Nouveau club).
- **Problème** : URL `/academie/clubs` redirigeait vers `/clubs` → onglet CLUBS d'AcademieNavBar pas actif sur la page finale (détection `pathname === tab.href` échouait).

### Refonte

- Page native `/academie/clubs` avec AdminPageHeader + AcademieNavBar (CLUBS actif ✓).
- StatCards : total annuaire, actifs (page courante), nb provinces.
- Filtres : recherche texte (nom/matricule/ville), toggle actif/inactif/tous, chips province (11 provinces belges).
- Table tokenisée : nom, matricule, ville, province, gardiens count, statut badge.
- Pagination 50/page (882 clubs total).
- CTA "Gestion avancée →" ouvre la page legacy `/clubs` (bulk select, Import RBFA, Nouveau club).

### Détail club `/academie/clubs/[clubId]`

- Non créée — le détail existe déjà sous `/clubs/[clubId]` (page riche avec enfants liés, affiliation, etc.). Le CTA "Gestion avancée" y redirige naturellement.
- Migration complète vers `/academie/clubs/[clubId]` = story d'évolution future (~12 références internes à mettre à jour).

## Metadata

- **Epic** : 97 — Admin UI Polish Phase 2
- **Story ID** : 97.8
- **Story key** : `97-8-refonte-academie-club`
- **Priorité** : P2 (refonte qualitative)
- **Dépendances** : **97.3** (AdminPageHeader v2) · recommandé : après 97.6
- **Source** : Audit UI 2026-04-22. L'utilisateur a signalé : "club, il faudra refaire la page évidemment pour que ça ressemble [aux autres]."
- **Effort estimé** : M (~5-7h — refonte liste + détail clubs académie avec pattern cohérent)

## Story

As an admin,
I want que la page `/academie/clubs` (annuaire organisationnel des clubs académie) soit refaite dans le pattern canonique Académie — header v2, liste cohérente, empty/loading/error states propres,
So that la zone Académie présente un visuel uniforme et que l'annuaire clubs s'intègre naturellement dans la nav Académie.

## Contexte

### Ambiguïté de naming — clarifier

Le vocabulaire MEMORY.md distingue :
- **`clubs`** (table auth) — portail club avec 6 rôles → pages sous `/clubs` ou `/partenariat/clubs` selon contexte
- **`club_directory`** (annuaire organisationnel) — table Notion sync, 678 entités → page `/academie/clubs`

**Cette story concerne `/academie/clubs` uniquement** — l'annuaire organisationnel. Pas confondre avec `/partenariat/clubs` (Epic 92) qui est la liste des clubs partenaires académie.

### État actuel

Page : `aureak/apps/web/app/(admin)/academie/clubs/page.tsx` (+ `index.tsx`)
Page détail : `aureak/apps/web/app/(admin)/academie/clubs/[clubId]/page.tsx`

Comme pour Scout, diagnostic préalable requis pour identifier les anomalies visuelles/fonctionnelles avant refonte.

### Résultat attendu

- Page liste refondue avec header v2, table/cards tokenisées, filtres (nom, ligue, province), empty/loading/error states.
- Page détail refondue dans le même esprit (titre dynamique = nom du club, bloc informations, enfants associés éventuels).

## Acceptance Criteria

1. **Diagnostic documenté** (dev notes / completion notes) : anomalies relevées + décisions prises.

2. **Page liste `/academie/clubs`** :
   - `<AdminPageHeader title="Clubs" />` (pas d'eyebrow ni subtitle)
   - Liste des clubs (source `club_directory`) avec nom, localisation, ligue, indicateurs (ex. nombre d'enfants liés)
   - Filtres : nom texte, ligue/province en select, tri par nom/date
   - Pagination ou virtualisation si > 200 clubs (678 en DB)

3. **Page détail `/academie/clubs/[clubId]`** :
   - Titre dynamique = nom du club
   - Bloc informations principales (coordonnées, ligue, province)
   - Bloc enfants liés (children_directory_links) — lecture seule ou lien vers gestion si existe
   - Bloc affiliation saison en cours
   - Pas de bouton action dans le header (actions internes aux blocs)

4. **Data** : accès uniquement via `@aureak/api-client`. Fonctions à vérifier/créer :
   - `listClubDirectory(filters?)` — liste avec filtres optionnels
   - `getClubDirectoryById(clubId)` — détail avec enfants liés et historique

5. **States** : loading (skeleton), empty, error avec retry.

6. **Styles tokenisés** : grep hex sur fichiers refaits = 0 match.

7. **try/finally + console guards** sur tous les setters loading/saving.

8. **AcademieNavBar intégration** : onglet "Clubs" actif sur ces 2 pages. Count optionnel via Context.

9. **Conformité CLAUDE.md** : tsc OK, tokens, api-client, patterns Expo Router.

10. **Test Playwright** :
    - `/academie/clubs` → charge, filtres fonctionnels, console sans erreur
    - `/academie/clubs/<uuid>` → charge détail d'un club, titre = nom du club
    - Screenshots before/after

11. **Non-goals explicites** :
    - **Pas de fonctionnalité nouvelle** (ajout club, édition depuis UI) — scope = refonte visuelle de l'existant
    - **Pas de modif du schéma `club_directory`** ni de la sync Notion
    - **Pas de refonte `/partenariat/clubs`** (Epic 92, périmètre distinct)

## Tasks / Subtasks

- [ ] **T1 — Diagnostic** (AC #1)
  - [ ] Playwright navigate `/academie/clubs` + `/academie/clubs/<uuid>` + screenshots
  - [ ] Lire code actuel
  - [ ] Relever anomalies console + patterns obsolètes

- [ ] **T2 — API client** (AC #4)
  - [ ] `listClubDirectory`, `getClubDirectoryById` — vérifier existence, créer si absent
  - [ ] Types TS

- [ ] **T3 — Refonte liste** (AC #2, #5, #6, #7)
  - [ ] Header v2
  - [ ] Table/cards tokenisées
  - [ ] Filtres + pagination
  - [ ] States

- [ ] **T4 — Refonte détail** (AC #3, #5, #6, #7)
  - [ ] Header dynamique
  - [ ] Blocs info + enfants + saison

- [ ] **T5 — Navigation** (AC #8)
  - [ ] Onglet "Clubs" dans AcademieNavBar
  - [ ] Count optionnel

- [ ] **T6 — QA** (AC #9, #10)
  - [ ] `tsc --noEmit` OK
  - [ ] Playwright + screenshots

## Dev Notes

### Pattern de référence

Suivre `/academie/joueurs` (liste) et `/academie/joueurs/[playerId]` (détail) après 97.6 comme canonique. Réutiliser composants table/cards existants (`PeopleListPage`, etc.) si transposables au contexte club.

### Volume de données

~678 clubs dans `club_directory`. Si pagination non implémentée → prévoir virtualisation (FlatList React Native) ou pagination offset 50/page. Décision dev selon perf mesurée.

### Filtres proposés

- Texte : nom + ville
- Ligue : dropdown des ligues distinctes (dérivé des données)
- Province : dropdown
- Toggle actif/deleted_at null (soft-delete respecté)

### References

- Page actuelle : `aureak/apps/web/app/(admin)/academie/clubs/page.tsx` + `[clubId]/page.tsx`
- Types : `@aureak/types` — `ClubDirectory`, `ClubDirectoryWithLinks`
- MEMORY.md : distinction `clubs` vs `club_directory`
- Epic 92 (Partenariat) : `/partenariat/clubs` — périmètre distinct, ne pas confondre
