# Story 72.11 : Remplacement des couleurs hardcodées dans la fiche séance par des tokens

Status: done

## Story

En tant qu'admin,
je veux que la fiche séance (`/seances/[sessionId]`) utilise exclusivement les tokens du design system,
afin qu'aucun code couleur hexadécimal n'échappe à la charte graphique AUREAK et que les évolutions futures de palette soient répercutées automatiquement.

## Acceptance Criteria

1. La constante `HEADER_BG = '#1A1A1A'` est supprimée et remplacée par `colors.dark.surface` ; la constante `HEADER_WHITE = '#FFFFFF'` est supprimée et remplacée par `colors.text.primary` partout dans le fichier.
2. Le badge statut `trial` (essai) utilise `colors.status.info` (fond `+ '40'`) et `colors.status.info` (texte) — plus aucune occurrence de `#6366F1` ou `#4F46E5`.
3. Les couleurs de présence dans `presenceColor` et dans la map `STATUS_BG` (`#10B981`, `#F59E0B`, `#E05252`) sont remplacées par `colors.status.success`, `colors.status.warning` et `colors.accent.red`.
4. Les bandeaux retard (`late*`) qui utilisent `#F59E0B` / `#D97706` / `#92400E` sont remplacés par `colors.status.warning`, `colors.status.warningText` et `colors.status.warningText`.
5. Les bandeaux succès qui utilisent `#D1FAE5` / `#6EE7B7` / `#065F46` sont remplacés par `colors.status.successBg`, `colors.status.successText` et leurs équivalents tokens.
6. Les bandeaux erreur (`#FEF2F2`, `#FEE2E2`, `#DC2626`) sont remplacés par `colors.status.errorBg`, `colors.status.errorBorderSevere`, `colors.status.errorText`.
7. Zéro occurrence de chaîne `'#` ou `"#` ne subsiste dans le fichier (sauf commentaires) après la story — vérifiable par `grep "'#\|\"#"` sur le fichier.
8. Aucune régression fonctionnelle : les couleurs de statut présence restent visuellement cohérentes (vert/ambre/rouge) et le badge essai reste distinguable des autres statuts.

## Tasks / Subtasks

- [x] T1 — Remplacer HEADER_BG / HEADER_WHITE (AC: 1)
  - [x] T1.1 — Supprimer les deux constantes lignes 56-57 dans `seances/[sessionId]/page.tsx`
  - [x] T1.2 — Remplacer toutes les références `HEADER_BG` par `colors.dark.surface` dans les StyleSheet du composant `MatchReportHeader` (ligne 166)
  - [x] T1.3 — Remplacer toutes les références `HEADER_WHITE` par `colors.text.primary` (si présentes)

- [x] T2 — Tokéniser le badge statut `trial` / essai (AC: 2)
  - [x] T2.1 — Dans la map `STATUS_BG` (lignes ~690-695), remplacer `'#6366F1' + '40'` par `colors.status.info + '40'` et `'#4F46E5'` (text) par `colors.status.info`
  - [x] T2.2 — Vérifier qu'aucune autre occurrence de `6366F1` ou `4F46E5` ne reste dans le fichier

- [x] T3 — Tokéniser les couleurs de présence (AC: 3)
  - [x] T3.1 — Dans le calcul `presenceColor` (lignes ~322-323), remplacer `'#10B981'` → `colors.status.success`, `'#F59E0B'` → `colors.status.warning`, `'#E05252'` → `colors.accent.red`
  - [x] T3.2 — Dans `STATUS_BG.present`, remplacer `'#10B981' + '40'` par `colors.status.success + '40'` et text `'#059669'` par `colors.status.successTextSub`
  - [x] T3.3 — Dans `STATUS_BG.absent`, remplacer `'#E05252' + '40'` par `colors.accent.red + '40'` et text `'#DC2626'` par `colors.status.errorText`
  - [x] T3.4 — Dans la barre de progression présence (ligne ~388), remplacer `presenceColor` inline par la variable déjà tokénisée (pas de changement supplémentaire si T3.1 est fait)

- [x] T4 — Tokéniser les bandeaux retard (`late*`) (AC: 4)
  - [x] T4.1 — Remplacer `'#F59E0B'` → `colors.status.warning` dans `bannerWrap`, `bannerHeader`, `lateWrap`, `lateBadge`, `lateAvatarBubble`, `lateTag` (lignes ~504-1016)
  - [x] T4.2 — Remplacer `'#D97706'` → `colors.status.warningText` dans `bannerTitle`, `bannerNames`, `lateTitle`, `lateAvatarText`, `lateBadgeText` et les compteurs inline (lignes ~510-1016)
  - [x] T4.3 — Remplacer `'#92400E'` → `colors.status.warningText` dans `dismissText` et textes associés (ligne ~521)

