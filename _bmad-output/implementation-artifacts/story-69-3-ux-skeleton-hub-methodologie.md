# Story 69.3 : UX — Skeleton complet tile "Thème de la semaine" + hub méthodologie

Status: done

## Story
En tant qu'admin, je veux que la tile "Thème de la semaine" du hub Méthodologie affiche un skeleton complet pendant le chargement (pas seulement un bloc titre de 20px), afin d'éviter le layout shift et d'avoir une expérience premium cohérente.

## Acceptance Criteria
1. Pendant `loadingTheme === true`, la tile affiche un skeleton complet : 1 ligne label (h:12), 1 ligne titre (h:20), 2 lignes description (h:14 chacune), 1 barre progression (h:6) — hauteur totale stable ≈140px
2. Aucun layout shift visible entre l'état loading et l'état chargé (la card ne "saute" pas)
3. Skeleton = `backgroundColor: colors.light.muted, borderRadius: radius.xs, opacity: 0.6` sur chaque bloc, avec `marginBottom: 6` entre chaque

## Tasks
- [ ] T1 — Dans `methodologie/index.tsx`, localiser le bloc conditionnel `{loadingTheme ? (<View style={{ height: 20, backgroundColor: colors.border.light, borderRadius: radius.xs }} />) : ...}` (lignes ~105-106)
- [ ] T2 — Remplacer ce seul bloc `<View height:20 />` par un skeleton multi-lignes complet :
  - Ligne label 12px : `{ height: 12, width: '60%', backgroundColor: colors.light.muted, borderRadius: radius.xs, opacity: 0.6, marginBottom: 6 }`
  - Ligne titre 20px : `{ height: 20, width: '90%', backgroundColor: colors.light.muted, borderRadius: radius.xs, opacity: 0.6, marginBottom: 6 }`
  - Ligne desc 1 : `{ height: 14, width: '100%', backgroundColor: colors.light.muted, borderRadius: radius.xs, opacity: 0.6, marginBottom: 4 }`
  - Ligne desc 2 : `{ height: 14, width: '75%', backgroundColor: colors.light.muted, borderRadius: radius.xs, opacity: 0.6, marginBottom: 10 }`
  - Barre progression : `{ height: 6, width: '100%', backgroundColor: colors.light.muted, borderRadius: radius.xs, opacity: 0.6 }`
- [ ] T3 — Vérifier visuellement que la hauteur de la card en état loading ≈ hauteur en état chargé (thème + description + barre)

## Dev Notes
React Native Web — View uniquement. Le fichier `methodologie/index.tsx` importe déjà `colors`, `space`, `shadows`, `radius` depuis `@aureak/theme` — pas de nouvel import nécessaire. La variable `loadingTheme` est déjà définie dans le composant.

La tile concernée est la card `themeCard` avec `boxShadow: shadows.gold`.

Fichiers : `aureak/apps/web/app/(admin)/methodologie/index.tsx` (modifier)

## Dev Agent Record
### Agent Model Used
### File List
| Fichier | Statut |
|---------|--------|
| `aureak/apps/web/app/(admin)/methodologie/index.tsx` | À modifier |
