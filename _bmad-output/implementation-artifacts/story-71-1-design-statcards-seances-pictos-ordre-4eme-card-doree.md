# Story 71.1 : Design — StatCards Séances : pictos + ordre picto→label→valeur + 4ème card dorée

Status: done

## Story

En tant qu'admin,
je veux que les 4 stat cards de l'onglet Séances affichent un picto en haut, puis le label, puis la valeur, et que la 4ème card ait un fond doré/dark,
afin que les cards correspondent exactement à la référence `Activites seances-redesign.png`.

## Acceptance Criteria

1. Chaque card affiche dans cet ordre vertical : picto emoji (haut) → label 10px uppercase muted → valeur 28px bold
2. Pictos attribués : card 1 "Présence Moyenne" → `📈`, card 2 "Total Séances" → `📅`, card 3 "Annulées" → `⚠️`, card 4 "Évals Complétées" → `✅`
3. Les pictos sont en `fontSize: 22`, alignés à gauche, avec `marginBottom: 4`
4. La 4ème card (Évals Complétées) passe à fond `colors.text.dark` (dark) avec texte en `colors.text.primary` (blanc) — même couleur de fond que le bouton "+ Nouvelle séance"
5. Dans la 4ème card, le picto passe à `↑` (flèche montante), label "Évals Complétées" en blanc muted, valeur `{stats.evalPct}%` en 28px bold blanc, barre de progression en `colors.accent.gold` sur fond `colors.text.secondary + '40'`
6. Les 3 premières cards gardent leur fond `colors.light.surface` (blanc) — seule la 4ème change
7. Le badge orange (cancelPct) de la card Annulées est affiché sous la valeur (pas à côté)
8. TypeScript compile sans erreur (`npx tsc --noEmit`)

## Tasks / Subtasks

- [x] T1 — Restructurer les 3 premières cards (AC: 1, 2, 3, 7)
  - [x] T1.1 — Dans `StatCards.tsx`, modifier la card 1 "Présence Moyenne" : ajouter `<AureakText style={styles.statIcon}>📈</AureakText>` en premier enfant, puis `statLabel`, puis `statValue` — inverser l'ordre actuel (valeur était en premier)
  - [x] T1.2 — Card 2 "Total Séances" : ajouter `<AureakText style={styles.statIcon}>📅</AureakText>` en premier
  - [x] T1.3 — Card 3 "Annulées" : ajouter `<AureakText style={styles.statIcon}>⚠️</AureakText>` en premier. Déplacer le badge orange sous `statValue` (retirer du `statRow` flex-row — mettre en colonne)
  - [x] T1.4 — Ajouter le style `statIcon` dans `StyleSheet.create` : `{ fontSize: 22, marginBottom: 4 }`

- [x] T2 — Refonte 4ème card fond doré (AC: 4, 5, 6)
  - [x] T2.1 — Card 4 "Évals Complétées" : remplacer `style={styles.card}` par `style={[styles.card, styles.cardDark]}`
  - [x] T2.2 — Ajouter `cardDark` dans StyleSheet : `{ backgroundColor: colors.text.dark, borderColor: colors.text.dark }`
  - [x] T2.3 — Picto : `<AureakText style={styles.statIconLight}>↑</AureakText>` (fontSize 22, color `colors.text.primary`)
  - [x] T2.4 — Label : utiliser `statLabelLight` : `{ fontSize: 10, fontFamily: 'Montserrat', color: colors.accent.goldLight, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }`
  - [x] T2.5 — Valeur : utiliser `statValueLight` : `{ fontSize: 28, fontWeight: '900', fontFamily: 'Montserrat', color: colors.text.primary, lineHeight: 36 }`
  - [x] T2.6 — Barre progression : `progressBarDark` fond `colors.text.primary + '30'`, `progressFill` reste `colors.accent.gold`

- [x] T3 — Validation (AC: tous)
  - [x] T3.1 — `npx tsc --noEmit` = 0 erreurs
  - [ ] T3.2 — Naviguer sur `/activites` : vérifier que chaque card affiche picto → label → valeur
  - [ ] T3.3 — Vérifier que la 4ème card a bien un fond sombre avec texte blanc

