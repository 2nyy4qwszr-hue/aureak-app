# Story 70.2 : Design — Section L'Académie : titre visible + suppression filtres Implantation/Période

Status: done

## Story

En tant qu'admin,
je veux que la colonne centrale du dashboard affiche un titre "L'ACADÉMIE" lisible et que les filtres Implantation/Période soient retirés,
afin que le dashboard soit épuré comme dans la référence visuelle.

## Acceptance Criteria

1. Le label de section "L'ACADÉMIE" passe de `fontSize: 10, color: colors.text.subtle` à `fontSize: 12, fontWeight: 700, color: colors.text.dark, letterSpacing: 1.5, textTransform: 'uppercase'` — visible et aligné avec les autres titres de section
2. Les deux selects (Implantation + Période) et le bloc `filterRow` en bas de la colonne milieu sont retirés du JSX (lignes ~2919-2960 dans `dashboard/page.tsx`)
3. Le state `selectedImplantationId` / `setSelectedImplantationId` et `preset` / `handlePresetChange` / `customFrom` / `customTo` / `handleApplyCustom` restent dans le code (ils contrôlent `visibleStats`) mais les contrôles UI sont retirés — `selectedImplantationId` restera toujours `null` (toutes implantations)
4. La variable `visibleStats` continue de fonctionner : sans filtre actif elle vaut `stats` (toutes implantations)
5. La colonne milieu se termine proprement après la table Performance Sites, sans div vide ni padding résiduel
6. TypeScript compile sans erreur

## Tasks / Subtasks

- [x] T1 — Rendre le titre "L'ACADÉMIE" visible (AC: 1)
  - [x] T1.1 — Titre "L'Académie" ajouté au début de la col milieu (fontSize: 12, fontWeight: 700, color: colors.text.dark, letterSpacing: 1.5, textTransform: uppercase, fontFamily: Montserrat)

- [x] T2 — Retirer les filtres Implantation/Période (AC: 2, 3, 4, 5)
  - [x] T2.1 — Bloc JSX `{/* ── Filtres période ── */}` supprimé entièrement (selects Implantation + Période + inputs date custom)
  - [x] T2.2 — `visibleStats` conservé intact, `selectedImplantationId` reste null → visibleStats = stats
  - [x] T2.3 — Styles `S.filterRow`, `S.dateGroup`, etc. conservés dans l'objet S (pas d'erreur TS)

- [x] T3 — Validation (AC: tous)
  - [x] T3.1 — `npx tsc --noEmit` = 0 erreurs
  - [ ] T3.2 — Naviguer sur `/dashboard` : titre "L'ACADÉMIE" lisible au-dessus des stats 4 chiffres
  - [ ] T3.3 — Vérifier l'absence totale des selects Implantation/Période dans le rendu

## Dev Notes

### ⚠️ Contraintes Stack

Ce fichier utilise HTML/JSX natif (`div`, style inline) — pas React Native View.

- **Tokens `@aureak/theme`** : `colors`, `space`, `shadows`, `radius`
- **Try/finally obligatoire** sur tout state setter de chargement

---

### T1 — Titre section cible

```tsx
// AVANT
<div style={{
  fontSize: 10, fontWeight: 700, color: colors.text.subtle,
  textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 10,
}}>
  L'académie
</div>

// APRÈS
<div style={{
  fontSize: 12, fontWeight: 700, color: colors.text.dark,
  textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 12,
  fontFamily: 'Montserrat, sans-serif',
}}>
  L'Académie
</div>
```

---

### T2 — Bloc à supprimer (repère dans le fichier)

```tsx
{/* ── Filtres période ── */}
<div style={{ ...S.filterRow, marginBottom: 0, borderTop: `1px solid ${colors.border.light}`, paddingTop: 12 }}>
  {/* Implantation selector */}
  ...
  {/* Période */}
  ...
</div>
```
Ce bloc se situe juste après le `</div>` fermant le bloc Performance Sites, avant `{/* ── FIN COL MILIEU ── */}`.

---

### Fichiers à créer / modifier

| Fichier | Action | Notes |
|---------|--------|-------|
| `aureak/apps/web/app/(admin)/dashboard/page.tsx` | Modifier | Titre + suppression filtres |

### Fichiers à NE PAS modifier

- `aureak/packages/api-client/` — aucun changement API
- `supabase/migrations/` — aucune migration

---

### Références

- Col milieu start : `dashboard/page.tsx` ligne ~2774
- Filtres à supprimer : `dashboard/page.tsx` ligne ~2919
- Design ref : `_bmad-output/design-references/dashboard-redesign.png`

---

### Multi-tenant

RLS gère l'isolation. Aucun paramètre `tenantId` à ajouter.

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List

| Fichier | Statut |
|---------|--------|
| `aureak/apps/web/app/(admin)/dashboard/page.tsx` | À modifier |
