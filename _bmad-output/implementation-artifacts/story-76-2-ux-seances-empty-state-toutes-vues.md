# Story 76.2 : UX Séances — Empty State CTA affiché sur toutes les vues (semaine/mois/année)

Status: done

## Story

En tant qu'admin,
je veux voir un message "Aucune séance" avec le bouton "Créer une séance" sur toutes les vues (semaine, mois, année) quand aucune séance n'existe pour la période,
afin de ne jamais être bloqué sans accès rapide à la création de séance, quelle que soit la vue active.

## Acceptance Criteria

1. Quand `filteredSessions.length === 0` et `period === 'week'`, l'empty state (texte + CTA "Créer une séance") s'affiche — comportement inchangé.
2. Quand `filteredSessions.length === 0` et `period === 'month'`, l'empty state (texte + CTA "Créer une séance") s'affiche — comportement actuellement manquant à corriger.
3. Quand `filteredSessions.length === 0` et `period === 'year'`, l'empty state (texte + CTA "Créer une séance") s'affiche — comportement actuellement manquant à corriger.
4. Quand `filteredSessions.length === 0` et `period === 'day'`, l'empty state s'affiche — comportement inchangé.
5. Quand `filteredSessions.length > 0`, MonthView et YearView continuent de s'afficher normalement sans empty state.
6. Le texte du message dans l'empty state reste contextuel : si `filterStatus` est actif → "Aucune séance avec le statut "{filterStatus}" sur cette période.", sinon → "Aucune séance sur cette période."
7. Le CTA "Créer une séance" dans l'empty state est un bouton gold (`colors.accent.gold`) qui navigue vers `/seances/new` — token inchangé.
8. Aucune couleur hardcodée n'est introduite — tous les styles utilisent les tokens `@aureak/theme`.

## Tasks / Subtasks

- [x] T1 — Retirer la condition `period !== 'month' && period !== 'year'` dans `seances/page.tsx` (AC: 1, 2, 3, 4)
  - [x] T1.1 — Modifier la ligne 808 de `aureak/apps/web/app/(admin)/seances/page.tsx` : remplacer `filteredSessions.length === 0 && period !== 'month' && period !== 'year'` par `filteredSessions.length === 0`
  - [x] T1.2 — Vérifier que le bloc `else if (period === 'day')` → `else if (period === 'week')` → `else if (period === 'month')` → `else` (year) reste intact et n'est désormais atteint que quand `filteredSessions.length > 0`

- [x] T2 — Validation (AC: tous)
  - [x] T2.1 — Naviguer vers `/seances`, passer en vue Mois, vérifier que l'empty state avec CTA apparaît si aucune séance sur le mois affiché
  - [x] T2.2 — Naviguer vers `/seances`, passer en vue Année, vérifier que l'empty state avec CTA apparaît si aucune séance sur l'année affichée
  - [x] T2.3 — Vérifier que les vues Jour et Semaine continuent d'afficher l'empty state comme avant
  - [x] T2.4 — Vérifier qu'avec des séances existantes, les vues Mois et Année s'affichent correctement (MonthView et YearView rendus normalement)
  - [x] T2.5 — Grep sur le fichier modifié : aucune couleur hardcodée introduite, aucun `console.log` sans guard NODE_ENV

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

### T1 — Modification unique dans seances/page.tsx

**Localisation exacte** : `aureak/apps/web/app/(admin)/seances/page.tsx` — ligne 808

**Avant** :
```tsx
} : filteredSessions.length === 0 && period !== 'month' && period !== 'year' ? (
```

**Après** :
```tsx
} : filteredSessions.length === 0 ? (
```

Le reste du bloc conditionnel (DayView / WeekView / MonthView / YearView) reste intact et s'applique uniquement quand `filteredSessions.length > 0`. La logique est correcte car :
- `filteredSessions.length === 0` → empty state affiché quelle que soit la period
- `filteredSessions.length > 0` → le bloc `period === 'day'` → `period === 'week'` → `period === 'month'` → `else` (year) s'exécute normalement

