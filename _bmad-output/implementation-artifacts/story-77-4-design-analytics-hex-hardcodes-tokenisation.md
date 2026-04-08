# Story 77.4 : Design — Analytics : hex hardcodés → tokens (@aureak/theme)

Status: done

## Story

En tant qu'admin consultant la Stats Room et ses sous-pages Analytics,
je veux que chaque couleur hardcodée dans `analytics/page.tsx` et `analytics/progression/page.tsx` soit remplacée par le token `@aureak/theme` correspondant,
afin que ces fichiers respectent à 100 % la règle "zéro valeur hardcodée" du design system AUREAK.

## Acceptance Criteria

1. La constante `CLUBS_BLUE = '#3B82F6'` dans `analytics/page.tsx` est supprimée et remplacée par `colors.status.info` partout où elle est utilisée (accent stripe section "Clubs" + valeur texte quick-stat).
2. La constante `CHARGE_AMBER = '#F59E0B'` dans `analytics/page.tsx` est supprimée et remplacée par `colors.status.warning` partout où elle est utilisée (accent stripe section "Charge" + valeur texte quick-stat).
3. La constante `BRONZE = '#CD7F32'` dans `analytics/progression/page.tsx` est supprimée et remplacée par `colors.accent.bronze` dans l'objet `PODIUM_COLORS`.
4. La constante `SILVER = '#C0C0C0'` dans `analytics/progression/page.tsx` est remplacée par le token `colors.accent.silverPodium` nouvellement ajouté dans `@aureak/theme/tokens.ts` (valeur `#C0C0C0`, commenté "argent podium podium classements").
5. Aucune occurrence de chaîne hex `'#3B82F6'`, `'#F59E0B'`, `'#CD7F32'` ni `'#C0C0C0'` ne subsiste dans `analytics/page.tsx` ni dans `analytics/progression/page.tsx` (vérifiable via grep).
6. Le rendu visuel des pages `/analytics` et `/analytics/progression` est identique avant et après — aucun changement de couleur perceptible pour l'amber et le bronze (mêmes valeurs), couleur info légèrement différente de l'ancien bleu (#60A5FA vs #3B82F6) mais conforme à la palette Aureak.
7. Le fichier `generateMonthlyReport.ts` n'est PAS modifié — ses constantes locales sont documentées comme exception SSR justifiée (import côté serveur interdit).

## Tasks / Subtasks

- [x] T1 — Ajouter token `colors.accent.silverPodium` dans `@aureak/theme` (AC: 4)
  - [x] T1.1 — Dans `aureak/packages/theme/src/tokens.ts`, dans `colors.accent`, ajouter après `silver`: `silverPodium: '#C0C0C0',  // argent classique podium — #1 usage: progression/page.tsx PODIUM_COLORS`

- [x] T2 — Tokeniser `analytics/page.tsx` : supprimer CLUBS_BLUE + CHARGE_AMBER (AC: 1, 2, 5)
  - [x] T2.1 — Supprimer les lignes 16-17 (`const CHARGE_AMBER = '#F59E0B'` et `const CLUBS_BLUE = '#3B82F6'`)
  - [x] T2.2 — Dans l'array `SECTIONS`, section "Charge" : remplacer `accent: CHARGE_AMBER` par `accent: colors.status.warning`
  - [x] T2.3 — Dans l'array `SECTIONS`, section "Clubs" : remplacer `accent: CLUBS_BLUE` par `accent: colors.status.info`
  - [x] T2.4 — Vérifier que l'import `colors` depuis `@aureak/theme` couvre `colors.status.warning` et `colors.status.info` (déjà importé — pas de changement d'import nécessaire)

- [x] T3 — Tokeniser `analytics/progression/page.tsx` : supprimer SILVER + BRONZE (AC: 3, 4, 5)
  - [x] T3.1 — Supprimer les lignes 13-14 (`const SILVER = '#C0C0C0'` et `const BRONZE = '#CD7F32'`)
  - [x] T3.2 — Dans l'objet `PODIUM_COLORS` : remplacer `2: SILVER` par `2: colors.accent.silverPodium`
  - [x] T3.3 — Dans l'objet `PODIUM_COLORS` : remplacer `3: BRONZE` par `3: colors.accent.bronze`
  - [x] T3.4 — Ajouter `colors` dans l'import existant `@aureak/theme` si absent (vérifier ligne ~9 du fichier)

