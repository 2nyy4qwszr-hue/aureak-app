# Story 70.3 : Design — Stats Joueurs/Coachs/Groupes/Sites couleur dorée uniforme

Status: done

## Story

En tant qu'admin,
je veux que les 4 chiffres Joueurs / Coachs / Groupes / Sites utilisent tous la même couleur gold,
afin d'avoir un look épuré sans explosion de couleurs dans la ligne de stats.

## Acceptance Criteria

1. Les 4 valeurs (Joueurs, Coachs, Groupes, Sites) utilisent toutes `colors.accent.gold` comme couleur de chiffre — plus de vert/bleu/couleurs distinctes
2. Les labels sous les chiffres (JOUEURS, COACHS, GROUPES, SITES) restent en `colors.text.muted`
3. La structure de la card (fond blanc, bordures, shadow) est inchangée
4. La ligne de séparation verticale entre les 4 blocs reste en `colors.border.divider`
5. TypeScript compile sans erreur

## Tasks / Subtasks

- [ ] T1 — Uniformiser les couleurs (AC: 1, 2)
  - [ ] T1.1 — Dans `dashboard/page.tsx`, ligne ~2788, trouver le tableau de mapping `[{ label: 'Joueurs', value: ..., color: colors.status.present }, { label: 'Coachs', ..., color: colors.entity.coach }, { label: 'Groupes', ..., color: colors.entity.club }, { label: 'Sites', ..., color: colors.accent.gold }]`
  - [ ] T1.2 — Remplacer les 3 premières `color` par `colors.accent.gold` : Joueurs → `colors.accent.gold`, Coachs → `colors.accent.gold`, Groupes → `colors.accent.gold`. Sites reste `colors.accent.gold` (inchangé).
  - [ ] T1.3 — La propriété `color` dans le tableau peut être retirée si tous sont identiques, ou simplifiée : passer une couleur fixe `colors.accent.gold` directement dans le style du div valeur sans passer par le tableau.

- [ ] T2 — Validation (AC: tous)
  - [ ] T2.1 — `npx tsc --noEmit` = 0 erreurs
  - [ ] T2.2 — Naviguer sur `/dashboard` : les 4 chiffres sont tous dorés, les labels restent en gris muted

## Dev Notes

### ⚠️ Contraintes Stack

HTML/JSX natif dans `dashboard/page.tsx`. Tokens `@aureak/theme` uniquement.

---

### T1 — Pattern simplifié

```tsx
// AVANT
{[
  { label: 'Joueurs',  value: countVal(childrenTotal), color: colors.status.present },
  { label: 'Coachs',  value: countVal(coachesTotal),  color: colors.entity.coach   },
  { label: 'Groupes', value: countVal(groupsTotal),   color: colors.entity.club    },
  { label: 'Sites',   value: stats.length > 0 ? stats.length : '—', color: colors.accent.gold },
].map(({ label, value, color }, idx, arr) => (
  <div key={label} style={{ ... }}>
    <div style={{ fontSize: 22, fontWeight: 900, color, ... }}>{value}</div>
    <div style={{ fontSize: 11, color: colors.text.muted, ... }}>{label}</div>
  </div>
))}

// APRÈS — retirer color du tableau, passer colors.accent.gold directement
{[
  { label: 'Joueurs',  value: countVal(childrenTotal) },
  { label: 'Coachs',   value: countVal(coachesTotal)  },
  { label: 'Groupes',  value: countVal(groupsTotal)   },
  { label: 'Sites',    value: stats.length > 0 ? stats.length : '—' },
].map(({ label, value }, idx, arr) => (
  <div key={label} style={{ flex: 1, textAlign: 'center', borderRight: idx < arr.length - 1 ? `1px solid ${colors.border.divider}` : 'none' }}>
    <div style={{ fontSize: 22, fontWeight: 900, color: colors.accent.gold, fontFamily: 'Montserrat, sans-serif', lineHeight: 1 }}>
      {value}
    </div>
    <div style={{ fontSize: 11, color: colors.text.muted, textTransform: 'uppercase', letterSpacing: 1, marginTop: 4, fontFamily: 'Montserrat, sans-serif' }}>
      {label}
    </div>
  </div>
))}
```

---

### Fichiers à créer / modifier

| Fichier | Action | Notes |
|---------|--------|-------|
| `aureak/apps/web/app/(admin)/dashboard/page.tsx` | Modifier | Uniformiser couleurs stats ligne |

### Fichiers à NE PAS modifier

- `aureak/packages/theme/src/tokens.ts` — tokens inchangés
- `supabase/migrations/` — aucune migration

---

### Références

- Stats row : `dashboard/page.tsx` ligne ~2787
- Design ref : `_bmad-output/design-references/dashboard-redesign.png` (chiffres 247 / 8 / 14 / 3)

---

### Multi-tenant

RLS gère l'isolation. Aucun changement.

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List

| Fichier | Statut |
|---------|--------|
| `aureak/apps/web/app/(admin)/dashboard/page.tsx` | À modifier |
