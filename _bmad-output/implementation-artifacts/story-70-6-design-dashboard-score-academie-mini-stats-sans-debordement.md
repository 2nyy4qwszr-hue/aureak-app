# Story 70.6 : Design — Score Académie : mini-stats sans débordement de carte

Status: done

## Story

En tant qu'admin,
je veux que les 3 mini-tiles (Présence / Progression / Activité) du Score Académie ne débordent pas de la carte,
afin que la card soit propre et contenue dans ses dimensions.

## Acceptance Criteria

1. La card `AcademyScoreTile` a `overflow: 'hidden'` sur son wrapper principal
2. Les 3 mini-tiles (flex row) utilisent `gap: 6` au lieu de `gap: 8` pour réduire l'espacement
3. Chaque mini-tile a `padding: '6px 8px'` au lieu de `'8px 10px'`
4. L'icône emoji dans chaque mini-tile passe de `fontSize: 14` à `fontSize: 12`
5. La valeur % de chaque mini-tile passe de `fontSize: 14` à `fontSize: 13`
6. Le label (Présence / Progression / Activité) reste en `typography.caption.size` mais avec `lineHeight: 1.2` pour ne pas déborder
7. Les 3 mini-tiles sont contraints à `flex: 1, minWidth: 0` pour respecter le conteneur
8. TypeScript compile sans erreur

## Tasks / Subtasks

- [ ] T1 — Ajouter overflow hidden sur la card wrapper (AC: 1)
  - [ ] T1.1 — Dans `AcademyScoreTile` (ligne ~1684), sur le div wrapper principal de la card : ajouter `overflow: 'hidden'`

- [ ] T2 — Compacter les mini-tiles (AC: 2, 3, 4, 5, 6, 7)
  - [ ] T2.1 — Ligne ~1809, trouver le div flex row `{ display: 'flex', gap: 8 }` — changer `gap: 8` → `gap: 6`
  - [ ] T2.2 — Sur chaque mini-tile (les 3 div dans le `.map()`), changer `padding: '8px 10px'` → `padding: '6px 8px'`
  - [ ] T2.3 — Ajouter `minWidth: 0` à chaque mini-tile (qui a déjà `flex: 1`) pour permettre la compression
  - [ ] T2.4 — L'emoji `{icon}` : `fontSize: 14` → `fontSize: 12`
  - [ ] T2.5 — La valeur `{value}%` : `fontSize: 14` → `fontSize: 13`
  - [ ] T2.6 — Le label texte : ajouter `lineHeight: 1.2` et garder `fontSize: typography.caption.size`

- [ ] T3 — Validation (AC: tous)
  - [ ] T3.1 — `npx tsc --noEmit` = 0 erreurs
  - [ ] T3.2 — Naviguer sur `/dashboard` : les 3 pictos (📅 📈 ✓) tiennent dans la card sans déborder

## Dev Notes

### ⚠️ Contraintes Stack

HTML/JSX natif. Composant inline dans `dashboard/page.tsx`.

---

### T1 — Card wrapper cible

```tsx
// AVANT
<div style={{
  backgroundColor: colors.light.surface,
  borderRadius   : radius.card,
  border         : `1px solid ${colors.border.light}`,
  boxShadow      : shadows.sm,
  padding        : 24,
}}>

// APRÈS
<div style={{
  backgroundColor: colors.light.surface,
  borderRadius   : radius.card,
  border         : `1px solid ${colors.border.light}`,
  boxShadow      : shadows.sm,
  padding        : 24,
  overflow       : 'hidden',   // ← ajout
}}>
```

---

### T2 — Mini-tiles cibles

```tsx
// AVANT
<div style={{ display: 'flex', gap: 8 }}>
  {[...].map(({ label, value, icon }) => (
    <div style={{
      flex           : 1,
      backgroundColor: colors.light.muted,
      border         : `1px solid ${colors.border.light}`,
      borderRadius   : radius.xs,
      padding        : '8px 10px',
      textAlign      : 'center',
    }}>
      <div style={{ fontSize: 14 }}>{icon}</div>
      <div style={{ fontFamily: 'Geist Mono, monospace', fontWeight: 700, fontSize: 14, color: colors.text.dark }}>{value}%</div>
      <div style={{ fontSize: typography.caption.size, ... }}>{label}</div>
    </div>
  ))}
</div>

// APRÈS
<div style={{ display: 'flex', gap: 6 }}>
  {[...].map(({ label, value, icon }) => (
    <div style={{
      flex           : 1,
      minWidth       : 0,      // ← ajout
      backgroundColor: colors.light.muted,
      border         : `1px solid ${colors.border.light}`,
      borderRadius   : radius.xs,
      padding        : '6px 8px',   // ← réduit
      textAlign      : 'center',
    }}>
      <div style={{ fontSize: 12 }}>{icon}</div>          // ← 14→12
      <div style={{ ..., fontSize: 13, ... }}>{value}%</div>  // ← 14→13
      <div style={{ ..., lineHeight: 1.2 }}>{label}</div>     // ← ajout lineHeight
    </div>
  ))}
</div>
```

---

### Fichiers à créer / modifier

| Fichier | Action | Notes |
|---------|--------|-------|
| `aureak/apps/web/app/(admin)/dashboard/page.tsx` | Modifier | `AcademyScoreTile` mini-tiles |

### Fichiers à NE PAS modifier

- `aureak/packages/ui/` — `AcademyScoreTile` est défini inline dans `dashboard/page.tsx`, pas dans `@aureak/ui`

---

### Références

- `AcademyScoreTile` : `dashboard/page.tsx` ligne ~1670
- Mini-tiles flex row : `dashboard/page.tsx` ligne ~1809
- Design ref : `_bmad-output/design-references/dashboard-redesign.png` (score 72 + NIVEAU INTERMÉDIAIRE)

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