- [x] T4 — Validation (AC: tous)
  - [x] T4.1 — Grep `'#3B82F6\|#F59E0B\|#CD7F32\|#C0C0C0'` dans `analytics/page.tsx` → zéro résultat
  - [x] T4.2 — Grep `'#3B82F6\|#F59E0B\|#CD7F32\|#C0C0C0'` dans `analytics/progression/page.tsx` → zéro résultat
  - [x] T4.3 — Naviguer sur `/analytics` et `/analytics/progression` — aucune erreur JS console

## Dev Notes

### ⚠️ Contraintes Stack

Ce projet utilise :
- **React Native Web** (View, Pressable, StyleSheet, Image) — pas de Tailwind, pas de className
- **Tamagui** : XStack, YStack, Text — uniquement dans `_layout.tsx`
- **Tokens `@aureak/theme`** : `colors`, `space`, `shadows`, `radius`, `transitions`
- **Composants `@aureak/ui`** : AureakButton, AureakText, Badge, Card, Input
- **Accès Supabase UNIQUEMENT via `@aureak/api-client`** — jamais direct dans apps/
- **Styles via tokens uniquement** — jamais de couleurs hardcodées
- **Try/finally obligatoire** sur tout state setter de chargement

---

### T1 — Ajout token silverPodium

Fichier : `aureak/packages/theme/src/tokens.ts`

Localiser dans `colors.accent` le bloc existant :
```typescript
silver   : '#9CA3AF',  // argent
```
Ajouter immédiatement après :
```typescript
silverPodium: '#C0C0C0',  // argent classique podium — podium classements progression
```

