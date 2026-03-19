# Story 24.7 : Organisation Pédagogique — Builder hiérarchique de thème

Status: done

## Story

En tant qu'admin,
je veux organiser tous les éléments pédagogiques d'un thème dans un builder hiérarchique,
afin de visualiser et gérer en un seul endroit la structure complète séquences → métaphores / critères / mini-exercices → erreurs.

## Acceptance Criteria

1. Un nouvel onglet **"Organisation"** est ajouté dans la sidebar de `ThemeDossierPage` avec l'icône 🗂 et le label "Organisation".
2. L'onglet charge et affiche la hiérarchie complète du thème en une seule vue.
3. La hiérarchie suit ces règles d'affichage :
   - Les **séquences** sont les conteneurs racine, affichées dans l'ordre `sort_order`
   - Sous chaque séquence : les **métaphores** liées (via `metaphors.sequence_id`), les **critères** liés (via `criteria.sequence_id`), les **mini-exercices** liés (via `mini_exercises.sequence_id`), chacun dans un groupe visuellement distinct
   - Sous chaque **critère** : les **erreurs** liées (via `faults.criterion_id`)
   - En bas de la vue : un bloc **"Éléments libres"** listant les métaphores, critères, mini-exercices et erreurs sans liaison (tous les `*_id IS NULL`)
4. L'admin peut **déplacer** un élément en changeant sa liaison :
   - Métaphore → changer `sequenceId` via un sélecteur inline
   - Critère → changer `sequenceId` ou `metaphorId` via sélecteurs inline
   - Erreur → changer `criterionId` via un sélecteur inline
   - Mini-exercice → changer `sequenceId` via un sélecteur inline
5. Chaque déplacement est sauvegardé immédiatement (pas de bouton "Save global").
6. Les éléments libres peuvent être liés depuis le bloc "Éléments libres" via les mêmes sélecteurs.
7. Le builder est **en lecture seule pour la création** — la création se fait dans les sections dédiées (24.2 à 24.6). Le builder ne sert qu'à l'organisation.
8. Une indication visuelle (badge count) sur l'onglet "Organisation" indique le nombre d'éléments libres non liés (si > 0).
9. Le placeholder "Organisation pédagogique" dans `SectionPedagogiePlaceholder.tsx` est remplacé par un lien vers cet onglet.

## Tasks / Subtasks

- [x] Ajouter l'onglet "Organisation" dans `ThemeDossierPage` (AC: #1)
  - [x] Ajouter `{ id: 'organisation', label: 'Organisation', icon: '🗂' }` dans le tableau `TABS`
  - [x] Ajouter `'organisation'` dans `TabId`
  - [x] Ajouter le case dans `renderSection`

