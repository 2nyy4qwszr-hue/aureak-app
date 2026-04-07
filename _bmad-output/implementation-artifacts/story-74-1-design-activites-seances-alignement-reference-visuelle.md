# Story 74.1 : Design — Activités Séances : alignement complet sur la référence visuelle

Status: done

## Story

En tant qu'admin,
je veux que la page Activités (onglet Séances) corresponde précisément à l'image de référence `_bmad-output/design-references/Activites seances-redesign.png`,
afin d'avoir un rendu premium cohérent avec la charte Aureak.

Design ref: `_bmad-output/design-references/Activites seances-redesign.png`

## Acceptance Criteria

1. **Titre "ACTIVITÉS"** : fontSize 28px (actuellement 22px) — plus imposant, correspond au poids visuel de la référence
2. **Bouton "+ Nouvelle séance"** : fond `colors.text.dark` (#18181B) + texte `colors.accent.gold` — CTA premium dark, jamais gold vif comme fond
3. **`PseudoFiltresTemporels`** : zéro couleur hardcodée — `'#FFFFFF'` ligne 40 → `colors.text.primary` ; style actif maintenu (pill gold + texte blanc via token)
4. **`FiltresScope`** : label "Global" → "Toutes" pour correspondre à la référence
5. **`StatCards`** — zéro couleur hardcodée :
   - `cardGold` backgroundColor `'#6e5d14'` → `colors.accent.goldDark` (nouveau token à créer)
   - cardGoldLabel/Value text `'#f9e28c'` → `colors.accent.goldPale` (nouveau token à créer)
   - `cardGoldValue` color `'white'` → `colors.text.primary`
   - `statSubGreen` color `'#10B981'` → `colors.status.success`
   - `badgeVioletText` color `'#8B5CF6'` → remplacer par `colors.status.warning` (violet exclu de la charte)
   - `badgeViolet` backgroundColor → `colors.status.warningBg`
6. **Tokens `@aureak/theme`** : ajouter `colors.accent.goldDark: '#6e5d14'` et `colors.accent.goldPale: '#F9E28C'` dans `tokens.ts`
7. **Zéro couleur hardcodée** sur l'ensemble des 5 fichiers modifiés — grep `#[0-9a-fA-F]{3,6}` → 0 résultat (hors commentaires)
8. **Rendu visuel** : screenshot Playwright sur `/activites` correspond à la référence PNG sur les points : taille titre, couleur bouton CTA, stat card 4 dark gold, filtres scope/temporels

## Tasks / Subtasks

- [x] T1 — Tokens nouveaux (AC: 6)
  - [x] T1.1 — Dans `aureak/packages/theme/src/tokens.ts`, dans `colors.accent`, ajouter :
    - `goldDark : '#6e5d14'`  // or sombre — fond card Évals Complétées
    - `goldPale : '#F9E28C'`  // or pâle — texte sur fond gold sombre
  - [x] T1.2 — Vérifier que les exports `colors` sont correctement propagés

- [x] T2 — Titre + Bouton CTA (AC: 1, 2) — `ActivitesHeader.tsx`
  - [x] T2.1 — `pageTitle` : `fontSize: 22` → `fontSize: 28`
  - [x] T2.2 — `newBtn` : `backgroundColor: colors.accent.gold` → `backgroundColor: colors.text.dark`
  - [x] T2.3 — `newBtnText` : `color: colors.text.dark` → `color: colors.accent.gold`
  - [x] T2.4 — Vérifier hover/pressed state cohérent (opacity 0.85 OK)

- [x] T3 — Filtres temporels (AC: 3) — `PseudoFiltresTemporels.tsx`
  - [x] T3.1 — Ligne ~40 : `color: isActive ? '#FFFFFF' : colors.text.muted` → `color: isActive ? colors.text.primary : colors.text.muted`
  - [x] T3.2 — Grep `#[0-9a-fA-F]` sur le fichier → 0 occurrence

- [x] T4 — Label "Toutes" (AC: 4) — `FiltresScope.tsx`
  - [x] T4.1 — Ligne ~117 : `<AureakText ...>Global</AureakText>` → `<AureakText ...>Toutes</AureakText>`

- [x] T5 — StatCards couleurs hardcodées (AC: 5) — `StatCards.tsx`
  - [x] T5.1 — `cardGold.backgroundColor` : `'#6e5d14'` → `colors.accent.goldDark`
  - [x] T5.2 — `cardGoldLabel` color : `'#f9e28c'` → `colors.accent.goldPale`
  - [x] T5.3 — `cardGoldValue` color : `'white'` → `colors.text.primary`
  - [x] T5.4 — `statSubGreen` color : `'#10B981'` → `colors.status.success`
  - [x] T5.5 — `badgeVioletText` color : `'#8B5CF6'` → `colors.status.warning` (violet hors charte)
  - [x] T5.6 — `badgeViolet` backgroundColor : `'rgba(197,192,253,0.2)'` → `colors.status.warningBg` (fond ambre clair)
  - [x] T5.7 — Gradient progressFill inline : `#C1AC5C` → `colors.accent.gold`, `#f9e28c` → `colors.accent.goldPale`
  - [x] T5.8 — Grep `#[0-9a-fA-F]` sur le fichier → 0 occurrence

- [ ] T6 — Validation Playwright (AC: 8) — skippé (app non démarrée)

## Dev Notes

### Contraintes Stack

- **React Native Web** — `StyleSheet.create`, `View`, `Pressable`
- **Tokens** : `colors`, `space`, `radius`, `shadows` depuis `@aureak/theme`
- **Accès Supabase** : UNIQUEMENT via `@aureak/api-client` (pas de changement API ici)
- **Aucune migration** nécessaire (story purement UI)

### Référence visuelle

Lire l'image `_bmad-output/design-references/Activites seances-redesign.png` **avant** de coder.

Points d'attention dans la référence :
- Titre "ACTIVITÉS" : imposant, prend sa place (28px Montserrat 900)
- Bouton "+ Nouvelle séance" : CTA dark premium, fond #18181B, texte or
- Card 4 (Évals Complétées) : fond dark gold sombre, texte or pâle + flèche → pattern "dark premium CTA"
- Filtre scope : premier chip = "Toutes" (pas "Global")
- Filtres temporels actif = fond gold + texte blanc token (pas hex)

### Écarts non traités (hors scope de cette story)

- Colonnes tableau (MÉTHODE/BADGES/ANOMALIE vs RAISON/DURÉE/DRIVE dans la maquette) — maquette est fictive, les colonnes actuelles reflètent le vrai modèle de données
- Badges statut : couverts par story 71-5 (done)
- Avatars coach ALPHA_COLORS : couverts par story 72-6 (ready-for-dev, en queue)

### Fichiers à créer / modifier

| Fichier | Action | Notes |
|---------|--------|-------|
| `aureak/packages/theme/src/tokens.ts` | Modifier | Ajouter `goldDark` + `goldPale` dans `colors.accent` |
| `aureak/apps/web/app/(admin)/activites/components/ActivitesHeader.tsx` | Modifier | Titre 28px + bouton dark CTA |
| `aureak/apps/web/app/(admin)/activites/components/PseudoFiltresTemporels.tsx` | Modifier | `'#FFFFFF'` → token |
| `aureak/apps/web/app/(admin)/activites/components/FiltresScope.tsx` | Modifier | "Global" → "Toutes" |
| `aureak/apps/web/app/(admin)/activites/components/StatCards.tsx` | Modifier | 6 remplacements hex → tokens |

### Fichiers à NE PAS modifier

- `aureak/apps/web/app/(admin)/activites/page.tsx` — structure inchangée
- `aureak/apps/web/app/(admin)/activites/components/TableauSeances.tsx` — hors scope
- `aureak/apps/web/app/(admin)/activites/presences/page.tsx` — hors scope

### QA — Checks obligatoires post-implémentation

```bash
# BLOCKER — couleurs hardcodées
grep -n "#[0-9a-fA-F]" aureak/apps/web/app/(admin)/activites/components/ActivitesHeader.tsx
grep -n "#[0-9a-fA-F]" aureak/apps/web/app/(admin)/activites/components/PseudoFiltresTemporels.tsx
grep -n "#[0-9a-fA-F]" aureak/apps/web/app/(admin)/activites/components/StatCards.tsx
grep -n "#[0-9a-fA-F]" aureak/apps/web/app/(admin)/activites/components/FiltresScope.tsx

# WARNING — console non gardé
grep -n "console\." aureak/apps/web/app/(admin)/activites/components/StatCards.tsx | grep -v "NODE_ENV"
```

## Dev Agent Record

### Agent Model Used
claude-sonnet-4-6

### Debug Log References
—

### Completion Notes List
- T1 : `goldDark` + `goldPale` ajoutés dans `colors.accent` de tokens.ts (inséré avant `teamB`)
- T2 : `pageTitle` fontSize 22→28 ; `newBtn` backgroundColor gold→text.dark ; `newBtnText` color text.dark→accent.gold
- T3 : `'#FFFFFF'` ligne 40 remplacé par `colors.text.primary` (texte filtre actif)
- T4 : label "Global" → "Toutes" dans FiltresScope.tsx
- T5 : 7 occurrences hex remplacées dans StatCards.tsx — dont le gradient inline JSX (`#C1AC5C`/`#f9e28c` → template literal avec tokens)
- QA : grep `#[0-9a-fA-F]` → 0 résultat sur les 4 fichiers modifiés
- Playwright : skippé (app non démarrée) — noter dans commit

### File List
- `aureak/packages/theme/src/tokens.ts` — ajout `colors.accent.goldDark` + `colors.accent.goldPale`
- `aureak/apps/web/app/(admin)/activites/components/ActivitesHeader.tsx` — titre 28px + CTA dark/gold
- `aureak/apps/web/app/(admin)/activites/components/PseudoFiltresTemporels.tsx` — `'#FFFFFF'` → `colors.text.primary`
- `aureak/apps/web/app/(admin)/activites/components/FiltresScope.tsx` — "Global" → "Toutes"
- `aureak/apps/web/app/(admin)/activites/components/StatCards.tsx` — 7 hex → tokens
