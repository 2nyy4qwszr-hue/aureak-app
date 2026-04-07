# Story 71.4 : Design — Header Activités fond uniforme sans rupture visuelle

Status: done

## Story

En tant qu'admin,
je veux que la zone header (ACTIVITÉS + onglets) et la zone de contenu en dessous aient un fond uniforme sans rupture de couleur,
afin que la page ait un rendu cohérent comme dans les références visuelles.

## Acceptance Criteria

1. Le wrapper de `ActivitesHeader` utilise `colors.light.surface` (blanc) comme fond — identique au fond des cards et du contenu principal
2. Le fond du `container` de la page (`ActivitesPage`) est aligné : `colors.light.surface` au lieu de `colors.light.primary` (beige) — ou inversement, les deux utilisent la même valeur
3. La ligne de séparation en bas du header (`borderBottomWidth: 1, borderBottomColor: colors.border.divider`) reste présente pour délimiter header et contenu
4. Le fond du `filtresRow` (zone FiltresScope + PseudoFiltresTemporels) est aligné avec le fond de la page — pas de rupture visuelle beige/blanc entre le header et les filtres
5. Les onglets SÉANCES / PRÉSENCES / ÉVALUATIONS : le texte des onglets inactifs passe de `colors.text.muted` à `colors.text.dark` — même couleur pour tous, seul le souligné gold indique l'actif (plus de rupture de contraste entre actif/inactif)
6. Le label "ACTIVITÉS" et le bouton "+ Nouvelle séance" sont visuellement dans la continuité — pas de fond différent entre `titleRow` et `tabs`
7. TypeScript compile sans erreur

## Tasks / Subtasks

- [x] T1 — Aligner les fonds page + header (AC: 1, 2, 4)
  - [x] T1.1 — Dans `activites/page.tsx`, styles.container : changer `backgroundColor: colors.light.primary` → `colors.light.surface` (ou vérifier quelle valeur donne un rendu uniforme avec le header)
  - [x] T1.2 — Dans `ActivitesHeader.tsx`, `styles.wrapper` : vérifier que `backgroundColor: colors.light.surface` est en place (déjà le cas — confirmer uniquement)
  - [x] T1.3 — Dans `activites/page.tsx`, styles.scrollContent : s'assurer qu'il n'y a pas de `backgroundColor` différent sur le ScrollView qui créerait une rupture

- [x] T2 — Onglets : uniformiser la couleur texte inactif (AC: 5)
  - [x] T2.1 — Dans `ActivitesHeader.tsx`, dans le mapping des onglets (ligne ~48), modifier `color: isActive ? colors.text.dark : colors.text.muted` → `color: colors.text.dark` pour tous les onglets
  - [x] T2.2 — Le souligné gold (`tabUnderline`) reste l'unique indicateur de l'onglet actif — pas de changement sur lui
  - [x] T2.3 — Optionnel : légèrement réduire `opacity` sur les onglets inactifs via `opacity: isActive ? 1 : 0.55` pour garder la distinction sans changer la couleur

- [x] T3 — Validation (AC: tous)
  - [x] T3.1 — `npx tsc --noEmit` = 0 erreurs
  - [ ] T3.2 — Naviguer sur `/activites` : vérifier qu'il n'y a pas de transition de couleur entre la zone header et la zone contenu
  - [ ] T3.3 — Vérifier que les 3 onglets ont la même couleur de texte, seul le souligné gold différencie l'actif

## Dev Notes

### ⚠️ Contraintes Stack

React Native Web (View, StyleSheet). Les couleurs doivent toutes venir des tokens `@aureak/theme`.

---

### T1 — Différence actuelle

```
ActivitesHeader wrapper : backgroundColor = colors.light.surface (blanc #FFFFFF)
activites/page.tsx container : backgroundColor = colors.light.primary (beige #F3EFE7)
→ Rupture visible : header blanc sur fond beige
```

**Cible :** tout aligner sur `colors.light.surface` pour que header + contenu forment un bloc uniforme.

---

### T2 — Onglets AVANT / APRÈS

```tsx
// AVANT
color: isActive ? colors.text.dark : colors.text.muted

// APRÈS (option A — couleur uniforme)
color: colors.text.dark

// APRÈS (option B — couleur uniforme + opacity distinction)
color: colors.text.dark,
opacity: isActive ? 1 : 0.5
```

Privilégier l'option A pour rester proche de la référence visuelle où les onglets inactifs sont légèrement moins contrastés mais de la même famille de couleur.

---

### Fichiers à créer / modifier

| Fichier | Action | Notes |
|---------|--------|-------|
| `aureak/apps/web/app/(admin)/activites/page.tsx` | Modifier | Fond container aligné |
| `aureak/apps/web/app/(admin)/activites/components/ActivitesHeader.tsx` | Modifier | Couleur texte onglets inactifs |

### Fichiers à NE PAS modifier

- `aureak/apps/web/app/(admin)/activites/presences/page.tsx` — fond géré par ce composant
- `aureak/apps/web/app/(admin)/activites/evaluations/page.tsx` — idem
- `supabase/migrations/` — aucune migration

---

### Références

- `ActivitesHeader.tsx` : onglets ligne ~46-66
- `activites/page.tsx` : styles.container ligne ~43
- Design refs : `_bmad-output/design-references/Activites seances-redesign.png` (header uniforme blanc)

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
| `aureak/apps/web/app/(admin)/activites/page.tsx` | À modifier |
| `aureak/apps/web/app/(admin)/activites/components/ActivitesHeader.tsx` | À modifier |