- [x] T5 — Tokéniser les bandeaux succès (AC: 5)
  - [x] T5.1 — Remplacer `'#D1FAE5'` → `colors.status.successBg` dans les blocs succès (lignes ~541, 1743)
  - [x] T5.2 — Remplacer `'#6EE7B7'` → `colors.status.successText` (utilisé comme borderColor)
  - [x] T5.3 — Remplacer `'#065F46'` → `colors.status.successText` dans tous les textes succès
  - [x] T5.4 — Remplacer `'#059669'` → `colors.status.successTextSub` (textes secondaires succès, ex. ligne 1022)

- [x] T6 — Tokéniser les bandeaux erreur (AC: 6)
  - [x] T6.1 — Remplacer `'#FEE2E2'` → `colors.status.errorBorderSevere` dans les fonds error (lignes ~1834, 2548)
  - [x] T6.2 — Remplacer `'#FEF2F2'` → `colors.status.errorBg` si présent (non présent dans le fichier)
  - [x] T6.3 — Remplacer `'#DC2626'` → `colors.status.errorText` dans tous les textes erreur (lignes ~1835, 1838, 1870, 2520)
  - [x] T6.4 — Remplacer `'#FEF3C7'` → `colors.status.warningBg` dans les blocs warning jaune (lignes ~504, 1844, 2548)

- [x] T7 — Tokéniser la couleur streak (AC: 3, 8)
  - [x] T7.1 — Remplacer `streakColor = '#F59E0B'` (ligne ~733) par `streakColor = colors.status.warning`

- [x] T8 — Validation finale (AC: 7, 8)
  - [x] T8.1 — Exécuter `grep -n "'#\|\"#" seances/[sessionId]/page.tsx` → zéro résultat hors commentaires ✅
  - [x] T8.2 — TypeScript noEmit passe sans erreurs ✅
  - [x] T8.3 — Badge `trial` tokénisé → `colors.status.info` (bleu ciel, distinct du vert/rouge) ✅

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

### T1 — Remplacement HEADER_BG / HEADER_WHITE

```tsx
// AVANT (lignes 56-57)
const HEADER_BG    = '#1A1A1A'
const HEADER_WHITE = '#FFFFFF'

// APRÈS — supprimer ces constantes et utiliser directement les tokens :
// backgroundColor: colors.dark.surface   (= '#1A1A1A' selon tokens.ts ligne 28)
// color:           colors.text.primary    (= '#FFFFFF' selon tokens.ts ligne 104)
```

Référence token : `aureak/packages/theme/src/tokens.ts` lignes 28 et 104.

---

### T2 — Badge trial/essai : violet anti-pattern → info token

```tsx
// AVANT
trial: { bg: '#6366F1' + '40', text: '#4F46E5', label: '👀 Essai' }

// APRÈS
trial: { bg: colors.status.info + '40', text: colors.status.info, label: '👀 Essai' }
```

`colors.status.info = '#60A5FA'` (bleu ciel) — neutre informationnel, non porteur de jugement de valeur.
Référence token : `aureak/packages/theme/src/tokens.ts` ligne 61.

---

### T3 — Présence / presenceColor / STATUS_BG

```tsx
// AVANT
const presenceColor =
  presenceRate >= 80 ? '#10B981' :
  presenceRate >= 60 ? '#F59E0B' : '#E05252'

// APRÈS
const presenceColor =
  presenceRate >= 80 ? colors.status.success :
  presenceRate >= 60 ? colors.status.warning : colors.accent.red
```

```tsx
// AVANT (STATUS_BG map ~690-695)
present   : { bg: '#10B981' + '40', text: '#059669', label: '✓ Présent'     },
absent    : { bg: '#E05252' + '40', text: '#DC2626', label: '✗ Absent'      },
late      : { bg: '#F59E0B' + '40', text: '#D97706', label: '⏱ En retard'   },
injured   : { bg: '#F59E0B' + '40', text: '#D97706', label: '🩹 Blessé'     },

// APRÈS
present   : { bg: colors.status.success + '40', text: colors.status.successTextSub, label: '✓ Présent'     },
absent    : { bg: colors.accent.red     + '40', text: colors.status.errorText,        label: '✗ Absent'      },
late      : { bg: colors.status.warning + '40', text: colors.status.warningText,      label: '⏱ En retard'   },
injured   : { bg: colors.status.warning + '40', text: colors.status.warningText,      label: '🩹 Blessé'     },
```

---

### T4-T6 — Bandeaux (retard / succès / erreur)

Mapping token exhaustif :

