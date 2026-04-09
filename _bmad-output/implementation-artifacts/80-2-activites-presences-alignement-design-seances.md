# Story 80.2 : Activités Présences — Alignement design Séances

Status: done

## Story

En tant qu'admin,
je veux que la page Activités > Présences adopte exactement le même langage visuel que Activités > Séances (story 80.1),
afin d'avoir une interface uniforme entre les onglets Activités.

## Contexte design

La page Séances (story 80.1) a été alignée sur ces 5 patterns de référence :

| Pattern | Source | Description |
|---|---|---|
| **SectionHeader** | `methodologie/seances/index.tsx` headerBlock | Titre 24/700, bouton gold, tabs gold underline |
| **StatCards** | `activites/components/StatCards.tsx` | 4 cards horizontales avec icônes |
| **FiltresScope** | `activites/components/FiltresScope.tsx` | Pills scope : Toutes, Implantation, Groupe, Joueur |
| **SegmentedToggle** | `academie/joueurs/index.tsx` toggleRow | Container unique, segments collés, gold actif, surface inactif |
| **EntraînementsTable** | `methodologie/seances/index.tsx` | Container borderRadius 10, header muted, lignes zébrées |

## Acceptance Criteria

1. **SectionHeader** : déjà partagé via `ActivitesHeader` — aucun changement (vérifié story 80.1)

2. **Ordre des blocs** : StatCards AVANT les filtres (comme Séances 80.1)
   - Avant : filtresRow → StatCardsPresences → contenu
   - Après : StatCardsPresences → filtresRow → contenu

3. **FiltresScope** (gauche) : inchangé — composant partagé

4. **SegmentedToggle** (droite) : déjà partagé via `PseudoFiltresTemporels` — aucun changement (vérifié story 80.1)

5. **TableauGroupes** : aligner le container sur le pattern EntraînementsTable
   - `container` : `borderRadius: 10`, `borderWidth: 1`, `borderColor: colors.border.divider`, `overflow: 'hidden'`
   - Supprimer le bloc `header` (titre "Registre des Présences" + légende) — le titre est redondant avec l'onglet "PRÉSENCES"
   - `tableHeader` : `paddingHorizontal: 16`, `paddingVertical: 10`, `backgroundColor: colors.light.muted`
   - En-têtes colonnes : fontSize 10, fontWeight '700', fontFamily 'Montserrat', color `colors.text.subtle`, uppercase, letterSpacing 1
   - Lignes zébrées : `colors.light.surface` (pair) / `colors.light.muted` (impair), `minHeight: 52`, `paddingHorizontal: 16`
   - Noms de colonnes et logique de données (heatmap rates, cellules colorées) : **inchangés**
   - Pagination : aligner sur le style `TableauSeances` (fond muted, border-top divider)

6. **HeatmapGroupe** (vue quand scope = groupe) : aligner le container
   - Même `borderRadius: 10`, `borderWidth: 1`, `borderColor: colors.border.divider`, `overflow: 'hidden'`
   - Lignes zébrées

## Tasks / Subtasks

- [ ] Task 1 — Réordonner les blocs dans `presences/page.tsx` (AC: #2)
  - [ ] Déplacer `<StatCardsPresences>` avant `<View style={pageStyles.filtresRow}>`
  - [ ] Fichier : `aureak/apps/web/app/(admin)/activites/presences/page.tsx`

- [ ] Task 2 — Refonte container `TableauGroupes` (AC: #5)
  - [ ] `container` : borderRadius 10, borderColor divider, overflow hidden
  - [ ] Supprimer le bloc `header` (titre + légende) ou le déplacer hors du container
  - [ ] `tableHeader` : paddingHorizontal 16, paddingVertical 10
  - [ ] En-têtes colonnes : fontSize 10, Montserrat, subtle, uppercase, letterSpacing 1
  - [ ] Lignes zébrées surface/muted alternées
  - [ ] Pagination : fond muted, border-top divider, même style que TableauSeances
  - [ ] Fichier : `aureak/apps/web/app/(admin)/activites/presences/page.tsx`

- [ ] Task 3 — Aligner container `HeatmapGroupe` (AC: #6)
  - [ ] Container : borderRadius 10, borderWidth 1, borderColor divider, overflow hidden
  - [ ] Lignes zébrées surface/muted
  - [ ] Fichier : `aureak/apps/web/app/(admin)/activites/presences/page.tsx`

- [ ] Task 4 — QA scan
  - [ ] Vérifier try/finally sur tous les state loaders
  - [ ] Vérifier console guards `NODE_ENV !== 'production'`
  - [ ] TypeScript noEmit — zéro erreur
  - [ ] Screenshot Playwright avant/après

## Dev Notes

### Patterns de référence exacts

**EntraînementsTable container (source : `methodologie/seances/index.tsx`)**
```
tableWrapper : { borderRadius: 10, borderWidth: 1, borderColor: colors.border.divider, overflow: 'hidden' }
tableHeader  : { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, backgroundColor: colors.light.muted, borderBottomWidth: 1, borderBottomColor: colors.border.divider }
thText       : { fontSize: 10, fontWeight: '700', fontFamily: 'Montserrat', color: colors.text.subtle, textTransform: 'uppercase', letterSpacing: 1 }
tableRow     : { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, minHeight: 52, borderBottomWidth: 1, borderBottomColor: colors.border.divider }
rowBg        : idx % 2 === 0 ? colors.light.surface : colors.light.muted
```

**SegmentedToggle (source : `academie/joueurs/index.tsx`)**
```
toggleRow    : { flexDirection: 'row', gap: 0, alignSelf: 'flex-start', borderRadius: radius.xs, overflow: 'hidden', borderWidth: 1, borderColor: colors.border.light }
toggleBtn    : { paddingVertical: 8, paddingHorizontal: space.lg, backgroundColor: colors.light.surface }
toggleBtnActive : { backgroundColor: colors.accent.gold }
toggleLabel  : { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, color: colors.text.muted }
toggleLabelActive : { color: colors.text.dark }
```

### Fichiers à modifier

| Fichier | Changement |
|---|---|
| `aureak/apps/web/app/(admin)/activites/presences/page.tsx` | Réordonnement blocs + refonte styles tableaux |

### Ce qu'on ne touche PAS

- `ActivitesHeader.tsx` — déjà aligné (story 80.1)
- `FiltresScope.tsx` — inchangé
- `PseudoFiltresTemporels.tsx` — déjà aligné (story 80.1)
- `StatCardsPresences` : logique et données inchangées (seul l'ordre dans la page change)
- Logique de données dans les tableaux (heatmap rates, cellules colorées, tri)
- Routes et navigation inchangées
- Pas de migration DB (story purement UI)

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List

- `aureak/apps/web/app/(admin)/activites/presences/page.tsx`
