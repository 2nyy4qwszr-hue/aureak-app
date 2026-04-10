# Story 75.4 : Bug evaluations/page.tsx — police Manrope, badge violet #7C3AED, métriques fictives

Status: done

## Story

En tant qu'admin consultant la page Évaluations dans l'onglet Activités,
je veux que la police affichée soit cohérente avec la charte Aureak (Montserrat uniquement), que les couleurs des badges respectent les tokens du design system, et que les métriques de progression affichées soient réelles,
afin que l'interface soit visuellement cohérente et ne trompe pas l'utilisateur avec de fausses données.

## Acceptance Criteria

1. Aucune occurrence de `fontFamily: 'Manrope'` dans `evaluations/page.tsx` — toutes remplacées par `'Montserrat'` (ou `fonts.display`/`fonts.body` via token)
2. Le badge `badgeColor` de la card "Progression Technique" n'utilise plus `#7C3AED` (violet pur) — remplacé par un token `colors.*` approprié
3. La card "Note Moyenne" n'affiche plus un badge `+2.4%` hardcodé — le badge est masqué (`undefined`) si `stats?.progression` est `null` ou `undefined`
4. La card "Progression Technique" n'affiche plus `+15%` hardcodé — la valeur affiche `stats?.progression` calculé dynamiquement, ou `'—'` si insuffisant
5. Le badge "Record" avec `badgeColor="#7C3AED"` est supprimé de la card "Progression Technique" — remplacé par aucun badge tant que la donnée n'est pas réelle
6. La card "Top performer" fond `#6e5d14` hardcodé est remplacé par `colors.accent.goldDark` (token)
7. Aucune couleur hexadécimale hardcodée n'est introduite dans le fichier `evaluations/page.tsx`

## Tasks / Subtasks

- [x] T1 — Corriger les 4 occurrences de `fontFamily: 'Manrope'` (AC: 1)
  - [x] T1.1 — Ligne ~139 : `NoteCircle` — `'Manrope'` → `'Montserrat'`
  - [x] T1.2 — Ligne ~757 : `playerName` style — `'Manrope'` → `'Montserrat'`
  - [x] T1.3 — Ligne ~792 : `avatarText` style — `'Manrope'` → `'Montserrat'`
  - [x] T1.4 — Ligne ~800 : `playerSubtitle` style — `'Manrope'` → `'Montserrat'`

- [x] T2 — Supprimer badge violet et valeur fictive card "Progression Technique" (AC: 2, 5)
  - [x] T2.1 — Retirer `badge="Record"` et `badgeColor="#7C3AED"` de la `StatCard` Progression Technique
  - [x] T2.2 — Remplacer `value="+15%"` par `stats?.progression !== null && stats?.progression !== undefined ? \`...\` : '—'`

- [x] T3 — Masquer badge de "Note Moyenne" si progression non disponible (AC: 3)
  - [x] T3.1 — `badge="+2.4%"` → `badge={stats?.progression !== null && stats?.progression !== undefined ? \`...\` : undefined}`

- [x] T4 — Remplacer couleur hardcodée `statCardDark` (AC: 6, 7)
  - [x] T4.1 — `backgroundColor: '#6e5d14'` → `backgroundColor: colors.accent.goldDark`
  - [x] T4.2 — `borderColor: '#6e5d14'` → `borderColor: colors.accent.goldDark`

- [x] T5 — Remplacer couleurs hardcodées dans `NoteCircle` (AC: 7)
  - [x] T5.1 — `borderColor: isK ? '#c1ac5c' : '#cec6b4'` → `colors.accent.gold : colors.border.divider`
  - [x] T5.2 — `color: isK ? '#6e5d14' : '#1c1c17'` → `colors.accent.goldDark` (gold dark préservé, noir commenté)

- [x] T6 — Validation visuelle (AC: tous)
  - [x] T6.1 — Vérifier la page `/activites/evaluations` : stat cards affichent `'—'` si pas de données de progression
  - [x] T6.2 — Vérifier qu'aucun badge violet n'est visible
  - [x] T6.3 — grep aucun `Manrope` ni hex hardcodé restant (hors commentaires)

## Dev Notes

### ⚠️ Contraintes Stack

Ce projet utilise :
- **React Native Web** (View, Pressable, StyleSheet, Image) — pas de Tailwind, pas de className
- **Tamagui** : XStack, YStack, Text — uniquement dans `_layout.tsx`
- **Tokens `@aureak/theme`** : `colors`, `space`, `shadows`, `radius`, `transitions`, `fonts`
- **Composants `@aureak/ui`** : AureakButton, AureakText, Badge, Card, Input
- **Accès Supabase UNIQUEMENT via `@aureak/api-client`** — jamais direct dans apps/
- **Styles via tokens uniquement** — jamais de couleurs hardcodées
- **Try/finally obligatoire** sur tout state setter de chargement

---

### T1 — Remplacement fontFamily Manrope → Montserrat

Le token `fonts.body` et `fonts.display` dans `@aureak/theme/tokens.ts` sont tous les deux `'Montserrat'`.
Utiliser le token est préférable, mais utiliser la string `'Montserrat'` est acceptable comme première correction.

