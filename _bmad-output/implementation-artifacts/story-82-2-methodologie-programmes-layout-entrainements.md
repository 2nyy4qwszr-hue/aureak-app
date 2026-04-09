# Story 82.2 : Méthodologie Programmes — Refonte layout alignement Entraînements

Status: done

## Story

En tant qu'admin,
je veux que la page Programmes de Méthodologie ait le même design que la page Entraînements,
afin d'obtenir une cohérence visuelle dans tout le module Méthodologie.

## Acceptance Criteria

1. La section stats de la page Programmes affiche 7 cards méthodes horizontales (picto emoji + label méthode + valeur count colorée), identiques aux `statCardsRow` de la page Entraînements.
2. La section filtres de la page Programmes utilise le layout 3 colonnes (gauche : pills GLOBAL + MÉTHODE dropdown | droite : toggle SegmentedToggle ACADÉMIE / STAGE), identique au `filtresRow` de la page Entraînements — le toggle ENTRAÎNEMENT/EXERCICE est absent (non pertinent pour Programmes).
3. Le dropdown MÉTHODE est positionné en absolu sous sa pill (pattern `dropdownWrapper`), identique à Entraînements.
4. L'ancien `filterBar` underline-style (GLOBAL / MÉTHODE / ACADÉMIQUE / STAGE / recherche) est remplacé.
5. L'ancien `statsRow` compact (blocs `statBlock` avec count + label en inline) est remplacé.
6. La barre de recherche est intégrée dans les filtres (à droite du toggle STAGE, ou dans `filtresRight`).
7. La table `ProgrammesTable` (colonnes MÉTHODE / TITRE / SAISON / ACCOMPLISSEMENT / chevron) reste inchangée.
8. Le header (titre MÉTHODOLOGIE + nav tabs 5 onglets + bouton "+ Nouveau programme") reste inchangé.
9. Le `content` wrapper utilise `{ padding: space.lg, gap: space.md, maxWidth: 1200, alignSelf: 'center', width: '100%' }` (identique à Entraînements).
10. Aucune couleur hardcodée n'est introduite — tous les styles utilisent des tokens `@aureak/theme`.

## Tasks / Subtasks

- [x] T1 — Remplacer `statsRow` + `statBlock` par `statCardsRow` + `statCard` (AC: 1, 5, 10)
  - [x] T1.1 — Remplacer la `<View style={st.statsRow}>` par `<View style={st.statCardsRow}>`
  - [x] T1.2 — Remplacer le contenu interne `statBlock` (count + label inline) par le pattern card (picto + label + valeur) de Entraînements
  - [x] T1.3 — Supprimer les styles `statsRow`, `statBlock`, `statCount`, `statLabel` (remplacés)
  - [x] T1.4 — Ajouter les styles `statCardsRow`, `statCard`, `statCardPicto`, `statCardLabel`, `statCardValue` (copier depuis `seances/index.tsx`)

- [x] T2 — Remplacer `filterBar` underline-style par `filtresRow` pills + toggles (AC: 2, 3, 4, 6, 10)
  - [x] T2.1 — Supprimer la `<View style={st.filterBar}>` et tout son contenu (GLOBAL/MÉTHODE/ACADÉMIQUE/STAGE underline + recherche)
  - [x] T2.2 — Supprimer le bloc `{methodDropOpen && (<View style={st.methodDropdown}>...)}` standalone (le dropdown sera intégré dans `dropdownWrapper`)
  - [x] T2.3 — Ajouter le `filtresRow` layout 2 colonnes (gauche + droite)
  - [x] T2.4 — Ajouter la recherche dans `filtresRight` (après le toggle)
  - [x] T2.5 — Supprimer les styles `filterBar`, `filterTabWrap`, `filterTab`, `filterTabActive`, `filterTabUnderline`
  - [x] T2.6 — Ajouter les styles `filtresRow`, `filtresLeft`, `filtresRight`, `pillActive`, `pillInactive`, `pillTextActive`, `pillTextInactive`, `dropdownWrapper`, `toggleRow`, `toggleBtn`, `toggleBtnActive`, `toggleLabel`, `toggleLabelActive`
  - [x] T2.7 — Mettre à jour le style `methodDropdown` : `position: 'absolute'`, `top: 38`, `left: 0`, `zIndex: 9999`

- [x] T3 — Harmoniser le wrapper `content` (AC: 9)
  - [x] T3.1 — `st.content` vérifié : `{ padding: space.lg, gap: space.md, maxWidth: 1200, alignSelf: 'center', width: '100%' }` — déjà aligné

- [x] T4 — Nettoyage imports (AC: 10)
  - [x] T4.1 — `TextInput` reste importé (utilisé pour `searchCompact`)
  - [x] T4.2 — `type TextStyle` reste importé (utilisé dans les styles conditionnels)

- [x] T5 — QA (AC: tous)
  - [x] T5.1 — Grep `filterBar\|filterTabWrap\|filterTab\b\|statsRow\|statBlock\|statCount` → 0 occurrence
  - [x] T5.2 — Grep `#[0-9a-fA-F]` → 0 couleur hex introduite
  - [x] T5.3 — Grep `console\.` → wrappé `process.env.NODE_ENV !== 'production'`

## Dev Notes

### Fichier source de référence (pattern à copier)

`aureak/apps/web/app/(admin)/methodologie/seances/index.tsx`

Sections à reproduire :
- `statCardsRow` + `statCard` + `statCardPicto` + `statCardLabel` + `statCardValue` (lignes ~544–582)
- `filtresRow` + `filtresLeft` + `filtresRight` (lignes ~584–604)
- `pillActive` + `pillInactive` + `pillTextActive` + `pillTextInactive` (lignes ~606–635)
- `dropdownWrapper` (lignes ~637–641)
- `toggleRow` + `toggleBtn` + `toggleBtnActive` + `toggleLabel` + `toggleLabelActive` (lignes ~643–668)
- `methodDropdown` absolu (lignes ~671–684)

### Différences vs Entraînements

| Élément | Entraînements | Programmes |
|---------|---------------|------------|
| Toggle centre | ENTRAÎNEMENT / EXERCICE | Absent (pas pertinent) |
| Toggle droit | ACADÉMIE / STAGE | ACADÉMIE / STAGE (identique) |
| Recherche | Absent | `TextInput searchCompact` dans `filtresRight` |
| Table | EntraînementsTable / ExercicesTable | ProgrammesTable (inchangée) |
| Bouton header | "+ Nouvel entraînement" | "+ Nouveau programme" (inchangé) |

### Fichiers à créer / modifier

| Fichier | Action | Notes |
|---------|--------|-------|
| `aureak/apps/web/app/(admin)/methodologie/programmes/index.tsx` | Modifier | Remplacement statsRow + filterBar |

### Fichiers à NE PAS modifier

- `aureak/apps/web/app/(admin)/methodologie/seances/index.tsx` — source de référence uniquement
- `aureak/apps/web/app/(admin)/methodologie/programmes/new.tsx` — non impacté
- `aureak/apps/web/app/(admin)/methodologie/programmes/[programmeId]/` — non impacté
- `aureak/packages/api-client/src/methodology.ts` — aucun changement API
- `supabase/migrations/` — changement UI pur

### Dépendances

Aucune dépendance story bloquante. Modification isolée sur un seul fichier.

### Multi-tenant

Sans impact — aucune donnée RLS concernée, modification UI pure.
