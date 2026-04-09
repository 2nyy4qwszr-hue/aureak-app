# Story 80.3 : Activités Évaluations — Alignement design Séances

Status: done

## Story

En tant qu'admin,
je veux que la page Activités > Évaluations adopte exactement le même langage visuel que Activités > Séances (story 80.1),
afin d'avoir une interface uniforme entre les 3 onglets Activités.

## Acceptance Criteria

1. **SectionHeader** : déjà partagé via `ActivitesHeader` — aucun changement

2. **Ordre des blocs** : StatCards AVANT les filtres (comme Séances/Présences)
   - Avant : filtresRow → playerSummary → StatCards → evalTypePills → contenu
   - Après : StatCards → filtresRow → evalTypePills → contenu (playerSummary reste avant filtres si scope=joueur)

3. **FiltresScope** (gauche) : inchangé — composant partagé

4. **SegmentedToggle** (droite) : déjà partagé via `PseudoFiltresTemporels` — aucun changement

5. **EvalType pills** (BADGES / CONNAISSANCES / COMPÉTENCES) → redesign en **SegmentedToggle**
   - Même pattern que `toggleRow` de `academie/joueurs/index.tsx` (AUREAK/PROSPECT)
   - Container unique : `flexDirection: 'row', gap: 0, alignSelf: 'flex-start', borderRadius: radius.xs, overflow: 'hidden', borderWidth: 1, borderColor: colors.border.light`
   - Segment actif : `backgroundColor: colors.accent.gold`
   - Segment inactif : `backgroundColor: colors.light.surface`
   - Label actif : `color: colors.text.dark`
   - Label inactif : `fontSize: 11, fontWeight: '700', letterSpacing: 0.8, color: colors.text.muted`
   - Position : sous FiltresScope, sur sa propre ligne

6. **Tableau évaluations** (vue badges) : aligner container sur EntraînementsTable
   - `tableContainer` : `borderRadius: 10`, `borderWidth: 1`, `borderColor: colors.border.divider`, `overflow: 'hidden'`
   - `tableHeader` : `paddingHorizontal: 16`, `paddingVertical: 10`, `backgroundColor: colors.light.muted`
   - En-têtes colonnes : `fontFamily: 'Montserrat'` (actuellement `fonts.body`)
   - `tableRow` : `paddingHorizontal: 16` (actuellement `space.md`)
   - Lignes zébrées déjà en place (via `tableRowAlt`) — OK

7. **Pagination** : aligner sur le style Séances (fond muted, border-top divider)

## Tasks / Subtasks

- [x] Task 1 — Réordonner les blocs dans le rendu (AC: #2)
  - [x] Déplacer `statCardsRow` avant `filtresRow`
  - [x] Garder `playerSummary` avant filtres (scope joueur)
  - [x] Fichier : `aureak/apps/web/app/(admin)/activites/evaluations/page.tsx`

- [x] Task 2 — Redesign evalTypePills → SegmentedToggle (AC: #5)
  - [x] Remplacer les 3 pills séparées par un `toggleRow` container unique
  - [x] Styles `toggleBtn` / `toggleBtnActive` / `toggleLabel` / `toggleLabelActive` identiques à `academie/joueurs/index.tsx`
  - [x] Supprimer les anciens styles `evalTypePill*`
  - [x] Fichier : `aureak/apps/web/app/(admin)/activites/evaluations/page.tsx`

- [x] Task 3 — Aligner tableau évaluations (AC: #6)
  - [x] `tableContainer` : borderRadius 10 (pas `radius.card`)
  - [x] `colHeader` : fontFamily 'Montserrat' (pas `fonts.body`)
  - [x] `tableRow` + `tableHeader` : paddingHorizontal 16
  - [x] Fichier : `aureak/apps/web/app/(admin)/activites/evaluations/page.tsx`

- [x] Task 4 — Aligner pagination (AC: #7)
  - [x] `pagination` : ajouter `backgroundColor: colors.light.muted`
  - [x] Fichier : `aureak/apps/web/app/(admin)/activites/evaluations/page.tsx`

- [x] Task 5 — QA scan
  - [x] Vérifier try/finally sur tous les state loaders
  - [x] Vérifier console guards `NODE_ENV !== 'production'`
  - [x] TypeScript noEmit — zéro erreur
  - [ ] Screenshot Playwright avant/après (app non démarrée — skipped)

## Dev Notes

### Patterns de référence exacts

**SegmentedToggle (source : `academie/joueurs/index.tsx`)**
```
toggleRow       : { flexDirection: 'row', gap: 0, alignSelf: 'flex-start', borderRadius: radius.xs, overflow: 'hidden', borderWidth: 1, borderColor: colors.border.light }
toggleBtn       : { paddingVertical: 8, paddingHorizontal: space.lg, backgroundColor: colors.light.surface }
toggleBtnActive : { backgroundColor: colors.accent.gold }
toggleLabel     : { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, color: colors.text.muted }
toggleLabelActive : { color: colors.text.dark }
```

**EntraînementsTable container (source : `methodologie/seances/index.tsx`)**
```
tableWrapper : { borderRadius: 10, borderWidth: 1, borderColor: colors.border.divider, overflow: 'hidden' }
tableHeader  : { paddingHorizontal: 16, paddingVertical: 10, backgroundColor: colors.light.muted }
thText       : { fontSize: 10, fontWeight: '700', fontFamily: 'Montserrat', color: colors.text.subtle, textTransform: 'uppercase', letterSpacing: 1 }
tableRow     : { paddingHorizontal: 16, minHeight: 52, borderBottomWidth: 1, borderBottomColor: colors.border.divider }
rowBg        : idx % 2 === 0 ? colors.light.surface : colors.light.muted
```

### Fichiers à modifier

| Fichier | Changement |
|---|---|
| `aureak/apps/web/app/(admin)/activites/evaluations/page.tsx` | Réordonnement + SegmentedToggle + table styles |

### Ce qu'on ne touche PAS

- `ActivitesHeader.tsx` — déjà aligné (story 80.1)
- `FiltresScope.tsx` — inchangé
- `PseudoFiltresTemporels.tsx` — déjà aligné (story 80.1)
- `StatCard` local : logique et données inchangées
- Logique de données (évals, signaux, scores, NoteCircle, PlayerAvatar)
- Colonnes et contenu du tableau
- PlaceholderModule (connaissances/compétences)
- Routes et navigation inchangées
- Pas de migration DB (story purement UI)

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6 (1M context)

### Debug Log References
- tsc --noEmit : zero errors

### Completion Notes List
- Task 1: Reordered blocks — playerSummary + StatCards before filtresRow
- Task 2: evalTypePills replaced with SegmentedToggle (toggleRow/toggleBtn/toggleBtnActive/toggleLabel/toggleLabelActive)
- Task 3: tableContainer borderRadius 10, colHeader Montserrat, paddingHorizontal 16
- Task 4: pagination backgroundColor muted + borderTop divider
- Task 5: QA pass — try/finally OK, console guards OK, tsc zero errors

### File List

- `aureak/apps/web/app/(admin)/activites/evaluations/page.tsx`
