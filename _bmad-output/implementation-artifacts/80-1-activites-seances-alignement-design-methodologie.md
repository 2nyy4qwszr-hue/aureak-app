# Story 80.1 : Activités Séances — Alignement design Méthodologie

Status: done

## Story

En tant qu'admin,
je veux que la page Activités > Séances adopte exactement le même langage visuel que Méthodologie > Entraînements,
afin d'avoir une interface uniforme entre les sections.

## Acceptance Criteria

1. **SectionHeader** : `ActivitesHeader` a le même design que le `headerBlock` de `methodologie/seances/index.tsx`
   - Titre "ACTIVITÉS" : fontSize 24, fontWeight '700', fontFamily 'Montserrat', letterSpacing 0.5, color `colors.text.dark`
   - Bouton "+ Nouvelle séance" : `backgroundColor: colors.accent.gold`, `color: colors.text.dark`, fontWeight '700', fontSize 13 — comme `st.newBtn` / `st.newBtnLabel` de méthodologie
   - Tabs (SÉANCES / PRÉSENCES / ÉVALUATIONS) : row avec `borderBottomWidth: 1, borderBottomColor: colors.border.divider, gap: 24`, labels 11px, 700, uppercase, letterSpacing 1, `colors.text.subtle` inactif / `colors.accent.gold` actif, underline gold 2px absolue en bas de l'onglet actif

2. **Ordre des blocs dans `page.tsx`** : les filtres sont déplacés **sous** les StatCards
   - Avant : filtresRow → StatCards → TableauSeances
   - Après : StatCards → filtresRow → TableauSeances

3. **FiltresScope** (gauche) : inchangé fonctionnellement et visuellement

4. **PseudoFiltresTemporels** (droite) : redesign en TierPills
   - Même style de pill que `TierPills` dans `children/index.tsx` :
     - Pill active : `backgroundColor: colors.accent.gold`, `borderColor: colors.accent.gold`, text `colors.text.dark`
     - Pill inactive : `backgroundColor: colors.light.muted`, `borderColor: colors.border.light`, text `colors.text.muted`
     - `paddingHorizontal: 14`, `paddingVertical: 5`, `borderRadius: radius.badge`, `borderWidth: 1`
     - Text : fontSize 11, fontWeight '700', fontFamily 'Montserrat', letterSpacing 0.8
   - Valeurs inchangées : AUJOURD'HUI / À VENIR / PASSÉES

5. **TableauSeances** : même design container que `EntraînementsTable` de `methodologie/seances/index.tsx`
   - `tableWrapper` : `borderRadius: 10`, `borderWidth: 1`, `borderColor: colors.border.divider`, `overflow: 'hidden'`
   - `tableHeader` : `backgroundColor: colors.light.muted`, `borderBottomWidth: 1`, `borderBottomColor: colors.border.divider`, `paddingHorizontal: 16`, `paddingVertical: 10`
   - En-têtes colonnes : fontSize 10, fontWeight '700', fontFamily 'Montserrat', color `colors.text.subtle`, textTransform 'uppercase', letterSpacing 1
   - Lignes : zébrées `colors.light.surface` (pair) / `colors.light.muted` (impair), `minHeight: 52`, `paddingHorizontal: 16`, `borderBottomWidth: 1`, `borderBottomColor: colors.border.divider`
   - Noms de colonnes et logique de données : **inchangés** (STATUT, DATE, MÉTHODE, GROUPE, COACH, PRÉSENCE, BADGES, ANOMALIE)

## Tasks / Subtasks

