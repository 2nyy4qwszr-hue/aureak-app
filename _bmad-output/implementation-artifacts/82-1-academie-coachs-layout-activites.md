# Story 82.1 : Académie Coachs — Appliquer LayoutActivités

Status: done

## Story

En tant qu'admin,
je veux que la page Académie > Coachs adopte le **LayoutActivités** (même design que Activités > Séances),
afin d'avoir une interface uniforme entre toutes les sections principales.

## Définition LayoutActivités appliquée à Coachs

Le template de page standard Aureak, composé de 4 zones dans cet ordre :

1. **headerBlock** — titre 24/700 Montserrat + bouton gold
2. **StatCards** — 4 cards horizontales avec picto, fond surface, border divider
3. **FiltresRow** — pill TOUS (gauche) + SegmentedToggle COACH/ASSISTANT (droite)
4. **CoachsTable** — borderRadius 10, header muted Montserrat, lignes zébrées

> Note : la `AcademieNavBar` (onglets JOUEURS / COACHS / etc.) est déjà rendue par `academie/_layout.tsx` — elle n'est pas dans la page.

## État actuel de Académie Coachs

| Zone | Actuel | Cible |
|---|---|---|
| Header | Titre `h2` variant `Coachs` + bouton `colors.text.dark` (noir) | Titre 24/700 Montserrat `COACHS` + bouton `colors.accent.gold` |
| StatCards | 4 cards `stat.card` (`flex: 1`, pas de border divider, pas de picto, value 28px/700) | 4 cards LayoutActivités (surface, divider border, picto + label uppercase 10 + count 28/900) |
| Filtres | `FilterChip` séparés COACH / ASSISTANT (pill individuelle) | pill `TOUS` active/inactive + `SegmentedToggle` COACH/ASSISTANT |
| Table | Pas de `tableWrapper`, `rowHeader` sans fond muted, `colHeader` sans Montserrat, `paddingHorizontal: space.sm` | `tableWrapper` borderRadius 10, header muted Montserrat uppercase, `paddingHorizontal: 16` |
| Pagination | `borderTopColor: colors.border.light`, pas de `backgroundColor` | `backgroundColor: colors.light.muted` + `borderTopColor: colors.border.divider` |

## Acceptance Criteria

1. **headerBlock** :
   - Titre `COACHS` : `fontSize: 24, fontWeight: '700', fontFamily: 'Montserrat', color: colors.text.dark`
   - Bouton `+ Nouveau coach` : `backgroundColor: colors.accent.gold` (était `colors.text.dark`), label `color: colors.text.dark, fontWeight: '700', fontSize: 13`
   - Même structure que `methodologie/seances/index.tsx` `headerTopRow`

2. **StatCards** — 4 cards redesignées :
   - Row container : `flexDirection: 'row', gap: space.md, paddingHorizontal: space.lg, paddingVertical: space.md, flexWrap: 'wrap'`
   - Chaque card : `backgroundColor: colors.light.surface, borderRadius: radius.card, padding: space.md, borderWidth: 1, borderColor: colors.border.divider, minWidth: 160, boxShadow: shadows.sm`
   - Picto emoji (grand, top) + label uppercase 10px Montserrat 700 muted + count 28px 900 coloré
   - Cards :
     - 👤 `COACHS` — `coaches.length` — `colors.text.dark`
     - 🏆 `GRADE OR+` — coachs avec `grade_level` `gold` ou `platinum` — `colors.accent.gold`
     - 🎓 `DIPLÔMÉS` — `—` (non implémenté) — `colors.text.muted`
     - ⭐ `SCORE ACADÉMIE` — `academyScore` — `colors.accent.gold`