## Dev Notes

### ⚠️ Contraintes Stack

**React Native Web** (View, StyleSheet) dans `StatCards.tsx`. Pas de JSX natif.

- **Tokens `@aureak/theme`** : `colors`, `space`, `radius`, `shadows`
- **Styles via tokens uniquement** — jamais de couleurs hardcodées

---

### T1 — Pattern card cible (3 premières)

```tsx
// Card 1 — Présence Moyenne (APRÈS refonte)
<View style={styles.card}>
  <AureakText style={styles.statIcon}>📈</AureakText>
  <AureakText style={styles.statLabel}>Présence Moyenne</AureakText>
  <AureakText style={styles.statValue}>{stats.avgPres}%</AureakText>
  <AureakText style={styles.statSub}>
    {stats.avgPres >= 75 ? '↑ Bonne dynamique' : '↓ À surveiller'}
  </AureakText>
</View>
```

---

### T2 — Pattern 4ème card cible

```tsx
// Card 4 — Évals Complétées (APRÈS refonte)
<View style={[styles.card, styles.cardDark]}>
  <AureakText style={styles.statIconLight}>↑</AureakText>
  <AureakText style={styles.statLabelLight}>Évals Complétées</AureakText>
  <AureakText style={styles.statValueLight}>{stats.evalPct}%</AureakText>
  <View style={[styles.progressBar, styles.progressBarDark]}>
    <View style={[styles.progressFill, { width: `${Math.min(stats.evalPct, 100)}%` as unknown as number }]} />
  </View>
</View>

// Styles à ajouter
cardDark: {
  backgroundColor: colors.text.dark,
  borderColor    : colors.text.dark,
},
statIcon: {
  fontSize    : 22,
  marginBottom: 4,
},
statIconLight: {
  fontSize    : 22,
  marginBottom: 4,
  color       : colors.text.primary,
},
statLabelLight: {
  fontSize     : 10,
  fontFamily   : 'Montserrat',
  color        : colors.accent.goldLight,
  marginTop    : 2,
  marginBottom : 4,
  textTransform: 'uppercase',
  letterSpacing: 1,
},
statValueLight: {
  fontSize  : 28,
  fontWeight: '900',
  fontFamily: 'Montserrat',
  color     : colors.text.primary,
  lineHeight: 36,
},
progressBarDark: {
  backgroundColor: colors.text.primary + '30',
},
```

---

### Fichiers à créer / modifier

| Fichier | Action | Notes |
|---------|--------|-------|
| `aureak/apps/web/app/(admin)/activites/components/StatCards.tsx` | Modifier | Restructurer cards + 4ème card dark |

### Fichiers à NE PAS modifier

- `aureak/apps/web/app/(admin)/activites/page.tsx` — structure inchangée
- `aureak/apps/web/app/(admin)/activites/components/TableauSeances.tsx` — non concerné
- `supabase/migrations/` — aucune migration

---

### Références

- Fichier cible : `aureak/apps/web/app/(admin)/activites/components/StatCards.tsx`
- Design ref : `_bmad-output/design-references/Activites seances-redesign.png`
- Token `colors.text.dark` = fond du bouton "+ Nouvelle séance" dans `ActivitesHeader.tsx`
- Story liée (done) : `_bmad-output/implementation-artifacts/story-67-2-design-activites-seances-redesign-visuel.md`

---

### Multi-tenant

Sans objet — UI uniquement.

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

Aucun.

### Completion Notes List

- Ordre restructuré : picto → label → valeur sur les 3 premières cards
- Badge orange de la card Annulées déplacé sous `statValue` (colonne, `alignSelf: 'flex-start'`)
- 4ème card : fond `colors.text.dark`, label `colors.accent.goldLight`, valeur blanc, barre de progression `progressBarDark`
- Style `statRow` conservé dans StyleSheet (non utilisé mais non destructif)
- `npx tsc --noEmit` : 0 erreurs

### File List

| Fichier | Statut |
|---------|--------|
| `aureak/apps/web/app/(admin)/activites/components/StatCards.tsx` | Modifié |
