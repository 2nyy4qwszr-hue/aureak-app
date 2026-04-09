# Story 81.1 : Méthodologie Entraînements — Appliquer LayoutActivités

Status: done

## Story

En tant qu'admin,
je veux que la page Méthodologie > Entraînements adopte le **LayoutActivités** (même layout que Activités > Séances),
afin d'avoir une interface uniforme entre les sections principales.

## Définition LayoutActivités

Le template de page standard Aureak, composé de 5 zones dans cet ordre :

1. **SectionHeader** — headerBlock (titre + bouton + tabs gold underline)
2. **StatCards** — cards horizontales avec icônes, fond surface, border divider
3. **FiltresRow** — FiltresScope (gauche, pills avec dropdowns) + SegmentedToggle (droite, container unique gold/surface)
4. **EntraînementsTable** — borderRadius 10, header muted Montserrat, lignes zébrées
5. **Recherche** — searchCompact à droite dans la zone filtres (inchangée)

## État actuel de Méthodologie Entraînements

| Zone | Actuel | Cible |
|---|---|---|
| SectionHeader | headerBlock ✅ déjà OK | Garder tel quel |
| Stats | `statsRow` : 7 blocs inline petits (count + label) | Redesign en **StatCards** (même look que `activites/components/StatCards.tsx`) |
| Filtres gauche | filterBar avec tabs underline (GLOBAL, MÉTHODE ▾) | **FiltresScope pills** : GLOBAL + MÉTHODE ▾ en pills avec dropdown |
| Filtres droite | filterBar tabs underline (ENTRAÎNEMENT/EXERCICE/ACADÉMIQUE/STAGE) | **2 SegmentedToggles** : ENTRAÎNEMENT/EXERCICE + ACADÉMIE/STAGE |
| Recherche | searchCompact inline dans filterBar | Garder searchCompact, le placer à droite des filtres |
| Table | EntraînementsTable ✅ déjà OK | Garder tel quel |

## Acceptance Criteria

1. **SectionHeader** : inchangé — headerBlock déjà conforme

2. **Ordre des blocs** :
   - Avant : headerBlock → statsRow → filterBar (tout mélangé) → table
   - Après : headerBlock → StatCards → filtresRow (FiltresScope + SegmentedToggles + search) → table

3. **StatCards** : redesign des 7 stats méthodes en cards horizontales
   - Même container que `activites/components/StatCards.tsx` (row flex, gap space.md, paddingHorizontal space.lg)
   - Chaque card : fond `colors.light.surface`, `borderRadius: radius.card`, `borderWidth: 1`, `borderColor: colors.border.divider`, `padding: space.md`
   - Icône picto méthode en haut, label uppercase 10px Montserrat, count 28px 900 coloré par méthode
   - 4 cards max visibles (les 3 restantes en scroll ou wrap)

4. **FiltresScope gauche** : pills FiltresScope design
   - GLOBAL : pill active = gold bg, inactive = muted bg (comme "Toutes" dans FiltresScope)
   - MÉTHODE ▾ : pill avec dropdown (même design que "Implantation ▾" dans FiltresScope)
   - Même styles : `paddingHorizontal: 14, paddingVertical: 6, borderRadius: radius.badge, fontSize: 12, fontWeight: '600', fontFamily: 'Montserrat'`

5. **SegmentedToggle droite** : 2 toggles séparés
   - Toggle 1 : ENTRAÎNEMENT / EXERCICE (content type)
   - Toggle 2 : ACADÉMIE / STAGE (context type)
   - Pattern exact `toggleRow/toggleBtn/toggleBtnActive/toggleLabel/toggleLabelActive` de `academie/joueurs/index.tsx`

6. **Recherche** : searchCompact inchangé visuellement, placé à droite dans la ligne filtres (après les toggles)

7. **Table** : inchangée — EntraînementsTable est déjà la référence

## Tasks / Subtasks

