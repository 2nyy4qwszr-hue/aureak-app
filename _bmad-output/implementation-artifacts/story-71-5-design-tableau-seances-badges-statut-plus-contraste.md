# Story 71.5 : Design — Tableau Séances : badges statut première colonne plus contrastés

Status: done

## Story

En tant qu'admin,
je veux que les badges de statut dans la première colonne du tableau de séances soient plus denses et contrastés,
afin de mieux distinguer visuellement les statuts (Réalisée / Planifiée / En cours / Annulée / Reportée).

## Acceptance Criteria

1. Les fonds des badges statut passent d'une opacité légère à une opacité plus forte — chaque `Bg` token est remplacé par la couleur pleine avec alpha plus élevé (voir tokens cibles ci-dessous)
2. Le texte des badges passe à `fontWeight: '700'` (au lieu de `'600'`) pour plus de contraste
3. Les badges gardent leur `borderRadius: radius.badge` et leur `paddingHorizontal: 8, paddingVertical: 3`
4. La largeur de la colonne STATUS dans le tableau est suffisante pour afficher le badge sans troncature (vérifier `COL_WIDTHS.status` dans `TableauSeances.tsx`)
5. La couleur des textes reste sur les tokens existants (`colors.status.successText`, `colors.status.errorText`, etc.)
6. TypeScript compile sans erreur

## Tasks / Subtasks

- [x] T1 — Renforcer les fonds des badges statut (AC: 1, 2)
  - [x] T1.1 — Dans `TableauSeances.tsx`, trouver `STATUS_CONFIG` (ligne ~65)
  - [x] T1.2 — Modifier les valeurs `bg` pour utiliser des couleurs plus denses :
    - `réalisée/terminée` : `bg: colors.status.successBg` → garder mais vérifier si `colors.status.successBg` est suffisamment contrasté — si non, utiliser `colors.status.present + '35'`
    - `planifiée` : `bg: colors.status.infoBg` → `colors.status.info + '25'` (plus dense)
    - `en_cours` : `bg: colors.border.goldBg` → `colors.accent.gold + '40'` (plus visible)
    - `annulée` : `bg: colors.status.errorBg` → garder ou `colors.status.absent + '30'`
    - `reportée` : `bg: colors.status.orangeBg` → garder ou `colors.status.attention + '30'`
  - [x] T1.3 — Dans `StatusBadge`, modifier `fontWeight: '600'` → `'700'`

- [x] T2 — Vérifier la largeur colonne STATUS (AC: 4)
  - [x] T2.1 — Dans `TableauSeances.tsx`, trouver `COL_WIDTHS` (ou équivalent) et vérifier que `status` a au moins `80` de largeur pour éviter la troncature du label "Planifiée" ou "Réalisée"

- [x] T3 — Validation (AC: tous)
  - [x] T3.1 — `npx tsc --noEmit` = 0 erreurs
  - [x] T3.2 — Naviguer sur `/activites` : vérifier que les badges statut sont plus visibles/contrastés dans la première colonne
  - [x] T3.3 — Vérifier qu'aucun badge n'est tronqué

## Dev Notes

### ⚠️ Contraintes Stack

React Native Web (View, StyleSheet). `TableauSeances.tsx` utilise StyleSheet + inline styles.

---

### T1 — `STATUS_CONFIG` cible

```tsx
// AVANT
const STATUS_CONFIG: Record<string, StatusConfig> = {
  'réalisée' : { label: 'Réalisée',  bg: colors.status.successBg, text: colors.status.successText },
  'terminée' : { label: 'Réalisée',  bg: colors.status.successBg, text: colors.status.successText },
  'planifiée': { label: 'Planifiée', bg: colors.status.infoBg,    text: colors.status.infoText    },
  'en_cours' : { label: 'En cours',  bg: colors.border.goldBg,    text: colors.text.dark          },
  'annulée'  : { label: 'Annulée',   bg: colors.status.errorBg,   text: colors.status.errorText   },
  'reportée' : { label: 'Reportée',  bg: colors.status.orangeBg,  text: colors.status.orangeText  },
}

// APRÈS — fonds plus denses
const STATUS_CONFIG: Record<string, StatusConfig> = {
  'réalisée' : { label: 'Réalisée',  bg: colors.status.present + '30',   text: colors.status.successText },
  'terminée' : { label: 'Réalisée',  bg: colors.status.present + '30',   text: colors.status.successText },
  'planifiée': { label: 'Planifiée', bg: colors.status.info    + '30',   text: colors.status.infoText    },
  'en_cours' : { label: 'En cours',  bg: colors.accent.gold    + '45',   text: colors.text.dark          },
  'annulée'  : { label: 'Annulée',   bg: colors.status.absent  + '30',   text: colors.status.errorText   },
  'reportée' : { label: 'Reportée',  bg: colors.status.attention + '30', text: colors.status.orangeText  },
}
```

> Note : les suffixes hex `+ '30'` = alpha ~19%, `+ '45'` = alpha ~27%. Ajuster visuellement si trop ou pas assez dense.

---

### T2 — `COL_WIDTHS` (si présent)

Chercher dans `TableauSeances.tsx` la définition des largeurs de colonnes. Si la colonne `status` est inférieure à 80, la passer à 80.

---

### Fichiers à créer / modifier

| Fichier | Action | Notes |
|---------|--------|-------|
| `aureak/apps/web/app/(admin)/activites/components/TableauSeances.tsx` | Modifier | `STATUS_CONFIG` fonds + fontWeight badge |

### Fichiers à NE PAS modifier

- `aureak/apps/web/app/(admin)/activites/components/StatCards.tsx` — couvert par 71-1
- `supabase/migrations/` — aucune migration

---

### Références

- `STATUS_CONFIG` : `TableauSeances.tsx` ligne ~65
- `StatusBadge` : `TableauSeances.tsx` ligne ~74
- Design ref : `_bmad-output/design-references/Activites seances-redesign.png` (colonne STATUT visible)

---

### Multi-tenant

Sans objet.

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List

| Fichier | Statut |
|---------|--------|
| `aureak/apps/web/app/(admin)/activites/components/TableauSeances.tsx` | À modifier |
