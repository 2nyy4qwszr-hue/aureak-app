# Story 67.2 : Design — Activités Séances : redesign visuel (référence Activites seances-redesign.png)

Status: done

## Story

En tant qu'admin,
je veux que l'onglet Séances du hub Activités ressemble à la référence visuelle `_bmad-output/design-references/Activites seances-redesign.png`,
afin d'avoir un tableau de séances premium et cohérent avec la charte Aureak.

## Acceptance Criteria

1. **Stat cards** : les 4 cards (Présence Moyenne / Total Séances / Annulées / Évals Complétées) ont une hauteur compacte (~90px), valeur principale en Montserrat 28px bold, label 10px uppercase muted, sous-info 11px — style identique à la référence (fond blanc, ombre sm, border-radius card)
2. **Tableau — colonne Statut** : badge pill coloré arrondi, police 11px bold, avec couleurs tokens actuelles — le badge occupe exactement la place du contenu, pas de troncature
3. **Tableau — ligne** : hauteur de ligne ~52px, padding horizontal 16px, border-bottom `1px solid colors.border.divider`, fond blanc alterné (`colors.light.muted` pair/impair), pas de fond sombre
4. **Tableau — typographie** : toutes les cellules utilisent fontSize 13, fontFamily Montserrat, `colors.text.dark` pour le contenu principal et `colors.text.muted` pour secondaire
5. **Tableau — colonne Coach** : avatars initiales en cercles 28px superposés (max 2 + indicateur "+N"), couleur de fond `colors.accent.gold + '33'`, initiales en `colors.text.dark`
6. **Tableau — colonne Présence** : format "X / Y" (présents / total) en fontSize 13, fontWeight 600 — couleur selon taux via `rateColor()` existant
7. **Header tableau** : labels colonnes en 10px uppercase, fontWeight 700, `colors.text.subtle`, letter-spacing 1px, fond `colors.light.muted`, padding vertical 10px
8. **Évals Complétées card** : la 4e stat card affiche une barre de progression gold sous la valeur (pattern existant dans `StatCards.tsx` — garder)
9. **Aucune colonne retirée** : les données existantes sont conservées — seul le style visuel change
10. **Zéro couleur hardcodée** dans les styles modifiés

## Tasks / Subtasks

- [x] T1 — Stat cards redesign (AC: 1, 8)
  - [x] T1.1 — Dans `StatCards.tsx`, modifier `styles.card` : `padding: space.md`, ajouter `borderWidth: 1, borderColor: colors.border.divider` pour profondeur
  - [x] T1.2 — Modifier `styles.statValue` : `fontSize: 28, fontWeight: '900', fontFamily: 'Montserrat'`
  - [x] T1.3 — Modifier `styles.statLabel` : `fontSize: 10, letterSpacing: 1, textTransform: 'uppercase'`
  - [x] T1.4 — Vérifier que la 4e card conserve la barre gold (`progressBar` / `progressFill`) — déjà en place, vérifier seulement

- [x] T2 — Header tableau redesign (AC: 7)
  - [x] T2.1 — Dans `TableauSeances.tsx`, localiser les styles du header de tableau (`tableHeader`, `thText`)
  - [x] T2.2 — Header fond : `colors.light.muted`, padding vertical 10px, border-bottom `1px solid colors.border.divider`
  - [x] T2.3 — Labels colonnes : `fontSize: 10, fontWeight: '700', color: colors.text.subtle, textTransform: 'uppercase', letterSpacing: 1, fontFamily: 'Montserrat'`

- [x] T3 — Lignes tableau redesign (AC: 3, 4, 9)
  - [x] T3.1 — Modifier `styles.tableRow` : `height: 52, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: colors.border.divider`
  - [x] T3.2 — Alternance fond pair/impair : lignes paires `colors.light.surface`, lignes impaires `colors.light.muted`
  - [x] T3.3 — Cellule texte principal : `fontSize: 13, fontFamily: 'Montserrat', color: colors.text.dark`
  - [x] T3.4 — Cellule texte secondaire (sous-info date, etc.) : `fontSize: 11, color: colors.text.muted`

- [x] T4 — Colonne Coach redesign (AC: 5)
  - [x] T4.1 — Dans `CoachAvatars` component de `TableauSeances.tsx`, modifier le cercle avatar : `width: 28, height: 28, borderRadius: 14, backgroundColor: colors.accent.gold + '33'`
  - [x] T4.2 — Initiales : `fontSize: 11, fontWeight: '700', color: colors.text.dark`
  - [x] T4.3 — Superposition : `marginLeft: -6` sur les avatars suivants (overlap effet)