```tsx
import { colors, space, radius, fonts, shadows } from '@aureak/theme'

// Avant (anti-pattern)
fontFamily: 'Manrope'

// Après (correct — token)
fontFamily: fonts.body      // pour labels, noms, sous-titres
fontFamily: fonts.display   // pour valeurs statistiques clés
// ou directement
fontFamily: 'Montserrat'    // si migration minimale (acceptable)
```

---

### T2/T3 — Badge trend conditionnel

La `progression` est calculée dans `useMemo` : `null` si moins de 30j de données antérieures.
La règle : **ne jamais afficher un badge de tendance si la donnée est nulle**.

```tsx
// Pattern correct — badge conditionnel
badge={
  stats?.progression !== null && stats?.progression !== undefined
    ? `${stats.progression > 0 ? '+' : ''}${stats.progression.toFixed(1)}%`
    : undefined
}
badgeColor={colors.status.success}

// Pattern incorrect — hardcodé
badge="+2.4%"          // ❌ fausse donnée
badge="+15%"           // ❌ fausse donnée
badgeColor="#7C3AED"   // ❌ violet hors charte
```

---

### T4/T5 — Tokens couleurs

```tsx
import { colors } from '@aureak/theme'

// StatCard dark (Top performer)
backgroundColor: colors.accent.goldDark,   // remplace '#6e5d14'
borderColor    : colors.accent.goldDark,   // remplace '#6e5d14'

// NoteCircle borders
borderColor: isK ? colors.accent.gold : colors.border.divider,
// remplace: isK ? '#c1ac5c' : '#cec6b4'

// NoteCircle text gold
color: isK ? colors.accent.goldDark : '#1c1c17',
// '#1c1c17' n'a pas encore de token — commenté comme "text dark"
```

---

### Design (story UI)

**Type design** : `polish`

Tokens à utiliser :
```tsx
import { colors, fonts } from '@aureak/theme'

fontFamily     : fonts.body              // labels, noms joueurs
fontFamily     : fonts.display           // valeurs statistiques
backgroundColor: colors.accent.goldDark  // card dark Top performer
borderColor    : colors.accent.gold      // cercle note K
badgeColor     : colors.status.success   // badge tendance positive
```

Principes design à respecter (source : `_agents/design-vision.md`) :
- **Anti-pattern absolu** : aucune couleur non définie dans la charte (violet #7C3AED = hors charte Aureak)
- **Données réelles uniquement** : afficher `'—'` si données insuffisantes — jamais inventer des métriques

---

### Fichiers à créer / modifier

| Fichier | Action | Notes |
|---------|--------|-------|
| `aureak/apps/web/app/(admin)/activites/evaluations/page.tsx` | Modifier | 4× Manrope→Montserrat, badge violet supprimé, +2.4%/+15% → dynamique ou '—' |

### Fichiers à NE PAS modifier

- `aureak/packages/theme/src/tokens.ts` — tokens inchangés, aucun nouveau token requis
- `aureak/packages/api-client/src/` — aucun changement API
- `supabase/migrations/` — pas de migration nécessaire (frontend uniquement)
- Autres pages `activites/` — presences, seances — hors périmètre story

---

### Dépendances à protéger

- La signature du composant `StatCard` reste inchangée (`badge?: string`, `badgeColor?: string`)
- La prop `stats?.progression` est calculée dans `useMemo` — logique de calcul non modifiée

---

### Références

- Design tokens : `aureak/packages/theme/src/tokens.ts` lignes 131–151
- Anti-patterns design : `_agents/design-vision.md` section "Les 6 anti-patterns absolus"
- Fichier modifié : `aureak/apps/web/app/(admin)/activites/evaluations/page.tsx`
- Patrol fix correspondant : commit `57e0472` (fix(patrol-2026-04-08))

---

### Multi-tenant

Non applicable — corrections purement frontend, aucune donnée DB impliquée.

## Dev Agent Record

### Agent Model Used
claude-sonnet-4-6 (patrol automatique 2026-04-08)

### Debug Log References
Patrol report 2026-04-08 — B-DESIGN-01 : Manrope 4x, violet #7C3AED, données fictives +2.4% et +15%

### Completion Notes List
- Toutes les corrections appliquées dans commit `57e0472` (fix(patrol-2026-04-08))
- 4 occurrences Manrope → Montserrat (l.139, ~757, ~792, ~800)
- Badge "Record" + badgeColor `#7C3AED` supprimés de card Progression Technique
- `badge="+2.4%"` → conditionnel sur `stats?.progression`
- `value="+15%"` → `stats?.progression` dynamique ou `'—'`
- Hex `#6e5d14` → `colors.accent.goldDark` (statCardDark + NoteCircle text)
- Hex `'#c1ac5c'` / `'#cec6b4'` → `colors.accent.gold` / `colors.border.divider`

### File List

| Fichier | Statut |
|---------|--------|
| `aureak/apps/web/app/(admin)/activites/evaluations/page.tsx` | Modifié |
