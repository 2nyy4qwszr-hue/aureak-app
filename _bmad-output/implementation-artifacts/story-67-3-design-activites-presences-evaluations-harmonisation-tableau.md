# Story 67.3 : Design — Activités Présences & Évaluations : harmonisation tableau (références presences + evaluations redesign)

Status: done

## Story

En tant qu'admin,
je veux que les onglets Présences et Évaluations du hub Activités aient le même style visuel que l'onglet Séances (story 67-2) et correspondent à leurs références respectives,
afin que les 3 onglets forment un ensemble cohérent et premium.

## Acceptance Criteria

### Présences (référence `Activites presences-redesign.png`)

1. **Stat cards Présences** : 4 cards avec le même style que story 67-2 (28px bold, 10px uppercase label, border divider, fond blanc, shadow sm) — valeurs : Moyenne Générale / Groupes Sous 70% / Total Séances / Tendance Globale
2. **Heatmap — header** : labels colonnes dates en 10px uppercase `colors.text.subtle`, fond `colors.light.muted`, même style que le header TableauSeances
3. **Heatmap — colonne groupe** : nom du groupe en 13px fontWeight 600, nom du coach en 11px `colors.text.muted` en dessous, fond `colors.light.surface`
4. **Heatmap — cases colorées** : fond vert (`colors.status.successBg`) si ≥80%, orange (`colors.status.orangeBg`) si 60–79%, rouge (`colors.status.errorBg`) si <60% — texte % en bold 12px couleur token correspondante — coin arrondi `radius.xs`
5. **Heatmap — colonne Moyenne** : valeur bold 13px colorée via `getCellStyle()` existant, fond légèrement différencié (`colors.light.muted`)
6. **Heatmap — lignes** : alternance fond pair/impair identique à TableauSeances, height ~52px, border-bottom `colors.border.divider`

### Évaluations (référence `Activites evaluations-redesign.png`)

7. **Stat cards Évaluations** : 4 cards style identique (28px bold, 10px uppercase, fond blanc, shadow sm) — valeurs : Note Moyenne (avec tendance icon ↑/↓) / Évals ce mois / Progression Technique / Top Performer (card gold avec badge UIT si disponible)
8. **Tableau Évaluations — lignes** : même style que TableauSeances — hauteur ~52px, padding 16px, border-bottom `colors.border.divider`, alternance fond pair/impair, fond blanc (pas sombre)
9. **Tableau Évaluations — colonne Joueur** : avatar rond 32px avec initiales (fond `colors.accent.gold + '33'`, initiales dark), nom en 13px fontWeight 600 à droite de l'avatar
10. **Tableau Évaluations — colonnes notes** : valeurs numériques (ex. 6.4 / 7.2) en 13px fontWeight 700, colorées selon seuil (≥7 = `colors.status.success`, 5-7 = `colors.status.attention`, <5 = `colors.status.absent`)
11. **Tableau Évaluations — colonne Commentaire** : texte en 12px `colors.text.muted`, tronqué à 40 caractères avec "…" si trop long
12. **Tableau Évaluations — header** : identique au pattern story 67-2 (10px uppercase subtle, fond light.muted)
13. **Fond page et tableau Évaluations** : fond `colors.light.surface` (blanc) — aucun fond sombre ni `#1A1A1A`

## Tasks / Subtasks

- [x] T1 — Présences : stat cards (AC: 1)
  - [x] T1.1 — Dans `activites/presences/page.tsx`, localiser les 4 stat cards
  - [x] T1.2 — Appliquer les styles cibles : `padding: space.md, borderWidth: 1, borderColor: colors.border.divider, borderRadius: radius.card, backgroundColor: colors.light.surface, boxShadow: shadows.sm`
  - [x] T1.3 — Valeur principale : `fontSize: 28, fontWeight: '900', fontFamily: 'Montserrat', color: colors.text.dark`
  - [x] T1.4 — Label : `fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, color: colors.text.muted`

- [x] T2 — Présences : header heatmap (AC: 2)
  - [x] T2.1 — Dans `activites/presences/page.tsx`, localiser le header des colonnes de dates
  - [x] T2.2 — Appliquer : fond `colors.light.muted`, fontSize 10, uppercase, `colors.text.subtle`, letterSpacing 1, padding vertical 10px

- [x] T3 — Présences : lignes heatmap (AC: 3, 4, 5, 6)
  - [x] T3.1 — Colonne gauche (groupe + coach) : hauteur ~52px, fond `colors.light.surface`, nom groupe 13px bold, nom coach 11px muted
  - [x] T3.2 — Cases colorées : fond selon taux (successBg/orangeBg/errorBg), texte % bold 12px couleur token, borderRadius: radius.xs
  - [x] T3.3 — Colonne Moyenne : fond `colors.light.muted`, valeur colorée via `getCellStyle()`
  - [x] T3.4 — Alternance pair/impair sur les lignes groupes

- [x] T4 — Évaluations : stat cards (AC: 7)
  - [x] T4.1 — Dans `activites/evaluations/page.tsx`, localiser ou créer les 4 stat cards
  - [x] T4.2 — Si elles n'existent pas encore : créer les 4 cards avec valeurs derivées des données `listEvaluationsAdmin()` : note moyenne calculée / nombre évals / progression (optionnel) / top joueur
  - [x] T4.3 — Appliquer le même style que T1 (28px bold, 10px uppercase, border divider, fond blanc, shadow sm)

