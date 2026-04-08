# Story 75.5 : Bug — presences/page.tsx — hex hardcodés getCellStyle + métrique '+12%' fictive

Status: done

## Story

En tant qu'admin consultant la page Présences (onglet Activités),
je veux que la heatmap utilise les tokens de couleur officiels et que la métrique de tendance ne s'affiche que lorsque les données sont suffisantes,
afin que le design system reste cohérent et qu'aucune valeur fictive ne soit présentée comme une métrique réelle.

## Acceptance Criteria

1. La fonction `getCellStyle` dans `aureak/apps/web/app/(admin)/activites/presences/page.tsx` ne contient aucune valeur hexadécimale hardcodée — chaque `bg` et `text` retourné utilise un token `colors.*` importé de `@aureak/theme`.
2. Les 5 valeurs hardcodées `#22c55e`, `#eab308`, `#f97316`, `#ef4444`, `#ffffff` sont remplacées par les tokens sémantiques correspondants : `colors.status.present`, `colors.status.attention`, `colors.status.warning`, `colors.status.absent`, `colors.text.primary`.
3. La Card "Tendance Global" (Stat Card 4) n'affiche PAS le badge ou la valeur de tendance si `stats.totalSessions < 4` — elle affiche `—` et le sous-texte "Données insuffisantes".
4. Lorsque `stats.totalSessions >= 4`, la tendance calculée (delta entre les 3 dernières séances et la moyenne globale) s'affiche correctement avec son signe (`+` ou vide) et l'unité `pts`.
5. Un `grep` sur `#[0-9a-fA-F]{3,6}` dans le fichier `activites/presences/page.tsx` retourne zéro résultat hors commentaires `//`.
6. Le rendu visuel de la heatmap est fonctionnel après le fix : les cellules colorées reflètent les taux réels et les couleurs sont distinctement différenciées par seuil (vert ≥90%, jaune 70-90%, orange 60-70%, rouge <60%).

## Tasks / Subtasks

- [x] T1 — Remplacer les hex hardcodés dans `getCellStyle` (AC: 1, 2, 5, 6)
  - [x] T1.1 — Lire `aureak/apps/web/app/(admin)/activites/presences/page.tsx` lignes 60-80 pour vérifier l'état actuel de `getCellStyle`
  - [x] T1.2 — Remplacer `#22c55e` par `colors.status.present` (vert présence, ≥90%)
  - [x] T1.3 — Remplacer `#eab308` par `colors.status.attention` (jaune attention, 70-89%)
  - [x] T1.4 — Remplacer `#f97316` par `colors.status.warning` (orange alerte, 60-69%)
  - [x] T1.5 — Remplacer `#ef4444` par `colors.status.absent` (rouge absent, <60%)
  - [x] T1.6 — Remplacer `#ffffff` (text color) par `colors.text.primary`
  - [x] T1.7 — Vérifier que l'import `colors` depuis `@aureak/theme` est présent en ligne 1-20

- [x] T2 — Corriger la condition d'affichage de la tendance (AC: 3, 4)
  - [x] T2.1 — Lire la Stat Card 4 "Tendance Global" dans `StatCardsPresences` (env. ligne 130-180)
  - [x] T2.2 — Changer le seuil d'affichage : remplacer `stats.totalSessions >= 2` par `stats.totalSessions >= 4` pour masquer la tendance si données insuffisantes
  - [x] T2.3 — Vérifier que le sous-texte "Données insuffisantes" s'affiche bien quand `totalSessions < 4`
  - [x] T2.4 — Vérifier que la valeur `trendDisplay` (ex: `+3.2`) s'affiche bien avec `pts vs moyenne période` quand `totalSessions >= 4`

- [x] T3 — QA scan et validation (AC: tous)
  - [x] T3.1 — Grep final : `grep -n "#[0-9a-fA-F]" aureak/apps/web/app/(admin)/activites/presences/page.tsx | grep -v "//"` → zéro résultat
  - [ ] T3.2 — Naviguer vers `/activites` puis onglet Présences → vérifier que les cellules heatmap affichent des couleurs différenciées
  - [ ] T3.3 — Vérifier la Card "Tendance Global" avec moins de 4 séances → doit afficher `—` + "Données insuffisantes"
  - [ ] T3.4 — Vérifier console → zéro erreur JS

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

### T1 — Mapping hex → tokens (getCellStyle)

Les 5 hex hardcodés et leurs remplacements exacts dans `@aureak/theme/src/tokens.ts` :