Pourquoi un token séparé : `colors.accent.silver` (#9CA3AF) est l'argent "gris neutre" des éléments secondaires. `silverPodium` (#C0C0C0) est l'argent métallique classique du podium. Ce sont deux usages sémantiquement distincts.

---

### T2 — analytics/page.tsx

Fichier : `aureak/apps/web/app/(admin)/analytics/page.tsx`

**Avant (lignes 15-17) :**
```typescript
// ── Constantes locales de couleur (tokens non disponibles pour ces valeurs) ───
const CHARGE_AMBER = '#F59E0B'
const CLUBS_BLUE   = '#3B82F6'
```

**Après :** supprimer ces 3 lignes (commentaire + 2 constantes).

**Dans SECTIONS array :**
```typescript
// Section "Charge" — avant :
accent: CHARGE_AMBER,
// après :
accent: colors.status.warning,

// Section "Clubs" — avant :
accent: CLUBS_BLUE,
// après :
accent: colors.status.info,
```

Impact visuel : 
- Charge amber → `colors.status.warning` = `#F59E0B` (identique — même valeur)
- Clubs blue → `colors.status.info` = `#60A5FA` (bleu ciel légèrement plus clair que `#3B82F6` — conforme palette Aureak)

---

### T3 — analytics/progression/page.tsx

Fichier : `aureak/apps/web/app/(admin)/analytics/progression/page.tsx`

**Avant (lignes 13-19) :**
```typescript
const SILVER = '#C0C0C0'
const BRONZE = '#CD7F32'

const PODIUM_COLORS: Record<number, string> = {
  1: colors.accent.gold,
  2: SILVER,
  3: BRONZE,
}
```

**Après :**
```typescript
const PODIUM_COLORS: Record<number, string> = {
  1: colors.accent.gold,
  2: colors.accent.silverPodium,
  3: colors.accent.bronze,
}
```

Vérifier que l'import `@aureak/theme` à la ligne ~9 contient `colors` :
```typescript
import { colors, radius, space, shadows, getStatColor, STAT_THRESHOLDS } from '@aureak/theme'
```
Si oui, aucune modification d'import nécessaire.

---

### Exception documentée : generateMonthlyReport.ts

Le fichier `aureak/apps/web/app/(admin)/analytics/generateMonthlyReport.ts` contient des constantes hex locales (GOLD, GREEN, RED, DARK, MUTED, WHITE, LIGHT). **Ce fichier ne doit PAS être modifié** dans cette story.

Raison : le commentaire ligne 8 explique — "Couleurs AUREAK synchronisées manuellement avec tokens pour éviter import côté serveur". Ce fichier génère du PDF via jspdf (import dynamique) et ne peut pas utiliser l'import `@aureak/theme` (module ESM, risque crash SSR). L'exception est techniquement justifiée et documentée in situ.

---

### Design

**Type design** : `polish`

Tokens à utiliser :
```tsx
import { colors } from '@aureak/theme'

// Section "Clubs" accent
accent: colors.status.info       // #60A5FA — bleu ciel informationnel

// Section "Charge" accent
accent: colors.status.warning    // #F59E0B — ambre alertes non-critiques

// Podium #2
2: colors.accent.silverPodium    // #C0C0C0 — argent métallique podium

// Podium #3
3: colors.accent.bronze          // #CD7F32 — bronze
```

Principes design à respecter :
- Zéro couleur hardcodée dans les fichiers UI — toujours via `@aureak/theme`
- `colors.status.info` pour tout élément informatif neutre (bleu)
- `colors.status.warning` pour les métriques de charge/intensité (ambre)

---

### Fichiers à créer / modifier

| Fichier | Action | Notes |
|---------|--------|-------|
| `aureak/packages/theme/src/tokens.ts` | Modifier | Ajouter `silverPodium: '#C0C0C0'` dans `colors.accent` |
| `aureak/apps/web/app/(admin)/analytics/page.tsx` | Modifier | Supprimer CHARGE_AMBER + CLUBS_BLUE, brancher tokens |
| `aureak/apps/web/app/(admin)/analytics/progression/page.tsx` | Modifier | Supprimer SILVER + BRONZE, brancher tokens |

### Fichiers à NE PAS modifier

- `aureak/apps/web/app/(admin)/analytics/generateMonthlyReport.ts` — exception SSR documentée, constantes hex locales justifiées
- `aureak/apps/web/app/(admin)/analytics/presences/page.tsx` — non impacté par cette story
- `aureak/apps/web/app/(admin)/analytics/charge/page.tsx` — non impacté par cette story
- `aureak/apps/web/app/(admin)/analytics/clubs/page.tsx` — non impacté par cette story
- `aureak/apps/web/app/(admin)/analytics/implantation/page.tsx` — non impacté par cette story

---

### Dépendances à protéger

- Story 60.1 utilise `SECTIONS` array dans `analytics/page.tsx` — ne pas modifier les `href`, `title`, `description`, `icon`, `kpiLabel`
- Story 60.6 utilise `PODIUM_COLORS` et `PODIUM_MEDALS` dans `analytics/progression/page.tsx` — ne pas modifier `PODIUM_MEDALS` ni les clés numériques de `PODIUM_COLORS`
- Story 77.1 (done) a tokenisé `evaluations/page.tsx` — ce périmètre est clos

---

### Références

- Design tokens : `aureak/packages/theme/src/tokens.ts` lignes 9-80
- Pattern token import : `aureak/apps/web/app/(admin)/analytics/page.tsx` ligne 11
- Pattern token import : `aureak/apps/web/app/(admin)/analytics/progression/page.tsx` ligne 9
- Story liée : `_bmad-output/implementation-artifacts/story-77-1-design-evaluations-tokens-fontfamily-hex.md`

---

### Multi-tenant

Aucun impact multi-tenant — modification purement stylistique, aucune requête DB.

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List

| Fichier | Statut |
|---------|--------|
| `aureak/packages/theme/src/tokens.ts` | À modifier |
| `aureak/apps/web/app/(admin)/analytics/page.tsx` | À modifier |
| `aureak/apps/web/app/(admin)/analytics/progression/page.tsx` | À modifier |
