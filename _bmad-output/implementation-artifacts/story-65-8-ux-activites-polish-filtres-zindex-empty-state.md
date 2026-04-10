# Story 65.8 : UX — Activités hub : polish filtres, z-index, empty state, autocomplete

Status: done

## Story

En tant qu'admin,
je veux que la page Activités soit fluide à utiliser (filtres côte à côte, menus au-dessus de tout, fond clair, pas de suggestion de mot de passe),
afin de naviguer efficacement dans les séances, présences et évaluations.

## Acceptance Criteria

1. Les filtres scope (Global / Implantation / Groupe / Joueur) et les filtres temporels (Aujourd'hui / À venir / Passé) sont sur la même ligne : scope à gauche, temporel à droite
2. Les dropdowns des filtres (Implantation, Groupe, Joueur) s'affichent au-dessus de tous les autres éléments de la page (z-index suffisant)
3. L'empty state "À venir" (aucune séance future) affiche un fond clair (`colors.light.surface`) et non un fond sombre
4. Le champ de recherche Joueur dans le dropdown ne déclenche pas la suggestion de mots de passe du navigateur (`autoComplete="off"`)
5. Le hint "Choisir une implantation d'abord" sous le pill Groupe est retiré — le pill Groupe est simplement grisé et non-cliquable sans implantation (comportement inchangé), mais sans le texte explicatif
6. Ces corrections s'appliquent aux 3 onglets (Séances, Présences, Évaluations) car `FiltresScope` et `PseudoFiltresTemporels` sont partagés
7. Aucune régression sur les autres filtres (Global, Implantation restent fonctionnels)

## Tasks / Subtasks

- [x] T1 — Filtres sur une seule ligne (AC: 1)
  - [x] T1.1 — Dans `activites/page.tsx` (onglet Séances), supprimer les deux `<FiltresScope />` et `<PseudoFiltresTemporels />` séparés et les remplacer par un wrapper `filtresRow`
  - [x] T1.2 — Dans ce wrapper, mettre `<FiltresScope />` à gauche et `<PseudoFiltresTemporels />` à droite
  - [x] T1.3 — Appliqué dans `activites/presences/page.tsx` et `activites/evaluations/page.tsx`
  - [x] T1.4 — Retiré `paddingHorizontal`/`paddingVertical` des styles internes de `FiltresScope` et `PseudoFiltresTemporels`

- [x] T2 — Z-index dropdowns (AC: 2)
  - [x] T2.1 — Dans `FiltresScope.tsx`, `styles.dropdown` : `zIndex: 9999`, `elevation: 20`, `boxShadow`
  - [x] T2.2 — `styles.dropdownWrapper` : `zIndex: 9999` ajouté
  - [x] T2.3 — `PseudoFiltresTemporels` n'a pas de dropdown — non applicable

- [x] T3 — Empty state fond clair (AC: 3)
  - [x] T3.1 — Localisé dans `TableauSeances.tsx` style `emptyRow`
  - [x] T3.2 — Ajouté `backgroundColor: colors.light.surface` sur `emptyRow`
  - [x] T3.3 — Texte utilise `colors.text.muted` — déjà en place

- [x] T4 — Autocomplete off sur champ Joueur (AC: 4)
  - [x] T4.1 — `autoComplete="off"`, `autoCorrect={false}`, `data-lpignore`, `data-form-type="other"` ajoutés sur le TextInput joueur
  - [x] T4.2 — Non appliqué à `seances/new.tsx` (hors scope de cette story)

- [x] T5 — Retirer hint "Choisir une implantation d'abord" (AC: 5)
  - [x] T5.1 — Bloc pillHint supprimé de `FiltresScope.tsx`
  - [x] T5.2 — Style `pillHint` supprimé du `StyleSheet.create`
  - [x] T5.3 — Story 65-4 déjà marquée `cancelled`

- [x] T6 — Validation (AC: tous)
  - [x] T6.1 — Filtres côte à côte dans les 3 onglets via `filtresRow`
  - [x] T6.2 — z-index 9999 appliqué sur dropdownWrapper + dropdown
  - [x] T6.3 — `emptyRow` a maintenant `backgroundColor: colors.light.surface`
  - [x] T6.4 — `autoComplete="off"` sur le TextInput joueur
  - [x] T6.5 — pillHint retiré, opacity 0.45 conservée pour le grisage

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

### T1 — Filtres côte à côte

Wrapper cible dans `activites/page.tsx` :

```tsx
{/* Filtres scope + temporels sur une ligne */}
<View style={{
  flexDirection    : 'row',
  justifyContent   : 'space-between',
  alignItems       : 'center',
  paddingHorizontal: space.lg,
  paddingVertical  : space.sm,
}}>
  <FiltresScope value={scope} onChange={setScope} />
  <PseudoFiltresTemporels value={temporalFilter} onChange={setTemporalFilter} />
</View>
```

Dans `FiltresScope`, retirer `paddingHorizontal: space.lg, paddingVertical: space.md` du `styles.container` (ou les ramener à 0) pour éviter le double espacement.

---

### T2 — Z-index fix

Le problème vient du fait que React Native Web crée des stacking contexts par défaut. Il faut que le `dropdownWrapper` et le `dropdown` aient tous deux un `zIndex` élevé :

```typescript
dropdownWrapper: {
  position: 'relative',
  zIndex  : 9999,   // ← ajouter
},
dropdown: {
  position       : 'absolute',
  top            : 38,
  left           : 0,
  zIndex         : 9999,   // ← augmenter (était 100)
  backgroundColor: colors.light.surface,
  borderRadius   : radius.xs,
  borderWidth    : 1,
  borderColor    : colors.border.light,
  width          : 220,
  elevation      : 20,     // ← augmenter (était 4)
  // Pour le web : shadow CSS
  boxShadow      : '0 8px 24px rgba(0,0,0,0.12)',
},
```

---

### T4 — Autocomplete TextInput

React Native Web supporte les props HTML standard passées via spread :

```tsx
<TextInput
  style={styles.searchInput}
  placeholder="Rechercher un joueur…"
  placeholderTextColor={colors.text.muted}
  value={joueurSearch}
  onChangeText={setJoueurSearch}
  autoComplete="off"
  autoCorrect={false}
  {...({ 'data-lpignore': 'true', 'data-form-type': 'other' } as object)}
/>
```

Le `data-lpignore="true"` supprime la suggestion LastPass. `data-form-type="other"` supprime la suggestion des gestionnaires de mots de passe standards.

---

### Fichiers à créer / modifier

| Fichier | Action | Notes |
|---------|--------|-------|
| `aureak/apps/web/app/(admin)/activites/page.tsx` | Modifier | Filtres côte à côte |
| `aureak/apps/web/app/(admin)/activites/presences/page.tsx` | Modifier si nécessaire | Idem filtres |
| `aureak/apps/web/app/(admin)/activites/evaluations/page.tsx` | Modifier si nécessaire | Idem filtres |
| `aureak/apps/web/app/(admin)/activites/components/FiltresScope.tsx` | Modifier | Z-index, autocomplete off, retirer pillHint |
| `aureak/apps/web/app/(admin)/activites/components/TableauSeances.tsx` | Modifier | Empty state fond clair |
| `_bmad-output/implementation-artifacts/story-65-4-ux-filtresscope-pill-groupe-disabled.md` | Modifier | Status → cancelled |

### Fichiers à NE PAS modifier

- `aureak/apps/web/app/(admin)/activites/components/PseudoFiltresTemporels.tsx` — sauf si dropdown interne avec même z-index problem
- `aureak/apps/web/app/(admin)/activites/components/ActivitesHeader.tsx` — non concerné
- `aureak/apps/web/app/(admin)/activites/components/StatCards.tsx` — non concerné

---

### Dépendances à protéger

- Stories 65-1, 65-2, 65-3 consomment `FiltresScope` et `PseudoFiltresTemporels` — ne pas modifier les props/signatures de ces composants
- Story 65-4 : **annuler** (superseded par cette story sur le point pillHint)
- Stories 65-5, 65-6 : non impactées (composants séparés)

---

### Références

- `FiltresScope.tsx` : `aureak/apps/web/app/(admin)/activites/components/FiltresScope.tsx`
- `TableauSeances.tsx` : `aureak/apps/web/app/(admin)/activites/components/TableauSeances.tsx`
- Tokens design : `aureak/packages/theme/src/tokens.ts`

---

### Multi-tenant

Non applicable — filtres UI uniquement, les requêtes API déjà filtrées par RLS.

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List

| Fichier | Statut |
|---------|--------|
| `aureak/apps/web/app/(admin)/activites/page.tsx` | Modifié |
| `aureak/apps/web/app/(admin)/activites/presences/page.tsx` | Modifié |
| `aureak/apps/web/app/(admin)/activites/evaluations/page.tsx` | Modifié |
| `aureak/apps/web/app/(admin)/activites/components/FiltresScope.tsx` | Modifié |
| `aureak/apps/web/app/(admin)/activites/components/PseudoFiltresTemporels.tsx` | Modifié (padding retiré) |
| `aureak/apps/web/app/(admin)/activites/components/TableauSeances.tsx` | Modifié |
| `_bmad-output/implementation-artifacts/story-65-4-ux-filtresscope-pill-groupe-disabled.md` | Déjà cancelled |