| Valeur hardcodée | Rôle sémantique       | Token de remplacement      | Valeur token   |
|------------------|-----------------------|----------------------------|----------------|
| `#22c55e`        | vert haut taux ≥90%   | `colors.status.present`    | `#4CAF50`      |
| `#eab308`        | jaune 70-89%          | `colors.status.attention`  | `#FFC107`      |
| `#f97316`        | orange 60-69%         | `colors.status.warning`    | `#F59E0B`      |
| `#ef4444`        | rouge <60%            | `colors.status.absent`     | `#F44336`      |
| `#ffffff`        | texte sur fond coloré | `colors.text.primary`      | `#FFFFFF`      |

Code cible après fix :

```tsx
function getCellStyle(rate: number): { bg: string; text: string } {
  // Figma heatmap seuils — tokens @aureak/theme uniquement
  if (rate >= 90) return { bg: colors.status.present,   text: colors.text.primary }
  if (rate >= 70) return { bg: colors.status.attention, text: colors.text.primary }
  if (rate >= 60) return { bg: colors.status.warning,   text: colors.text.primary }
  return               { bg: colors.status.absent,    text: colors.text.primary }
}
```

Référence tokens : `aureak/packages/theme/src/tokens.ts` lignes 55-78

---

### T2 — Condition d'affichage tendance (seuil ≥4 séances)

La tendance est calculée sur les 3 dernières séances vs la moyenne globale. Avec seulement 2 séances, le calcul produit une valeur peu fiable (1 séance "récente" sur 2). Un minimum de 4 séances est requis pour que la tendance soit significative.

Avant (incorrect — affiche tendance dès 2 séances) :
```tsx
{stats.totalSessions >= 2 ? trendDisplay : '—'}
...
{stats.totalSessions >= 2 ? 'pts vs moyenne période' : 'Données insuffisantes'}
```

Après (correct — masquer si < 4 séances) :
```tsx
{stats.totalSessions >= 4 ? trendDisplay : '—'}
...
{stats.totalSessions >= 4 ? 'pts vs moyenne période' : 'Données insuffisantes'}
```

Référence pattern story 74-2 : `_bmad-output/implementation-artifacts/story-74-2-bug-statcards-badges-fictifs.md` — même principe appliqué aux StatCards des séances.

---

### Design

**Type design** : `polish`

Tokens à utiliser (getCellStyle) :
```tsx
import { colors } from '@aureak/theme'

// Heatmap taux présence
bg: colors.status.present    // ≥90% — vert présence
bg: colors.status.attention  // 70-89% — jaune attention
bg: colors.status.warning    // 60-69% — orange alerte
bg: colors.status.absent     // <60% — rouge absent
text: colors.text.primary    // texte sur toutes les cellules colorées
```

Principes design à respecter :
- Couleurs sémantiques issues du token system — jamais hardcodées
- Données fictives ou insuffisantes → masquage ou indicateur neutre `—`

---

### Fichiers à créer / modifier

| Fichier | Action | Notes |
|---------|--------|-------|
| `aureak/apps/web/app/(admin)/activites/presences/page.tsx` | Modifier | getCellStyle tokens + seuil tendance ≥4 |

### Fichiers à NE PAS modifier

- `aureak/packages/theme/src/tokens.ts` — tokens existants suffisants, aucun ajout requis
- `aureak/apps/web/app/(admin)/activites/presences/index.tsx` — re-export uniquement, non impacté
- `aureak/apps/web/app/(admin)/activites/components/ActivitesHeader.tsx` — déjà traité story 72-8
- Tout autre fichier présences (admin/presences/, analytics/presences/) — non concerné par cette story

---

### Dépendances à protéger

- La signature de `getCellStyle(rate: number)` doit rester identique — retourne `{ bg: string; text: string }`
- Les appelants `getCellStyle` à la ligne ~388 (`TableauGroupes`) ne doivent pas être modifiés
- `getDotColor` (fonction voisine) est indépendante — ne pas modifier

---

### Références

- Design tokens : `aureak/packages/theme/src/tokens.ts` lignes 55-78 (`colors.status.*`)
- Fichier cible : `aureak/apps/web/app/(admin)/activites/presences/page.tsx`
- Pattern de référence tendance : `_bmad-output/implementation-artifacts/story-74-2-bug-statcards-badges-fictifs.md`
- Story similaire (hex dans presences) : `_bmad-output/implementation-artifacts/story-72-8-bug-couleurs-hardcodees-activites-header-presences.md`

---

### Multi-tenant

Aucune implication tenant — fix purement UI/tokens, pas de requête DB.

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List

| Fichier | Statut |
|---------|--------|
| `aureak/apps/web/app/(admin)/activites/presences/page.tsx` | À modifier |