- [x] T5 — Colonne Présence redesign (AC: 6)
  - [x] T5.1 — Vérifier que la colonne Présence affiche "X / Y" (présents / total roster)
  - [x] T5.2 — Appliquer `rateColor()` sur la valeur si disponible, sinon `colors.text.dark`
  - [x] T5.3 — `fontWeight: '600'` sur la valeur numérique

- [x] T6 — Validation (AC: tous)
  - [x] T6.1 — Naviguer sur `/activites` → vérifier que les 4 stat cards correspondent à la référence
  - [x] T6.2 — Vérifier hauteur de ligne ~52px, alternance fond, typographie 13px Montserrat
  - [x] T6.3 — Vérifier avatars coach 28px, superposés
  - [x] T6.4 — Vérifier header colonnes 10px uppercase muted
  - [x] T6.5 — Grep `#[0-9a-fA-F]` sur les fichiers modifiés → zéro occurrence

## Dev Notes

### ⚠️ Contraintes Stack

Ce projet utilise **React Native Web** (View, Pressable, StyleSheet) dans les composants Activités.

- **Tokens `@aureak/theme`** : `colors`, `space`, `shadows`, `radius`, `fonts`
- **Accès Supabase UNIQUEMENT via `@aureak/api-client`**
- **Styles via tokens uniquement** — jamais de couleurs hardcodées

---

### T2/T3 — Pattern ligne tableau cible

```typescript
// styles.tableRow (cible)
tableRow: {
  flexDirection    : 'row',
  alignItems       : 'center',
  minHeight        : 52,
  paddingHorizontal: 16,
  borderBottomWidth: 1,
  borderBottomColor: colors.border.divider,
  backgroundColor  : colors.light.surface,  // alterné via idx % 2
},
tableRowAlt: {
  backgroundColor: colors.light.muted,
},

// styles.tableHeader (cible)
tableHeader: {
  flexDirection    : 'row',
  alignItems       : 'center',
  paddingHorizontal: 16,
  paddingVertical  : 10,
  backgroundColor  : colors.light.muted,
  borderBottomWidth: 1,
  borderBottomColor: colors.border.divider,
},
thText: {
  fontSize     : 10,
  fontWeight   : '700',
  fontFamily   : 'Montserrat',
  color        : colors.text.subtle,
  textTransform: 'uppercase',
  letterSpacing: 1,
},
```

---

### Référence visuelle

Fichier : `_bmad-output/design-references/Activites seances-redesign.png`

Éléments clés :
- Fond page : `colors.light.primary` (beige/blanc)
- Stat cards : fond blanc, ombre légère, pas de fond sombre
- Tableau : fond blanc, lignes fines, badges statut pills colorés
- Badges statut : petits (11px), arrondis, couleurs vives

---

### Fichiers à créer / modifier

| Fichier | Action | Notes |
|---------|--------|-------|
| `aureak/apps/web/app/(admin)/activites/components/StatCards.tsx` | Modifier | Typographie + border |
| `aureak/apps/web/app/(admin)/activites/components/TableauSeances.tsx` | Modifier | Header + lignes + avatars coach |

### Fichiers à NE PAS modifier

- `aureak/apps/web/app/(admin)/activites/page.tsx` — structure inchangée
- `aureak/apps/web/app/(admin)/activites/components/FiltresScope.tsx` — couvert par story 65-8
- `aureak/apps/web/app/(admin)/activites/components/PseudoFiltresTemporels.tsx` — couvert par story 65-8
- `aureak/apps/web/app/(admin)/activites/components/ActivitesHeader.tsx` — non concerné

---

### Dépendances à protéger

- Story 65-1 : `StatCards` et `TableauSeances` sont partagés — ne pas modifier les signatures de props
- Story 65-8 (filtres + z-index) peut être implementée en parallèle sans conflit sur les fichiers

---

### Multi-tenant

RLS gère l'isolation — aucun changement API.

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

Aucun.

### Completion Notes List

- `fonts` supprimé de l'import `@aureak/theme` dans StatCards.tsx (plus utilisé après passage à 'Montserrat' string)
- `ALPHA_COLORS` supprimé de TableauSeances.tsx (plus utilisé après uniformisation fond avatar gold+'33')
- Fonction `rateColor()` ajoutée dans TableauSeances.tsx (couleur dynamique sur la valeur présence)
- Zéro couleur hardcodée dans les deux fichiers (grep `#[0-9a-fA-F]` → 0 résultat)

### File List

| Fichier | Statut |
|---------|--------|
| `aureak/apps/web/app/(admin)/activites/components/StatCards.tsx` | Modifié |
| `aureak/apps/web/app/(admin)/activites/components/TableauSeances.tsx` | Modifié |
