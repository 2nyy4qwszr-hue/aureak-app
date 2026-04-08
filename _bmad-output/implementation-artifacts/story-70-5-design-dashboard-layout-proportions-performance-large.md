# Story 70.5 : Design — Layout 3 colonnes : proportions rééquilibrées + PERFORMANCE plus visible

Status: done

## Story

En tant qu'admin,
je veux que le layout 3 colonnes du dashboard ait des proportions équilibrées et que la colonne PERFORMANCE soit plus large et mieux mise en valeur,
afin d'avoir un rendu visuel harmonieux comme dans la référence `dashboard-redesign.png`.

## Acceptance Criteria

1. La colonne gauche (LA JOURNÉE) passe de `width: 260` à `width: 280`
2. La colonne droite (PERFORMANCE) passe de `width: 240` à `width: 280` — plus large pour accueillir le contenu
3. Le titre de section "PERFORMANCE" passe de `fontSize: 10, color: colors.text.subtle` à `fontSize: 12, fontWeight: 700, color: colors.text.dark, letterSpacing: 1.5, textTransform: 'uppercase'` — même style que "L'Académie" après story 70-2
4. Le titre de la card "Classement XP" passe de `fontSize: 11` à `fontSize: 13, fontWeight: 700` — plus visible
5. Le score XP de chaque joueur dans le classement passe de `fontSize: 12` à `fontSize: 13`
6. Le layout reste responsive : les media queries CSS existantes (`.dashboard-3col` à 1100px et 768px) sont mises à jour pour correspondre aux nouvelles largeurs
7. TypeScript compile sans erreur

## Tasks / Subtasks

- [ ] T1 — Modifier les largeurs des colonnes gauche et droite (AC: 1, 2)
  - [ ] T1.1 — Ligne ~2577 : `width: 260` → `width: 280` (col gauche)
  - [ ] T1.2 — Ligne ~2967 : `width: 240` → `width: 280` (col droite)

- [ ] T2 — Titre section PERFORMANCE (AC: 3)
  - [ ] T2.1 — Ligne ~2970, trouver le div avec texte "Performance" (ou "PERFORMANCE"). Modifier : `fontSize: 12, fontWeight: 700, color: colors.text.dark, letterSpacing: 1.5, textTransform: 'uppercase' as React.CSSProperties['textTransform'], marginBottom: 12, fontFamily: 'Montserrat, sans-serif'`

- [ ] T3 — Titre et scores du classement XP (AC: 4, 5)
  - [ ] T3.1 — Ligne ~2982, trouver le div titre "🏆 Classement XP" : `fontSize: 11` → `fontSize: 13`
  - [ ] T3.2 — Dans le map des entrées leaderboard (ligne ~3058), le span du score XP (`entry.totalXp.toLocaleString(...)`) : `fontSize: 12` → `fontSize: 13`

- [ ] T4 — Mise à jour responsive (AC: 6)
  - [ ] T4.1 — Dans le bloc `<style>` (ligne ~2473), mettre à jour `.dashboard-3col > div:first-child { width: 260px }` → `width: 280px`

- [ ] T5 — Validation (AC: tous)
  - [ ] T5.1 — `npx tsc --noEmit` = 0 erreurs
  - [ ] T5.2 — Naviguer sur `/dashboard` : les 3 colonnes sont mieux proportionnées, PERFORMANCE clairement titré

## Dev Notes

### ⚠️ Contraintes Stack

HTML/JSX natif. Modifications de style uniquement.

---

### T2 — Titre section cible (même pattern que LA JOURNÉE / L'ACADÉMIE)

```tsx
// AVANT
<div style={{
  fontSize: 10, fontWeight: 700, color: colors.text.subtle,
  textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 0,
}}>
  Performance
</div>

// APRÈS
<div style={{
  fontSize     : 12,
  fontWeight   : 700,
  color        : colors.text.dark,
  textTransform: 'uppercase' as React.CSSProperties['textTransform'],
  letterSpacing: 1.5,
  marginBottom : 12,
  fontFamily   : 'Montserrat, sans-serif',
}}>
  Performance
</div>
```

---

### Fichiers à créer / modifier

| Fichier | Action | Notes |
|---------|--------|-------|
| `aureak/apps/web/app/(admin)/dashboard/page.tsx` | Modifier | Largeurs colonnes + styles titres + responsive |

### Fichiers à NE PAS modifier

- Aucun autre fichier

---

### Références

- Col gauche width : `dashboard/page.tsx` ligne ~2577
- Col droite width : `dashboard/page.tsx` ligne ~2967
- Titre Performance : `dashboard/page.tsx` ligne ~2970
- Responsive CSS : `dashboard/page.tsx` ligne ~2473
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
