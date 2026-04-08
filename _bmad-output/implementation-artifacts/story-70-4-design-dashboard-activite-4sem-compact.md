# Story 70.4 : Design — Activité 4 semaines carte compacte

Status: done

## Story

En tant qu'admin,
je veux que la carte "Activité — 4 semaines" soit plus compacte verticalement,
afin qu'elle ne domine pas visuellement la colonne centrale et laisse de l'espace pour les autres sections.

## Acceptance Criteria

1. Le padding de la carte passe de `'16px 20px'` à `'12px 16px'`
2. Le titre "Activité — 4 semaines" passe de `fontSize: 11` à `fontSize: 10` — reste en uppercase avec letterSpacing
3. Le `marginBottom: 14` sous le titre passe à `marginBottom: 10`
4. Le `marginBottom: 10` entre les deux barres de progression passe à `marginBottom: 8`
5. La hauteur des barres de progression reste à `6px` (inchangé)
6. La card reste sur fond `colors.light.surface`, border `colors.border.light`, shadow `shadows.sm` — structure identique
7. TypeScript compile sans erreur

## Tasks / Subtasks

- [ ] T1 — Compacter la carte Activité 4 semaines (AC: 1, 2, 3, 4)
  - [ ] T1.1 — Dans `dashboard/page.tsx`, trouver le bloc `{/* ── Card Activité 4 semaines ── */}` (ligne ~2808)
  - [ ] T1.2 — Modifier `padding: '16px 20px'` → `padding: '12px 16px'` sur le div wrapper de la card
  - [ ] T1.3 — Modifier `fontSize: 11` → `fontSize: 10` sur le div titre "Activité — 4 semaines"
  - [ ] T1.4 — Modifier `marginBottom: 14` → `marginBottom: 10` sur le div titre
  - [ ] T1.5 — Modifier `marginBottom: 10` → `marginBottom: 8` sur le premier bloc barre (Présence)

- [ ] T2 — Validation (AC: tous)
  - [ ] T2.1 — `npx tsc --noEmit` = 0 erreurs
  - [ ] T2.2 — Naviguer sur `/dashboard` : la card Activité 4 semaines est visuellement plus compacte sans que les barres soient tronquées

## Dev Notes

### ⚠️ Contraintes Stack

HTML/JSX natif. Modifications de style uniquement — aucune logique à toucher.

---

### T1 — Cible exacte

```tsx
// Card wrapper — AVANT
<div style={{
  backgroundColor: colors.light.surface,
  borderRadius   : radius.card,
  border         : `1px solid ${colors.border.light}`,
  boxShadow      : shadows.sm,
  padding        : '16px 20px',   // ← changer ici
}}>
  <div style={{ fontSize: 11, fontWeight: 700, ..., marginBottom: 14, ... }}>  // ← fontSize 11→10, marginBottom 14→10
    Activité — 4 semaines
  </div>
  <div style={{ marginBottom: 10 }}>    // ← changer en marginBottom: 8
    ...Présence bar...
  </div>

// Card wrapper — APRÈS
<div style={{
  backgroundColor: colors.light.surface,
  borderRadius   : radius.card,
  border         : `1px solid ${colors.border.light}`,
  boxShadow      : shadows.sm,
  padding        : '12px 16px',
}}>
  <div style={{ fontSize: 10, fontWeight: 700, ..., marginBottom: 10, ... }}>
    Activité — 4 semaines
  </div>
  <div style={{ marginBottom: 8 }}>
    ...Présence bar...
  </div>
```

---

### Fichiers à créer / modifier

| Fichier | Action | Notes |
|---------|--------|-------|
| `aureak/apps/web/app/(admin)/dashboard/page.tsx` | Modifier | Style card Activité 4 semaines |

### Fichiers à NE PAS modifier

- Aucun autre fichier — style uniquement

---

### Références

- Card Activité 4 semaines : `dashboard/page.tsx` ligne ~2808
- Design ref : `_bmad-output/design-references/dashboard-redesign.png`

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
| `aureak/apps/web/app/(admin)/dashboard/page.tsx` | À modifier |