- [x] Task 1 — Refonte `ActivitesHeader` (AC: #1)
  - [x] Modifier `pageTitle` : fontSize 24 → 24, fontWeight '900' → '700' (aligner sur méthodologie)
  - [x] Modifier `newBtn` : backgroundColor `colors.text.dark` → `colors.accent.gold`
  - [x] Modifier `newBtnText` : color `colors.accent.gold` → `colors.text.dark`
  - [x] Modifier `tabsRow` : ajouter `borderBottomWidth: 1, borderBottomColor: colors.border.divider`, `gap: 24`
  - [x] Modifier labels onglets : fontSize 13 → 11, letterSpacing 0.8 → 1, color `colors.text.subtle` inactif
  - [x] Supprimer `container` intermédiaire inutile (wrapper double View) — simplifier la structure
  - [x] Fichier : `aureak/apps/web/app/(admin)/activites/components/ActivitesHeader.tsx`

- [x] Task 2 — Réordonner les blocs dans `page.tsx` (AC: #2)
  - [x] Déplacer `<StatCards />` avant `<View style={styles.filtresRow}>`
  - [x] Fichier : `aureak/apps/web/app/(admin)/activites/page.tsx`

- [x] Task 3 — Redesign `PseudoFiltresTemporels` en TierPills (AC: #4)
  - [x] Remplacer les styles inline pill par le pattern TierPills (voir `children/index.tsx` lignes 877-940)
  - [x] Fichier : `aureak/apps/web/app/(admin)/activites/components/PseudoFiltresTemporels.tsx`

- [x] Task 4 — Refonte container `TableauSeances` (AC: #5)
  - [x] Appliquer `tableWrapper` style : borderRadius 10, borderWidth 1, borderColor divider, overflow hidden
  - [x] Appliquer `tableHeader` style : fond muted, border-bottom divider (déjà OK)
  - [x] Appliquer en-têtes colonnes : 10px, 700, Montserrat, uppercase, subtle, letterSpacing 1 (déjà OK)
  - [x] Appliquer lignes zébrées : surface/muted alternées, minHeight 52, paddingHorizontal 16 (déjà OK)
  - [x] **Ne pas modifié** : noms de colonnes, logique de données, tri, navigation
  - [x] Fichier : `aureak/apps/web/app/(admin)/activites/components/TableauSeances.tsx`

- [x] Task 5 — QA scan (AC: toutes)
  - [x] Vérifier try/finally sur tous les state loaders — OK
  - [x] Vérifier console guards `NODE_ENV !== 'production'` — OK
  - [x] TypeScript noEmit — zéro erreur

## Dev Notes

### Références design exactes

**Pattern headerBlock (source : `methodologie/seances/index.tsx` lignes 123–143, styles lignes 526–556)**
```
headerBlock  : { gap: 12 }
headerTopRow : { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }
pageTitle    : { fontSize: 24, fontWeight: '700', fontFamily: 'Montserrat', color: colors.text.dark, letterSpacing: 0.5 }
newBtn       : { backgroundColor: colors.accent.gold, paddingHorizontal: space.md, paddingVertical: 8, borderRadius: 8 }
newBtnLabel  : { color: colors.text.dark, fontWeight: '700', fontSize: 13 }
tabsRow      : { flexDirection: 'row', gap: 24, borderBottomWidth: 1, borderBottomColor: colors.border.divider }
tabLabel     : { fontSize: 11, fontWeight: '700', letterSpacing: 1, color: colors.text.subtle, paddingBottom: 10, textTransform: 'uppercase' }
tabLabelActive : { color: colors.accent.gold }
tabUnderline : { position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, backgroundColor: colors.accent.gold, borderRadius: 1 }
```

**Pattern TierPills (source : `children/index.tsx` lignes 877–940)**
```
pill active  : { paddingHorizontal: 14, paddingVertical: 5, borderRadius: radius.badge, backgroundColor: colors.accent.gold, borderWidth: 1, borderColor: colors.accent.gold }
pill inactive: { backgroundColor: colors.light.muted, borderColor: colors.border.light }
text active  : { fontSize: 11, fontWeight: '700', fontFamily: 'Montserrat', letterSpacing: 0.8, color: colors.text.dark }
text inactive: { color: colors.text.muted }
```

**Pattern EntraînementsTable (source : `methodologie/seances/index.tsx` lignes 651–694)**
```
tableWrapper : { borderRadius: 10, borderWidth: 1, borderColor: colors.border.divider, overflow: 'hidden' }
tableHeader  : { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, backgroundColor: colors.light.muted, borderBottomWidth: 1, borderBottomColor: colors.border.divider }
thText       : { fontSize: 10, fontWeight: '700', fontFamily: 'Montserrat', color: colors.text.subtle, textTransform: 'uppercase', letterSpacing: 1 }
tableRow     : { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, minHeight: 52, borderBottomWidth: 1, borderBottomColor: colors.border.divider }
rowBg        : idx % 2 === 0 ? colors.light.surface : colors.light.muted
```

### Fichiers à modifier

| Fichier | Changement |
|---|---|
| `aureak/apps/web/app/(admin)/activites/components/ActivitesHeader.tsx` | Refonte complète styles headerBlock |
| `aureak/apps/web/app/(admin)/activites/page.tsx` | Réordonner StatCards avant filtresRow |
| `aureak/apps/web/app/(admin)/activites/components/PseudoFiltresTemporels.tsx` | Redesign pills → TierPills pattern |
| `aureak/apps/web/app/(admin)/activites/components/TableauSeances.tsx` | Refonte styles tableWrapper/Header/Row |

### Ce qu'on ne touche PAS

- `FiltresScope.tsx` — aucun changement
- `StatCards.tsx` — aucun changement
- Logique de données dans `TableauSeances.tsx` — seulement les styles visuels
- Routes et navigation — inchangées
- Pas de migration DB (story purement UI)

### Règles absolues

- Styles UNIQUEMENT via `@aureak/theme` tokens (colors, space, radius, shadows)
- Pas de couleurs hardcodées
- Routing Expo Router inchangé

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

### File List

- `aureak/apps/web/app/(admin)/activites/components/ActivitesHeader.tsx`
- `aureak/apps/web/app/(admin)/activites/page.tsx`
- `aureak/apps/web/app/(admin)/activites/components/PseudoFiltresTemporels.tsx`
- `aureak/apps/web/app/(admin)/activites/components/TableauSeances.tsx`
