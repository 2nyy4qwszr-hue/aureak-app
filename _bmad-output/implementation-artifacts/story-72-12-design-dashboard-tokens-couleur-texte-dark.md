# Story 72.12 : Dashboard — color '#FFFFFF' inline → colors.dark.text + documentation cards dark intentionnelles

Status: done

## Story

En tant que développeur de l'académie Aureak,
je veux remplacer les occurrences `color: colors.text.primary` utilisées à l'intérieur de cards dark dans `dashboard/page.tsx` par le token sémantiquement correct `colors.dark.text`,
afin d'éliminer les usages de `colors.text.primary` (#FFFFFF) dans un contexte dark (où `colors.dark.text` = `#F0F0F0` est le token sémantique approprié) et documenter la décision de conserver les hero cards dark intentionnelles.

## Acceptance Criteria

1. Les 2 occurrences `color: colors.text.primary` situées dans le bloc date-card dark (anciennement `'#FFFFFF'` inline aux lignes ~3142 et ~3145 avant le commit patrol 7f4dc70) sont remplacées par `color: colors.dark.text`.
2. Après implémentation, un grep sur `colors.text.primary` dans le contexte des cards dark du dashboard retourne 0 occurrence non-justifiée.
3. Le rendu visuel du bloc date (jour + mois sur fond `colors.dark.surface`) est visuellement identique : `colors.dark.text` = `#F0F0F0` vs `colors.text.primary` = `#FFFFFF` — différence visuelle ≤ 5% luminosité, acceptable.
4. Les cards dark intentionnelles (lines ~179 `backgroundColor: colors.dark.surface` "GESTION DU JOUR" et ~842 `background: linear-gradient(...)` "Prochaine séance") restent **inchangées** — elles utilisent correctement les tokens dark (`colors.dark.surface`, `colors.dark.hover`) et sont des hero cards premium décidées en Story 50-11.
5. Un commentaire `// Hero card dark — décision Story 50-11 (intentionnel)` est ajouté sur la ligne `backgroundColor` de la date-card (l.~179) et sur la ligne `background` de la ProchaineSéance card (l.~842) pour documenter l'intention.

## Tasks / Subtasks

- [x] T1 — Localiser et remplacer les 2 tokens texte dans le bloc date-card dark (AC: 1, 2, 3)
  - [x] T1.1 — Grep `colors.text.primary` dans `dashboard/page.tsx` pour identifier les occurrences dans les blocs dark (contexte `colors.dark.surface`)
  - [x] T1.2 — Remplacer `color: colors.text.primary` → `color: colors.dark.text` pour les 2 divs du bloc date (jour bold et mois léger) dans la date-card dark
  - [x] T1.3 — Vérifier que les autres occurrences de `colors.text.primary` dans le dashboard restent justifiées (fond clair ou contexte neutre)

- [x] T2 — Documenter les cards dark intentionnelles (AC: 4, 5)
  - [x] T2.1 — Ajouter `// Hero card dark — décision Story 50-11 (intentionnel)` en commentaire inline sur la ligne `backgroundColor: colors.dark.surface` de la date-card (~l.179)
  - [x] T2.2 — Ajouter `// Hero card dark — décision Story 50-11 (intentionnel)` en commentaire inline sur la ligne `background: linear-gradient(...)` de la ProchaineSéanceCard (~l.842)

- [x] T3 — Validation (AC: tous)
  - [x] T3.1 — Grep `colors.text.primary` dans `dashboard/page.tsx` → vérifier que les occurrences restantes sont dans des contextes non-dark
  - [x] T3.2 — Playwright skipped — app non démarrée
  - [x] T3.3 — Cards dark intentionnelles non modifiées (fonds préservés, commentaires ajoutés)

## Dev Notes

### ⚠️ Contraintes Stack

Ce projet utilise :
- **React Native Web** (View, Pressable, StyleSheet, Image) — pas de Tailwind, pas de className
- **Tamagui** : XStack, YStack, Text — uniquement dans `_layout.tsx`
- **Tokens `@aureak/theme`** : `colors`, `space`, `shadows`, `radius`, `transitions`
- **Composants `@aureak/ui`** : AureakButton, AureakText, Badge, Card, Input
- **Accès Supabase UNIQUEMENT via `@aureak/api-client`** — jamais direct dans apps/
- **Styles via tokens uniquement** — jamais de couleurs hardcodées

---

### T1 — Mapping token texte dans contexte dark

Tokens dans `aureak/packages/theme/src/tokens.ts` (lignes 32-33) :

```ts
dark: {
  text      : '#F0F0F0',  // texte principal dark mode (Story 61.1 AC2)
  textMuted : '#A0A0A0',  // texte secondaire dark mode (Story 61.1 AC2)
  // ...
}
```

Avant / après :