- [x] Task 1 — Redesign statsRow → StatCards (AC: #3)
  - [x] Remplacer les 7 blocs inline par des cards (fond surface, border divider, borderRadius card)
  - [x] Icône méthode + label uppercase + count coloré par méthode
  - [x] Row flex avec wrap pour gérer les 7 cards
  - [x] Fichier : `aureak/apps/web/app/(admin)/methodologie/seances/index.tsx`

- [x] Task 2 — Redesign filterBar → filtresRow (AC: #2, #4, #5, #6)
  - [x] Créer une `<View style={filtresRow}>` avec :
    - Gauche : GLOBAL pill + MÉTHODE ▾ pill (FiltresScope design)
    - Droite : SegmentedToggle ENTRAÎNEMENT/EXERCICE + SegmentedToggle ACADÉMIE/STAGE + searchCompact
  - [x] GLOBAL : pill active gold / inactive muted
  - [x] MÉTHODE ▾ : pill avec dropdown (garder la logique `methodDropOpen` existante)
  - [x] Supprimer les anciens styles `filterBar`, `filterTab*`, `filterTabWrap`, `filterTabUnderline`
  - [x] Fichier : `aureak/apps/web/app/(admin)/methodologie/seances/index.tsx`

- [x] Task 3 — QA scan
  - [x] Vérifier try/finally sur tous les state loaders
  - [x] Vérifier console guards `NODE_ENV !== 'production'`
  - [x] TypeScript noEmit — zéro erreur

## Dev Notes

### Patterns de référence exacts

**StatCards (source : `activites/components/StatCards.tsx`)**
```
row  : { flexDirection: 'row', gap: space.md, paddingHorizontal: space.lg, paddingVertical: space.md, flexWrap: 'wrap' }
card : { backgroundColor: colors.light.surface, borderRadius: radius.card, padding: space.md, borderWidth: 1, borderColor: colors.border.divider, minWidth: 160, boxShadow: shadows.sm }
label: { fontSize: 10, fontFamily: 'Montserrat', fontWeight: '700', color: colors.text.muted, letterSpacing: 1, textTransform: 'uppercase' }
value: { fontSize: 28, fontFamily: 'Montserrat', fontWeight: '900', color: colors.text.dark }
```

**FiltresScope pills (source : `activites/components/FiltresScope.tsx`)**
```
pill active  : { paddingHorizontal: 14, paddingVertical: 6, borderRadius: radius.badge, backgroundColor: colors.accent.gold, borderWidth: 1, borderColor: colors.accent.gold }
pill inactive: { backgroundColor: colors.light.muted, borderColor: colors.border.light }
text active  : { fontSize: 12, fontWeight: '600', fontFamily: 'Montserrat', color: colors.text.dark }
text inactive: { color: colors.text.muted }
dropdown     : { position: absolute, top: 38, zIndex: 9999, backgroundColor: colors.light.surface, borderRadius: radius.xs, borderWidth: 1, borderColor: colors.border.light, boxShadow: shadows.lg }
```

**SegmentedToggle (source : `academie/joueurs/index.tsx`)**
```
toggleRow       : { flexDirection: 'row', gap: 0, alignSelf: 'flex-start', borderRadius: radius.xs, overflow: 'hidden', borderWidth: 1, borderColor: colors.border.light }
toggleBtn       : { paddingVertical: 8, paddingHorizontal: space.lg, backgroundColor: colors.light.surface }
toggleBtnActive : { backgroundColor: colors.accent.gold }
toggleLabel     : { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, color: colors.text.muted }
toggleLabelActive : { color: colors.text.dark }
```

### Logique fonctionnelle à préserver

- `methodFilter` (all | MethodologyMethod) → dropdown méthode
- `contextFilter` (all | academie | stage) → toggle ACADÉMIE/STAGE
- `contentType` (entrainement | exercice) → toggle ENTRAÎNEMENT/EXERCICE
- `search` → searchCompact
- `methodDropOpen` → dropdown state
- GLOBAL = `methodFilter === 'all' && contextFilter === 'all'`
- Toute la logique de tri, pagination, suppression : **inchangée**

### Fichiers à modifier

| Fichier | Changement |
|---|---|
| `aureak/apps/web/app/(admin)/methodologie/seances/index.tsx` | Redesign statsRow + filterBar → LayoutActivités |

### Ce qu'on ne touche PAS

- SectionHeader (headerBlock) — déjà conforme
- EntraînementsTable / ExercicesTable — inchangées
- NAV_TABS (5 onglets) — inchangés
- Logique de données (sessions, exercises, counts, filters, pagination)
- ConfirmDialog suppression
- Dropdown méthodes (logique) — seul le DESIGN de la pill trigger change
- Routes et navigation
- Pas de migration DB

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6 (1M context)

### Debug Log References
- TypeScript noEmit: 0 errors
- QA: try/finally on all 3 state loaders (loadSessions, loadExercises, handleDelete)
- QA: console guard on 1 console.error (handleDelete)

### Completion Notes List
- statsRow redesigned to StatCards: 7 method cards with surface bg, divider border, icon + uppercase label + colored count (28px 900), flex wrap row
- filterBar redesigned to filtresRow: left = GLOBAL pill + METHODE pill (FiltresScope design with dropdown), right = 2 SegmentedToggles (ENTRAINEMENT/EXERCICE + ACADEMIE/STAGE) + searchCompact
- All old styles removed: statsRow, statBlock, statCount, statLabel, filterBar, filterTabWrap, filterTab, filterTabActive, filterTabUnderline
- Dropdown repositioned as absolute inside dropdownWrapper (zIndex 9999)
- All functional logic preserved: methodFilter, contextFilter, contentType, search, methodDropOpen, pagination, deletion

### File List

- `aureak/apps/web/app/(admin)/methodologie/seances/index.tsx`
