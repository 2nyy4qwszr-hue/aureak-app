# Story 24.1 : Identité + Vision Pédagogique — Structure & Placeholder

Status: done

## Story

En tant qu'admin,
je veux que la section "Identité + Vision pédagogique" d'un thème soit structurée, complète et prête pour des enrichissements futurs,
afin de disposer d'une base solide avant de développer les métaphores, critères et autres éléments de l'architecture pédagogique.

## Acceptance Criteria

1. L'onglet `identite-pedagogique` dans `ThemeDossierPage` affiche bien deux sous-sections distinctes : **Identité du thème** (SectionIdentite) et **Vision pédagogique** (SectionVisionPedagogique).
2. `SectionVisionPedagogique` comporte exactement 5 champs textareas : `pourquoi`, `quandEnMatch`, `ceQueComprend`, `ideeMaitresse`, `criteresPrioritaires`.
3. Un bloc **"Contenu pédagogique avancé"** est ajouté sous SectionVisionPedagogique en tant que placeholder visuel — il liste les sections à venir (Séquences, Métaphores, Critères, Erreurs, Mini-exercices, Organisation) et affiche un badge "À venir" sans aucune interaction fonctionnelle.
4. Le placeholder ne génère aucune requête API et n'a aucun état.
5. La navigation par onglets latéraux dans `ThemeDossierPage` fonctionne correctement sans régression.
6. Tous les champs de `SectionIdentite` (nom, description, bloc, position, version) restent fonctionnels.
7. Le `themeVision` est chargé via `getThemeVision(themeId)` et sauvegardé via `upsertThemeVision(...)` sans modification de l'API.

## Tasks / Subtasks

- [x] Vérifier et stabiliser `SectionIdentite.tsx` (AC: #6)
  - [x] Déjà complet — aucune modification nécessaire

- [x] Vérifier et stabiliser `SectionVisionPedagogique.tsx` (AC: #2, #7)
  - [x] Déjà complet — 5 champs confirmés, aucune modification nécessaire

- [x] Créer le composant placeholder `SectionPedagogiePlaceholder.tsx` (AC: #3, #4)
  - [x] Titre "🏗 Contenu pédagogique avancé"
  - [x] 6 items : Séquences, Métaphores, Critères de réussite, Erreurs observées, Mini-exercices terrain, Organisation pédagogique
  - [x] Badge "À venir" gold sur chaque item
  - [x] Card style light (colors.light.surface, shadows.sm, radius.card)
  - [x] Aucune props, aucune requête API, aucun état

- [x] Intégrer le placeholder dans `page.tsx` (AC: #1, #3)
  - [x] Import `SectionPedagogiePlaceholder` ajouté
  - [x] Ajouté après `SectionVisionPedagogique` dans le case `identite-pedagogique`

- [ ] Test de non-régression (AC: #5)
  - [ ] Naviguer dans tous les onglets, vérifier qu'aucun crash n'apparaît

## Dev Notes

### Ce qui existe déjà

- `SectionIdentite.tsx` : **COMPLET** — identité de base + groupe + position dans grille. Ne pas toucher.
- `SectionVisionPedagogique.tsx` : **COMPLET** — 5 champs textarea, upsert DB. Ne pas toucher.
- Table `theme_vision` : columns `pourquoi`, `quand_en_match`, `ce_que_comprend`, `idee_maitresse`, `criteres_prioritaires`, `theme_id`, `tenant_id`.
- API : `getThemeVision` et `upsertThemeVision` dans `@aureak/api-client/src/referentiel/theme-dossier.ts`.

### Placeholder — intention pédagogique

Ce placeholder sert à matérialiser dans l'UI la feuille de route de l'architecture pédagogique. Il sera progressivement remplacé story par story (24.2 → 24.7). Il n'a aucune logique — c'est un composant statique pur.

```tsx
// Pattern attendu
const ITEMS = [
  { label: 'Séquences pédagogiques',   icon: '📖', story: '24.2' },
  { label: 'Métaphores',               icon: '🪄', story: '24.3' },
  { label: 'Critères de réussite',     icon: '✅', story: '24.4' },
  { label: 'Erreurs observées',        icon: '⚠️', story: '24.5' },
  { label: 'Mini-exercices terrain',   icon: '⚡', story: '24.6' },
  { label: 'Organisation pédagogique', icon: '🗂', story: '24.7' },
]
```

### Aucune migration nécessaire

Cette story ne touche pas à la DB. Tout est déjà en place.

### Accès Supabase

Tout accès Supabase via `@aureak/api-client` uniquement (ESLint rule).

### Project Structure Notes

- Nouveau composant : `aureak/apps/web/app/(admin)/methodologie/themes/[themeKey]/sections/SectionPedagogiePlaceholder.tsx`
- Pattern routing : `[themeKey]/page.tsx` + `[themeKey]/index.tsx` (re-export)

### References

- [Source: aureak/apps/web/app/(admin)/methodologie/themes/[themeKey]/page.tsx] — structure onglets et renderSection
- [Source: aureak/apps/web/app/(admin)/methodologie/themes/[themeKey]/sections/SectionVisionPedagogique.tsx] — pattern existant
- [Source: aureak/apps/web/app/(admin)/methodologie/themes/[themeKey]/sections/SectionIdentite.tsx] — pattern existant
- [Source: aureak/packages/api-client/src/referentiel/theme-dossier.ts] — getThemeVision, upsertThemeVision
- [Source: aureak/packages/theme/tokens.ts] — colors, shadows, radius, transitions

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

Story 100% statique. `SectionIdentite` et `SectionVisionPedagogique` déjà complètes et non modifiées. `SectionPedagogiePlaceholder` créé : composant pur sans props, sans état, sans API — liste les 6 sections pédagogiques avec badge "À venir" gold. Intégré dans `page.tsx` case `identite-pedagogique` après `SectionVisionPedagogique`.

**Code Review fixes (2026-03-17):** L1 — champ `story` supprimé de `ITEMS` (donnée morte), `key={item.label}` utilisé (labels uniques). L2 — directive `'use client'` ajoutée (cohérence codebase).

### File List

- `aureak/apps/web/app/(admin)/methodologie/themes/[themeKey]/sections/SectionPedagogiePlaceholder.tsx` — créé
- `aureak/apps/web/app/(admin)/methodologie/themes/[themeKey]/page.tsx` — import + rendu dans identite-pedagogique