- [x] Créer le composant `SectionOrganisation.tsx` (AC: #2, #3, #4, #5, #6, #7)
  - [x] Props : `{ themeId: string, tenantId: string, onFreeCountChange: (n: number) => void }`
  - [x] Chargement initial : `Promise.all([listSequencesByTheme, listMetaphorsByTheme, listCriteriaByTheme, listFaultsByTheme, listThemeMiniExercises])`
  - [x] Construire la hiérarchie en mémoire (pure JS, pas de requête supplémentaire)
  - [x] Rendu hiérarchique : Séquence → [Métaphores liées] → [Critères liés → [Erreurs liées]] → [Mini-exercices liés]
  - [x] Bloc "Éléments libres" en bas
  - [x] Sélecteurs inline de réassignation (un `<select>` par type de liaison)
  - [x] Sauvegarde immédiate + rollback optimiste via API au onChange du select
  - [x] Loading skeleton (même pattern que les autres sections)

- [x] Badge count sur l'onglet (AC: #8)
  - [x] Compter les éléments libres après chargement
  - [x] Afficher un badge rouge sur le tab "Organisation" si count > 0
  - [x] `freeCount` state dans `ThemeDossierPage`, passé via `onFreeCountChange` callback

- [x] Mise à jour du placeholder (AC: #9)
  - [x] N/A — `SectionPedagogiePlaceholder.tsx` n'existe pas dans le codebase

- [ ] Tests manuels (AC: #1 à #8)
  - [ ] Créer 2 séquences, 2 métaphores (1 liée, 1 libre), 3 critères (2 liés à séquences, 1 libre), 2 erreurs (1 liée, 1 libre), 2 mini-exercices (1 lié, 1 libre)
  - [ ] Vérifier que le builder affiche correctement la hiérarchie
  - [ ] Déplacer une métaphore libre vers une séquence → vérifier mise à jour immédiate dans la vue
  - [ ] Déplacer un critère d'une séquence vers une autre → vérifier
  - [ ] Lier une erreur libre à un critère → vérifier qu'elle migre sous le critère
  - [ ] Vérifier le badge count : 5 éléments libres → badge "5" rouge sur l'onglet

## Dev Notes

### Architecture de la hiérarchie — construction en mémoire

Le builder ne fait pas N requêtes de jointure — il charge tout en parallèle et construit la hiérarchie client-side :

```ts
type HierarchyNode = {
  sequences: (ThemeSequence & {
    metaphors    : ThemeMetaphor[]
    criteria     : (Criterion & { faults: Fault[] })[]
    miniExercises: ThemeMiniExercise[]
  })[]
  freeItems: {
    metaphors    : ThemeMetaphor[]
    criteria     : (Criterion & { faults: Fault[] })[]
    miniExercises: ThemeMiniExercise[]
    faults       : Fault[]     // erreurs sans criterion
  }
}

function buildHierarchy(
  sequences    : ThemeSequence[],
  metaphors    : ThemeMetaphor[],
  criteria     : Criterion[],
  faults       : Fault[],
  miniExercises: ThemeMiniExercise[],
): HierarchyNode {
  // Grouper par séquence
  const seqMap = new Map<string, HierarchyNode['sequences'][0]>()
  for (const seq of sequences) {
    seqMap.set(seq.id, { ...seq, metaphors: [], criteria: [], miniExercises: [] })
  }
  // Distribuer métaphores
  for (const m of metaphors) {
    if (m.sequenceId && seqMap.has(m.sequenceId)) seqMap.get(m.sequenceId)!.metaphors.push(m)
  }
  // ... etc
}
```

### Sélecteur inline — pattern optimiste

Pour éviter un rechargement complet à chaque réassignation, utiliser un update optimiste :
1. Mettre à jour l'état local immédiatement
2. Appeler l'API en arrière-plan
3. En cas d'erreur : rollback de l'état local + toast d'erreur

### Dépendances — toutes les stories 24.1 à 24.6

Cette story est la dernière de l'épic 24 et dépend de :
- 24.3 : `theme_metaphors` existe
- 24.4 : `criteria.sequence_id` nullable + `criteria.metaphor_id` existe
- 24.5 : `faults.criterion_id` nullable + `faults.theme_id` existe + `listFaultsByTheme`
- 24.6 : `theme_mini_exercises.sequence_id` existe

**Toutes les Stories 24.1 à 24.6 doivent être déployées avant la Story 24.7.**

### Aucune migration nécessaire

La Story 24.7 est purement frontend — elle utilise les données et APIs créées dans les stories précédentes. Aucune nouvelle table ou colonne requise.

### Performance — lazy loading

Si un thème a beaucoup d'éléments (100+ critères), le chargement initial peut être lent. Pour cette story, le chargement synchrone parallèle est suffisant. Une pagination sera envisagée plus tard si nécessaire.

### Complexité cachée — critères liés à une métaphore

Un critère peut être lié à une métaphore (via `metaphor_id`) ET une séquence (via `sequence_id`). Dans la hiérarchie, afficher ce critère sous sa séquence ET sous sa métaphore serait du double-affichage. **Règle de priorité** :
- Si `criteria.sequence_id` IS NOT NULL → afficher sous la séquence
- Si `criteria.metaphor_id` IS NOT NULL et `sequence_id` IS NULL → afficher sous la métaphore
- Les deux NOT NULL → afficher sous la séquence (la séquence est le conteneur principal)

### Accès Supabase

Tout accès Supabase via `@aureak/api-client` uniquement.

### Project Structure Notes

```
aureak/apps/web/app/(admin)/methodologie/themes/[themeKey]/sections/SectionOrganisation.tsx  ← créer
aureak/apps/web/app/(admin)/methodologie/themes/[themeKey]/page.tsx  ← ajouter onglet + case
aureak/apps/web/app/(admin)/methodologie/themes/[themeKey]/sections/SectionPedagogiePlaceholder.tsx  ← modifier
```

Aucune modification d'API client ni de migration requise.

### References

- [Source: aureak/apps/web/app/(admin)/methodologie/themes/[themeKey]/page.tsx] — structure onglets TABS + renderSection
- [Source: aureak/packages/api-client/src/referentiel/theme-dossier.ts] — listThemeMiniExercises, listFaultsByTheme (après 24.5)
- [Source: aureak/packages/api-client/src/referentiel/themes.ts#listSequencesByTheme] — API séquences
- [Source: aureak/packages/api-client/src/referentiel/theme-metaphors.ts] — API métaphores (après 24.3)
- [Source: aureak/packages/api-client/src/referentiel/criteria.ts] — listCriteriaByTheme (après 24.4)
- [Source: _bmad-output/implementation-artifacts/24-3-metaphores.md] — buildHierarchy conceptuel
- [Source: _bmad-output/implementation-artifacts/24-4-criteres-de-reussite.md] — criteria.metaphorId

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

Story purement frontend. `buildHierarchy` construit la hiérarchie client-side depuis 5 appels API parallèles. Mise à jour optimiste : état local mis à jour immédiatement, rollback si l'API échoue. `freeCount` remonté via `onFreeCountChange` pour le badge rouge sur l'onglet. AC#9 N/A — `SectionPedagogiePlaceholder.tsx` n'existe pas dans le codebase.

**Code Review fixes pass 1 (2026-03-14):** H1 — `buildHierarchy` corrigé : critères avec `metaphorId` (sans `sequenceId`) placés sous leur métaphore via `metaphorMap` (ajout du type `MetaphorNode`). `CriterionWithFaults` sous-composant extrait pour rendu récursif. M1 — `useEffect` dans `page.tsx` calcule un `freeCount` préliminaire depuis `criteria` déjà chargées (avant visite de l'onglet). M2 — rollback chirurgical au lieu de snapshot d'array.

**Code Review fixes pass 2 (2026-03-14):** M1 — `CriterionWithFaults` : ajout sélecteur "Métaphore" (`metaphorId`) + `onReassignCriterionMetaphor` callback + `reassignCriterionMetaphor` fonction (AC#4 complet). L1 — `reassignCriterion` efface `metaphorId` en base quand un `sequenceId` est assigné (données cohérentes, sequenceId wins per spec).

**Code Review fixes pass 3 (2026-03-14):** M1 — `load()` : ajout `catch` + state `error` + affichage message d'erreur (plus de contenu vide silencieux sur échec API). L1 — `tenantId` supprimé de `Props` et du call site `page.tsx:115` (prop inutilisée). L2 — `freeCount` préliminaire dans `page.tsx` étendu : compte maintenant critères libres + métaphores libres (plus précis avant visite de l'onglet Organisation).

### File List

- `aureak/apps/web/app/(admin)/methodologie/themes/[themeKey]/sections/SectionOrganisation.tsx` — créé
- `aureak/apps/web/app/(admin)/methodologie/themes/[themeKey]/page.tsx` — onglet Organisation + TabId + case renderSection + freeCount state + badge sidebar