**Pattern existant conservé** (lignes 809-825 inchangées) :
```tsx
<View style={st.emptyState}>
  <AureakText variant="h3" style={{ color: colors.text.muted }}>Aucune séance</AureakText>
  <AureakText variant="caption" style={{ color: colors.text.muted, marginTop: 4, textAlign: 'center' as never }}>
    {filterStatus
      ? `Aucune séance avec le statut "${filterStatus}" sur cette période.`
      : filterImplantId
        ? 'Aucune séance pour cette sélection sur la période.'
        : 'Aucune séance sur cette période.'}
  </AureakText>
  <Pressable
    style={[st.newBtn, { marginTop: space.md }]}
    onPress={() => router.push('/seances/new' as never)}
  >
    <AureakText variant="caption" style={{ color: colors.text.dark, fontWeight: '700' }}>
      + Créer une séance
    </AureakText>
  </Pressable>
</View>
```

---

### Design

**Type design** : `polish`

Tokens utilisés (déjà en place, aucun changement) :
```tsx
import { colors, space } from '@aureak/theme'

// empty state text
color: colors.text.muted

// CTA button
backgroundColor: colors.accent.gold
color: colors.text.dark
```

Principes design à respecter (source : `_agents/design-vision.md`) :
- Fond clair — la vue reste sur `colors.light.primary`
- Profondeur obligatoire — le `st.newBtn` avec `colors.accent.gold` respecte ce principe

---

### Fichiers à créer / modifier

| Fichier | Action | Notes |
|---------|--------|-------|
| `aureak/apps/web/app/(admin)/seances/page.tsx` | Modifier | Retirer `&& period !== 'month' && period !== 'year'` ligne 808 |

### Fichiers à NE PAS modifier

- `aureak/apps/web/app/(admin)/seances/_components/MonthView.tsx` — non impacté, la correction est dans page.tsx
- `aureak/apps/web/app/(admin)/seances/_components/YearView.tsx` — non impacté, la correction est dans page.tsx
- `aureak/apps/web/app/(admin)/seances/_components/DayView.tsx` — non impacté
- `aureak/apps/web/app/(admin)/seances/_components/WeekView.tsx` — non impacté
- Tout fichier `@aureak/api-client`, `@aureak/types`, `@aureak/theme` — zéro impact backend/types

---

### Dépendances à protéger

- Aucune story existante ne dépend de la condition `period !== 'month' && period !== 'year'`
- Le bloc `period === 'day'` / `period === 'week'` / `period === 'month'` / `else` (YearView) dans page.tsx est simplement déplacé derrière la condition `filteredSessions.length > 0` — aucune logique modifiée

---

### Références

- Design tokens : `aureak/packages/theme/src/tokens.ts`
- Fichier cible : `aureak/apps/web/app/(admin)/seances/page.tsx` ligne 808
- Pattern empty state existant : `aureak/apps/web/app/(admin)/seances/page.tsx` lignes 808-826
- MonthView (non modifié) : `aureak/apps/web/app/(admin)/seances/_components/MonthView.tsx`
- YearView (non modifié) : `aureak/apps/web/app/(admin)/seances/_components/YearView.tsx`

---

### Multi-tenant

RLS gère l'isolation — aucun paramètre tenantId à ajouter. Cette story est purement UI, aucun appel Supabase nouveau.

## Dev Agent Record

### Agent Model Used
claude-sonnet-4-6

### Debug Log References
Aucun bug rencontré.

### Completion Notes List
- Modification minimale : une seule condition supprimée à la ligne 808
- Le bloc period=day/week/month/year reste intact, désormais uniquement atteint quand filteredSessions.length > 0
- QA: tous les console.* sont guardés par NODE_ENV, aucune couleur hardcodée introduite

### File List

| Fichier | Statut |
|---------|--------|
| `aureak/apps/web/app/(admin)/seances/page.tsx` | Modifié |
