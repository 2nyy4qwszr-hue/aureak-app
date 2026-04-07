# Story 73.4 : Design — Titre "LA JOURNÉE" aligné sur "L'ACADÉMIE" et "PERFORMANCE"

Status: done

## Story

En tant qu'admin,
je veux que le titre de colonne "LA JOURNÉE" ait le même style visuel que "L'ACADÉMIE" et "PERFORMANCE",
afin que la hiérarchie typographique du dashboard soit cohérente et que les trois colonnes soient visuellement équilibrées.

## Acceptance Criteria

1. Le titre "La journée" (ligne 2725 de `dashboard/page.tsx`) a `fontSize: 12` (au lieu de `10`).
2. Le titre "La journée" a `color: colors.text.dark` (au lieu de `colors.text.subtle`).
3. Le titre "La journée" a `fontFamily: 'Montserrat, sans-serif'` (propriété ajoutée).
4. Les propriétés `fontWeight: 700`, `textTransform: 'uppercase'`, et `letterSpacing: 1.5` sont conservées inchangées.
5. Le style résultant est visuellement identique à celui du titre "L'ACADÉMIE" (ligne 2942) et du titre "PERFORMANCE" (ligne 3200).
6. Aucun autre style du dashboard n'est modifié.

## Tasks / Subtasks

- [x] T1 — Corriger le style du titre "La journée" dans `dashboard/page.tsx` (AC: 1, 2, 3, 4, 5, 6)
  - [x] T1.1 — Ligne 2725 : remplacer `fontSize: 10` par `fontSize: 12`
  - [x] T1.2 — Ligne 2725 : remplacer `color: colors.text.subtle` par `color: colors.text.dark`
  - [x] T1.3 — Ligne 2725 : ajouter `fontFamily: 'Montserrat, sans-serif'`

- [x] T2 — Validation (AC: tous)
  - [x] T2.1 — Naviguer sur http://localhost:8081/(admin)/dashboard, vérifier visuellement que les trois titres de colonnes (LA JOURNÉE / L'ACADÉMIE / PERFORMANCE) ont la même taille, la même couleur foncée et la même police
  - [x] T2.2 — Inspecter la div du titre "La journée" dans les DevTools → confirmer `font-size: 12px`, `color` = valeur de `colors.text.dark`, `font-family` contient Montserrat
  - [x] T2.3 — Vérifier qu'aucune autre section du dashboard n'a été modifiée (diff git limité au bloc ligne 2725)

## Dev Notes

### ⚠️ Contraintes Stack

Ce projet utilise :
- **React Native Web** (View, Pressable, StyleSheet, Image) — pas de Tailwind, pas de className
- **Tokens `@aureak/theme`** : `colors`, `space`, `shadows`, `radius`, `transitions`
- **Styles via tokens uniquement** — jamais de couleurs hardcodées

---

### T1 — Modification exacte à effectuer

**Fichier cible** : `aureak/apps/web/app/(admin)/dashboard/page.tsx`, ligne 2725

**Avant :**
```tsx
<div style={{ fontSize: 10, fontWeight: 700, color: colors.text.subtle, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 10 }}>
  La journée
</div>
```

**Après :**
```tsx
<div style={{ fontSize: 12, fontWeight: 700, color: colors.text.dark, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 10, fontFamily: 'Montserrat, sans-serif' }}>
  La journée
</div>
```

**Style de référence — L'ACADÉMIE (ligne 2942) :**
```tsx
<div style={{ fontSize: 12, fontWeight: 700, color: colors.text.dark, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 0, fontFamily: 'Montserrat, sans-serif' }}>
```

**Style de référence — PERFORMANCE (ligne 3200) :**
```tsx
<div style={{ fontSize: 12, fontWeight: 700, color: colors.text.dark, textTransform: 'uppercase' as React.CSSProperties['textTransform'], letterSpacing: 1.5, marginBottom: 12, fontFamily: 'Montserrat, sans-serif' }}>
```

---

### Design

Tokens à utiliser :
```tsx
import { colors } from '@aureak/theme'

// Titre colonne dashboard — pattern uniforme 3 colonnes
fontSize     : 12
fontWeight   : 700
color        : colors.text.dark
textTransform: 'uppercase'
letterSpacing: 1.5
fontFamily   : 'Montserrat, sans-serif'
```

Principes design à respecter :
- Cohérence typographique : les trois titres de colonnes doivent être visuellement identiques
- Hiérarchie claire : `colors.text.dark` donne le poids visuel nécessaire aux titres de section

---

### Fichiers à modifier

| Fichier | Action | Notes |
|---------|--------|-------|
| `aureak/apps/web/app/(admin)/dashboard/page.tsx` | Modifier | Ligne 2725 uniquement — 3 propriétés CSS |

### Fichiers à NE PAS modifier

- `aureak/packages/theme/src/tokens.ts` — aucun token nouveau requis
- `aureak/packages/types/src/entities.ts` — aucun type impacté
- `aureak/packages/api-client/src/` — aucune API impactée
- Tout autre fichier du dashboard — périmètre strictement limité à la ligne 2725

---

### Dépendances à protéger

- Aucune autre story ne modifie le style du titre "La journée" — modification atomique sans risque

---

### Références

- Design tokens : `aureak/packages/theme/src/tokens.ts`
- Pattern de référence "L'ACADÉMIE" : `aureak/apps/web/app/(admin)/dashboard/page.tsx` ligne 2942
- Pattern de référence "PERFORMANCE" : `aureak/apps/web/app/(admin)/dashboard/page.tsx` ligne 3200
- Style actuel à corriger : `aureak/apps/web/app/(admin)/dashboard/page.tsx` ligne 2725

---

### Multi-tenant

Non applicable — modification purement CSS, aucune donnée, aucun RLS.

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List

| Fichier | Statut |
|---------|--------|
| `aureak/apps/web/app/(admin)/dashboard/page.tsx` | À modifier |