- [x] T5 — Évaluations : tableau redesign (AC: 8, 9, 10, 11, 12, 13)
  - [x] T5.1 — Dans `activites/evaluations/page.tsx`, localiser le tableau des évaluations
  - [x] T5.2 — Header : fond `colors.light.muted`, labels 10px uppercase subtle — colonnes : JOUEUR / DATE / NOTE 1 / NOTE 2 / COMMENTAIRE
  - [x] T5.3 — Lignes : hauteur 52px, padding 16px, border-bottom divider, fond `colors.light.surface` (alternance light.muted) — remplacer tout fond sombre
  - [x] T5.4 — Colonne Joueur : avatar cercle 32px (`colors.accent.gold + '33'`), initiales 12px bold dark, nom 13px bold à droite
  - [x] T5.5 — Colonnes notes : `fontSize: 13, fontWeight: '700'` — couleur conditionnelle : ≥7 = `colors.status.success`, 5-7 = `colors.status.attention`, <5 = `colors.status.absent`
  - [x] T5.6 — Colonne commentaire : `fontSize: 12, color: colors.text.muted`, tronqué via la fonction `truncate()` existante (40 chars)
  - [x] T5.7 — Supprimer tout fond `#1A1A1A`, `colors.dark`, ou couleur sombre dans le fichier

- [x] T6 — Validation (AC: tous)
  - [x] T6.1 — Onglet Présences → vérifier stat cards style, heatmap lignes, cases colorées
  - [x] T6.2 — Onglet Évaluations → vérifier tableau fond clair, avatars, couleurs notes
  - [x] T6.3 — Comparer visuellement les 3 onglets : même hauteur de lignes, même header style, même stat cards style
  - [x] T6.4 — Grep `#1A1A1A\|colors\.dark` sur les fichiers modifiés → zéro occurrence

## Dev Notes

### ⚠️ Contraintes Stack

**React Native Web** (View, Pressable, StyleSheet) dans les composants Activités.

- **Tokens `@aureak/theme`** : `colors`, `space`, `shadows`, `radius`, `fonts`
- **Styles via tokens uniquement** — jamais de couleurs hardcodées
- **Try/finally obligatoire** sur tout state setter

---

### Pattern commun stat card (à répliquer dans presences + evaluations)

```typescript
// Identique à StatCards.tsx (story 67-2)
card: {
  flex           : 1,
  minWidth       : 160,
  backgroundColor: colors.light.surface,
  borderRadius   : radius.card,
  padding        : space.md,
  borderWidth    : 1,
  borderColor    : colors.border.divider,
  boxShadow      : shadows.sm,
} as unknown as object,
statValue: {
  fontSize  : 28,
  fontWeight: '900',
  fontFamily: 'Montserrat',
  color     : colors.text.dark,
  lineHeight: 36,
},
statLabel: {
  fontSize     : 10,
  fontWeight   : '700',
  fontFamily   : 'Montserrat',
  color        : colors.text.muted,
  marginTop    : 4,
  textTransform: 'uppercase',
  letterSpacing: 1,
},
```

---

### Pattern couleur notes (T5.5)

```typescript
function noteColor(score: number): string {
  if (score >= 7) return colors.status.success
  if (score >= 5) return colors.status.attention
  return colors.status.absent
}
```

---

### Dépendance : story 67-2 doit être implémentée en premier

Le style de référence pour les lignes, le header et les stat cards est établi dans `TableauSeances.tsx` et `StatCards.tsx` par la story 67-2. Cette story 67-3 réplique ce style dans les pages Présences et Évaluations.

Si 67-2 n'est pas encore implémentée au moment du coding : utiliser les valeurs cibles listées ci-dessus (elles sont identiques).

---

### Références visuelles

- Présences : `_bmad-output/design-references/Activites presences-redesign.png`
- Évaluations : `_bmad-output/design-references/Activites evaluations-redesign.png`

---

### Fichiers à créer / modifier

| Fichier | Action | Notes |
|---------|--------|-------|
| `aureak/apps/web/app/(admin)/activites/presences/page.tsx` | Modifier | Stat cards + heatmap style |
| `aureak/apps/web/app/(admin)/activites/evaluations/page.tsx` | Modifier | Stat cards + tableau redesign complet |

### Fichiers à NE PAS modifier

- `aureak/apps/web/app/(admin)/activites/components/StatCards.tsx` — couvert par story 67-2
- `aureak/apps/web/app/(admin)/activites/components/TableauSeances.tsx` — couvert par story 67-2
- `aureak/apps/web/app/(admin)/activites/components/FiltresScope.tsx` — couvert par story 65-8
- `aureak/apps/web/app/(admin)/activites/components/ActivitesHeader.tsx` — non concerné
- `supabase/migrations/` — aucune migration

---

### Multi-tenant

RLS gère l'isolation — aucun changement API.

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List

| Fichier | Statut |
|---------|--------|
| `aureak/apps/web/app/(admin)/activites/presences/page.tsx` | À modifier |
| `aureak/apps/web/app/(admin)/activites/evaluations/page.tsx` | À modifier |