3. **FiltresRow** :
   - Structure : `flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'`
   - Gauche : pill `TOUS`
     - Active (roleFilter === 'all') : `backgroundColor: colors.accent.gold, borderColor: colors.accent.gold`
     - Inactive : `backgroundColor: colors.light.muted, borderColor: colors.border.light`
     - `paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.badge`
     - Texte : `fontSize: 12, fontWeight: '600', fontFamily: 'Montserrat'`
     - Action : `setRoleFilter('all')`
   - Droite : SegmentedToggle COACH / ASSISTANT
     - Pattern exact `toggleRow/toggleBtn/toggleBtnActive/toggleLabel/toggleLabelActive` de `academie/joueurs/index.tsx`
     - Supprimer l'ancien composant `FilterChip` + ses styles `chip.*`

4. **CoachsTable** :
   - Wrapper : `borderRadius: 10, borderWidth: 1, borderColor: colors.border.divider, overflow: 'hidden'`
   - Header : `paddingHorizontal: 16, paddingVertical: 10, backgroundColor: colors.light.muted, borderBottomWidth: 1, borderBottomColor: colors.border.divider`
   - Colonnes header (`thText`) : `fontSize: 10, fontWeight: '700', fontFamily: 'Montserrat', color: colors.text.subtle, textTransform: 'uppercase', letterSpacing: 1`
   - Lignes : `paddingHorizontal: 16` (était `space.sm`), `minHeight: 52`
   - Zébré : `idx % 2 === 0 → colors.light.surface, sinon → colors.light.muted`

5. **Pagination** :
   - `backgroundColor: colors.light.muted`
   - `borderTopWidth: 1, borderTopColor: colors.border.divider`
   - Boutons : `backgroundColor: colors.light.surface, borderWidth: 1, borderColor: colors.border.light`

6. **QA** :
   - try/finally sur le loader
   - console guards `NODE_ENV !== 'production'`
   - Supprimer `FilterChip` composant local + styles `chip.*`
   - Supprimer le style `stat.*` (remplacé par `st.*`)
   - TypeScript noEmit — zéro erreur

## Tasks / Subtasks