| Hex hardcodé | Token à utiliser | Contexte |
|---|---|---|
| `#F59E0B` | `colors.status.warning` | fond/bordure retard |
| `#D97706` | `colors.status.warningText` | texte retard |
| `#92400E` | `colors.status.warningText` | texte dismiss retard |
| `#FEF3C7` | `colors.status.warningBg` | fond bandeau warning |
| `#D1FAE5` | `colors.status.successBg` | fond bandeau succès |
| `#6EE7B7` | `colors.status.successText` | borderColor succès |
| `#065F46` | `colors.status.successText` | texte succès |
| `#059669` | `colors.status.successTextSub` | texte secondaire succès |
| `#FEE2E2` | `colors.status.errorBorderSevere` | fond erreur prononcé |
| `#DC2626` | `colors.status.errorText` | texte erreur |
| `#FFFFFF` (inline) | `colors.text.primary` | texte blanc |

---

### Design

**Type design** : `polish`

Tokens à utiliser :
```tsx
import { colors } from '@aureak/theme'

// Header séance
backgroundColor : colors.dark.surface        // '#1A1A1A'
color           : colors.text.primary         // '#FFFFFF'

// Badge essai
backgroundColor : colors.status.info + '40'  // bleu ciel semi-transparent
color           : colors.status.info          // '#60A5FA'

// Présence présent
backgroundColor : colors.status.success + '40'
color           : colors.status.successTextSub

// Présence absent
backgroundColor : colors.accent.red + '40'
color           : colors.status.errorText

// Présence retard / blessé
backgroundColor : colors.status.warning + '40'
color           : colors.status.warningText
```

Principes design à respecter :
- Zéro valeur hexadécimale en dehors des tokens — règle absolue du projet
- Le bleu info (`colors.status.info`) remplace le violet (#6366F1) pour les essais : neutre, non intrusif, AUREAK-conforme
- Les tokens sémantiques `success/warning/error` garantissent la cohérence visuelle inter-pages

---

### Fichiers à créer / modifier

| Fichier | Action | Notes |
|---------|--------|-------|
| `aureak/apps/web/app/(admin)/seances/[sessionId]/page.tsx` | Modifier | Remplacer toutes les occurrences de hex hardcodés par des tokens — aucune autre logique touchée |

### Fichiers à NE PAS modifier

- `aureak/packages/theme/src/tokens.ts` — tous les tokens nécessaires existent déjà, pas d'ajout requis
- `aureak/packages/types/src/entities.ts` — aucun type impacté
- `aureak/packages/api-client/src/` — aucune fonction API impactée
- Tout autre fichier du dossier `seances/` (`new.tsx`, `index.tsx`, `_components/`) — hors périmètre

---

### Dépendances à protéger

- La logique métier de calcul `presenceColor` (seuils 80/60) doit rester inchangée — seule la valeur de couleur change
- La map `STATUS_BG` est utilisée dans le rendu des badges présence — ne pas modifier les clés ni le `label`
- Les autres stories Epic 72 (`72-6`, `72-8`) modifient des fichiers différents (`TableauSeances.tsx`, `ActivitesHeader.tsx`) — aucun conflit

---

### Références

- Design tokens : `aureak/packages/theme/src/tokens.ts`
- Fichier cible : `aureak/apps/web/app/(admin)/seances/[sessionId]/page.tsx`
- Pattern de référence (même type de tokénisation) : `_bmad-output/implementation-artifacts/story-72-8-bug-couleurs-hardcodees-activites-header-presences.md`
- Story liée (même epic) : `_bmad-output/implementation-artifacts/story-72-10-bug-load-sans-await-dashboard.md`

---

### Multi-tenant

Aucun paramètre `tenantId` à ajouter — cette story ne touche que le rendu visuel côté client. Le RLS Supabase gère l'isolation des données en amont.

## Dev Agent Record

### Agent Model Used
claude-sonnet-4-6

### Debug Log References
Aucun

### Completion Notes List
- Suppression des constantes HEADER_BG / HEADER_WHITE → remplacées par colors.dark.surface / colors.text.primary
- SQUAD_STATUS_COLORS entièrement tokénisée (present/absent/late/injured/trial/unconfirmed)
- presenceColor tokénisée (success/warning/accent.red selon seuils 80/60%)
- Bandeaux retard (banner + lateZone) tokénisés avec colors.status.warning + warningText + warningBg
- Toast succès tokénisé avec colors.status.successBg + successText + successTextSub
- Blocs erreur tokénisés avec colors.status.errorBorderSevere + errorText
- Blocs warning inline tokénisés avec colors.status.warningBg + warningText
- Fallbacks `colors.accent.red ?? '#E05252'` supprimés (redondants — token défini)
- zéro `'#` ou `"#` subsistant dans le fichier après implémentation
- TypeScript passe sans erreurs (noEmit --skipLibCheck)

### File List

| Fichier | Statut |
|---------|--------|
| `aureak/apps/web/app/(admin)/seances/[sessionId]/page.tsx` | Modifié |