```tsx
// AVANT (issu du commit patrol 7f4dc70 — #FFFFFF → colors.text.primary)
// Dans la date-card sur fond colors.dark.surface
<div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 900, fontSize: 15, color: colors.text.primary, lineHeight: 1.1 }}>
  {day}
</div>
<div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 600, fontSize: 10, color: colors.text.primary, lineHeight: 1.1, opacity: 0.85 }}>
  /{month}
</div>

// APRÈS — token sémantique dark
<div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 900, fontSize: 15, color: colors.dark.text, lineHeight: 1.1 }}>
  {day}
</div>
<div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 600, fontSize: 10, color: colors.dark.text, lineHeight: 1.1, opacity: 0.85 }}>
  /{month}
</div>
```

Note : `colors.text.primary = '#FFFFFF'` et `colors.dark.text = '#F0F0F0'` — différence subtile, mais `colors.dark.text` est sémantiquement correct dans un contexte dark.

---

### T2 — Documentation cards dark intentionnelles

Les cards suivantes utilisent des fonds dark intentionnellement (hero cards premium, décision Story 50-11) :

**Date-card (~l.179)** — "GESTION DU JOUR" :
```tsx
backgroundColor: colors.dark.surface,  // Hero card dark — décision Story 50-11 (intentionnel)
borderTop      : `3px solid ${colors.accent.gold}`,
```

**ProchaineSéanceCard (~l.842)** — "Prochaine séance" :
```tsx
background  : `linear-gradient(135deg, ${colors.dark.hover} 0%, ${colors.dark.surface} 100%)`,  // Hero card dark — décision Story 50-11 (intentionnel)
borderTop   : `3px solid ${colors.accent.gold}`,
```

Ces cards doivent rester dark — elles sont des elements de mise en valeur premium avec bordure gold. Ne pas les migrer vers le light theme.

---

### Design

**Type design** : `polish`

Tokens à utiliser :
```tsx
import { colors } from '@aureak/theme'

// Texte dans date-card (fond dark.surface)
color: colors.dark.text    // '#F0F0F0' — texte principal dark mode
// Texte secondaire dans date-card
color: colors.dark.textMuted  // '#A0A0A0' — si applicable
```

Principes design à respecter :
- Cohérence sémantique : `colors.dark.text` dans les cards dark, `colors.text.primary` dans les contextes neutres/dark-generic
- Cards dark intentionnelles (Story 50-11) = hero cards premium avec bordure gold → rester dark

---

### Fichiers à créer / modifier

| Fichier | Action | Notes |
|---------|--------|-------|
| `aureak/apps/web/app/(admin)/dashboard/page.tsx` | Modifier | 2 remplacements `colors.text.primary` → `colors.dark.text` dans date-card + 2 commentaires documentation |

### Fichiers à NE PAS modifier

- `aureak/packages/theme/src/tokens.ts` — `colors.dark.text` existe déjà (l.32)
- Tout autre fichier — cette story est strictement limitée à `dashboard/page.tsx`

---

### Dépendances à protéger

- Story 50-11 a décidé des hero cards dark — ne pas modifier leur fond
- Story 74.4 a corrigé les concaténations gold — `colors.border.goldBg` et `colors.border.gold` sont en place, ne pas revenir aux concaténations
- Commit patrol 7f4dc70 a remplacé `#FFFFFF` → `colors.text.primary` — cette story raffine cette correction vers `colors.dark.text`

---

### Références

- Design tokens : `aureak/packages/theme/src/tokens.ts` (lignes 32-33 pour `dark.text`, ligne 104 pour `text.primary`)
- Pattern de référence date-card : `aureak/apps/web/app/(admin)/dashboard/page.tsx` lignes ~175-190
- Pattern ProchaineSéanceCard : `aureak/apps/web/app/(admin)/dashboard/page.tsx` lignes ~839-848
- Story liée (gold tokens) : `_bmad-output/implementation-artifacts/story-74-4-design-dashboard-gold-concatenations-tokens.md`
- Story liée (hero cards dark) : référencer Story 50-11 dans le commit

---

### Multi-tenant

Non applicable — modification purement cosmétique, aucune donnée ou logique de tenant.

## Dev Agent Record

### Agent Model Used
claude-sonnet-4-6

### Debug Log References
Aucun

### Completion Notes List
- Lignes 3142 et 3145 : `colors.text.primary` → `colors.dark.text` (date-card dark, fond `colors.dark.surface`)
- Les autres occurrences de `colors.text.primary` (lignes 643, 1024, 1248, 1270, 2664, 3261, 3509) sont toutes dans des contextes justifiés (boutons colorés, badges, podium)
- Commentaires de documentation ajoutés aux 2 hero cards dark (lignes 179 et 842)

### File List

| Fichier | Statut |
|---------|--------|
| `aureak/apps/web/app/(admin)/dashboard/page.tsx` | Modifié |