- [x] Task 1 — Redesign headerBlock (AC: #1)
  - [x] Titre 24/700 Montserrat `COACHS`
  - [x] Bouton gold (backgroundColor → `colors.accent.gold`, label `colors.text.dark`)
  - [x] Fichier : `aureak/apps/web/app/(admin)/academie/coachs/index.tsx`

- [x] Task 2 — Redesign StatCards (AC: #2)
  - [x] Row flex + gap space.md + paddingHorizontal space.lg
  - [x] 4 cards : surface/divider/radius.card/minWidth 160/boxShadow sm
  - [x] Picto + label uppercase 10px Montserrat + count 28px 900
  - [x] Compute `goldPlusCount` = `coaches.filter(c => c.grade && ['gold','platinum'].includes(c.grade.grade_level)).length`
  - [x] Fichier : `aureak/apps/web/app/(admin)/academie/coachs/index.tsx`

- [x] Task 3 — FiltresRow : pill TOUS + SegmentedToggle (AC: #3)
  - [x] Remplacer `filtresRow + FilterChip` par pill `TOUS` (gauche) + toggleRow COACH/ASSISTANT (droite)
  - [x] Pill TOUS active quand `roleFilter === 'all'`, action = `setRoleFilter('all')`
  - [x] SegmentedToggle : COACH active quand `roleFilter === 'coach'`, ASSISTANT quand `roleFilter === 'assistant'`
  - [x] Supprimer composant `FilterChip` + styles `chip.*`
  - [x] Fichier : `aureak/apps/web/app/(admin)/academie/coachs/index.tsx`

- [x] Task 4 — CoachsTable : alignement design (AC: #4, #5)
  - [x] Wrapper `tableWrapper` : borderRadius 10, borderColor divider, overflow hidden
  - [x] Header `tableHeader` : paddingHorizontal 16, paddingVertical 10, backgroundColor muted
  - [x] `thText` : fontFamily Montserrat, textTransform uppercase, color subtle
  - [x] Lignes : paddingHorizontal 16, minHeight 52, zébré surface/muted
  - [x] Pagination : backgroundColor muted + borderTop divider
  - [x] Fichier : `aureak/apps/web/app/(admin)/academie/coachs/index.tsx`

- [x] Task 5 — QA scan
  - [x] try/finally sur le loader (vérifier le cancel pattern existant)
  - [x] console guards
  - [x] Supprimer styles orphelins `stat.*`
  - [x] TypeScript noEmit — zéro erreur

## Dev Notes

### Patterns de référence exacts

**headerBlock (source : `methodologie/seances/index.tsx`)**
```
headerTopRow : { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }
pageTitle    : { fontSize: 24, fontWeight: '700', fontFamily: 'Montserrat', color: colors.text.dark }
newBtn       : { backgroundColor: colors.accent.gold, paddingHorizontal: space.md, paddingVertical: 8, borderRadius: 8 }
newBtnLabel  : { color: colors.text.dark, fontWeight: '700', fontSize: 13 }
```

**StatCards (source : `methodologie/seances/index.tsx`)**
```
statCardsRow : { flexDirection: 'row', gap: space.md, paddingHorizontal: space.lg, paddingVertical: space.md, flexWrap: 'wrap' }
statCard     : { backgroundColor: colors.light.surface, borderRadius: radius.card, padding: space.md, borderWidth: 1, borderColor: colors.border.divider, minWidth: 160, alignItems: 'center', gap: 4, boxShadow: shadows.sm }
statCardPicto: { fontSize: 22, marginBottom: 2 }
statCardLabel: { fontSize: 10, fontFamily: 'Montserrat', fontWeight: '700', color: colors.text.muted, letterSpacing: 1, textTransform: 'uppercase', textAlign: 'center' }
statCardValue: { fontSize: 28, fontFamily: 'Montserrat', fontWeight: '900' }  ← color par card
```

**FiltresScope pills (source : `methodologie/seances/index.tsx`)**
```
pillActive   : { paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.badge, backgroundColor: colors.accent.gold, borderWidth: 1, borderColor: colors.accent.gold }
pillInactive : { paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.badge, backgroundColor: colors.light.muted, borderWidth: 1, borderColor: colors.border.light }
pillTextActive  : { fontSize: 12, fontWeight: '600', fontFamily: 'Montserrat', color: colors.text.dark }
pillTextInactive: { fontSize: 12, fontWeight: '600', fontFamily: 'Montserrat', color: colors.text.muted }
```

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
tableHeader  : { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, backgroundColor: colors.light.muted, borderBottomWidth: 1, borderBottomColor: colors.border.divider }
thText       : { fontSize: 10, fontWeight: '700', fontFamily: 'Montserrat', color: colors.text.subtle, textTransform: 'uppercase', letterSpacing: 1 }
tableRow     : { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, minHeight: 52, borderBottomWidth: 1, borderBottomColor: colors.border.divider }
rowBg        : idx % 2 === 0 ? colors.light.surface : colors.light.muted
```

### Logique fonctionnelle à préserver

- `listCoaches + getCoachCurrentGrade` — chargement inchangé
- `roleFilter` : `'all' | 'coach' | 'assistant'` — logique existante
- Pagination (`page`, `PAGE_SIZE = 25`) — inchangée
- `splitName` helper — inchangé
- `GRADE_VALUES`, `GRADE_LABELS`, `GRADE_COLORS` — inchangés
- `academyScore` calcul — inchangé

### Fichiers à modifier

| Fichier | Changement |
|---|---|
| `aureak/apps/web/app/(admin)/academie/coachs/index.tsx` | Redesign header + StatCards + FiltresRow + table |

### Ce qu'on ne touche PAS

- `AcademieNavBar` + `_layout.tsx` — inchangés
- `listCoaches`, `getCoachCurrentGrade` — API inchangée
- Logique de données (grades, pagination, filtrage, router.push)
- Colonnes du tableau (STATUT, NOM, PRÉNOM, IMPLANTATION, GRADE, DIPLÔMÉ, FORMATION)
- Routing `/coaches/new` et `/coaches/[id]` — inchangés
- Pas de migration DB (story purement UI)
