# Story 82.3 : Polish — Programmes recherche, StatCards typo, Évaluations toggle

Status: done

## Story

En tant qu'admin,
je veux 3 petits ajustements visuels sur les pages Activités et Méthodologie,
afin d'obtenir une interface cohérente et épurée.

## Acceptance Criteria

### A — Méthodologie Programmes : retirer la recherche des filtres
1. La `<TextInput>` de recherche est retirée du `filtresRight` de la page Programmes.
2. L'état `search` + le filtre `search` dans `filtered` sont également supprimés (code mort inutile).
3. Le style `searchCompact` est supprimé.
4. La table `ProgrammesTable` affiche tous les programmes sans filtre texte.

### B — Activités Séances : aligner la typographie des StatCards sur Présences
5. Le style `statLabel` des StatCards Séances passe à : `fontSize: 10`, `fontWeight: '700'`, `letterSpacing: 1`, `marginBottom: space.sm` (identique à `cardLabel` de Présences).
6. Le style `statValue` passe à : `fontSize: 28`, `fontWeight: '900'`, `marginBottom: space.xs`, sans `lineHeight` fixe.
7. Le style `statSub` + `statSubGreen` passent à : `fontSize: 11`.
8. Le picto emoji est affiché directement sans wrapper `<View style={pictoBox}>` — le style devient `statIcon` avec `fontSize: 22`, `marginBottom: 4` (identique à Présences).
9. Le `padding: 16` des cards passe à `padding: space.md`.
10. La card gold (cardGold) aligne ses labels/valeurs sur le même pattern (utiliser `cardGoldLabel` existant — juste vérifier cohérence).
11. Les styles `pictoBox` et `pictoText` sont supprimés (remplacés par `statIcon`).

### C — Activités Évaluations : déplacer le toggle evalType dans filtresRow
12. `<PseudoFiltresTemporels>` est retiré du `filtresRow` (Aujourd'hui / À venir / Passé disparaît).
13. Le toggle Badges / Connaissances / Compétences est intégré directement dans `filtresRow` à la place de `PseudoFiltresTemporels` (côté droit, `FiltresScope` reste à gauche).
14. Le `toggleRowWrapper` séparé est supprimé.
15. L'état `temporalFilter` reste initialisé à `'past'` (valeur fixe — le chargement continue sur les 30 derniers jours) sans UI de contrôle.
16. Les imports `PseudoFiltresTemporels` et `TemporalFilter` sont retirés si plus utilisés.
17. Les styles liés au `toggleRowWrapper` sont supprimés si devenus orphelins.

## Tasks / Subtasks

- [x] T1 — Programmes : retirer recherche (AC: 1, 2, 3, 4)
  - [x] T1.1 — Retirer `<TextInput style={st.searchCompact} .../>` du JSX (dans `filtresRight`)
  - [x] T1.2 — Supprimer `const [search, setSearch] = useState('')`
  - [x] T1.3 — Supprimer la ligne `if (search && !p.title.toLowerCase().includes(...)) return false` dans `filtered`
  - [x] T1.4 — Supprimer le style `searchCompact`
  - [x] T1.5 — Vérifier que `TextInput` n'est plus importé si plus utilisé → retirer de l'import

- [x] T2 — StatCards Séances : aligner typo sur Présences (AC: 5, 6, 7, 8, 9, 10, 11)
  - [x] T2.1 — Dans les 3 cards blanches : remplacer `<View style={styles.pictoBox}><AureakText style={styles.pictoText}>emoji</AureakText></View>` par `<AureakText style={styles.statIcon}>emoji</AureakText>`
  - [x] T2.2 — `statLabel` : `fontSize: 14 → 10`, `fontWeight: '500' → '700'`, `letterSpacing: 1.2 → 1`, `marginBottom: 6 → space.sm`, supprimer `fontFamily: 'Montserrat'` (inutile si fonts.heading ou déjà défaut)
  - [x] T2.3 — `statValue` : `fontSize: 30 → 28`, `fontWeight: '700' → '900'`, supprimer `lineHeight: 38`, ajouter `marginBottom: space.xs`
  - [x] T2.4 — `statSub` + `statSubGreen` : `fontSize: 12 → 11`, supprimer `fontWeight: '700'` (le mettre à '600' ou laisser sans)
  - [x] T2.5 — `card` + `cardGold` : `padding: 16 → space.md`
  - [x] T2.6 — Ajouter style `statIcon: { fontSize: 22, marginBottom: 4 }`
  - [x] T2.7 — Supprimer styles `pictoBox` et `pictoText`

- [x] T3 — Évaluations : déplacer toggle evalType (AC: 12, 13, 14, 15, 16, 17)
  - [x] T3.1 — Dans `filtresRow`, remplacer `<PseudoFiltresTemporels value={temporalFilter} onChange={setTemporalFilter} />` par le contenu du toggle evalType (Badges/Connaissances/Compétences)
  - [x] T3.2 — Supprimer le bloc `{/* Eval Type — SegmentedToggle */}` + `<View style={styles.toggleRowWrapper}>` séparé
  - [x] T3.3 — `temporalFilter` reste initialisé à `'past'` — supprimer `setTemporalFilter` si plus utilisé (garder la variable pour `loadEvals`)
  - [x] T3.4 — Retirer l'import `PseudoFiltresTemporels` (import `TemporalFilter` conservé car utilisé dans `getDateRange`)
  - [x] T3.5 — Supprimer le style `toggleRowWrapper` s'il devient orphelin

- [x] T4 — QA (AC: tous)
  - [x] T4.1 — Grep `pictoBox\|pictoText` dans `StatCards.tsx` → 0 occurrence
  - [x] T4.2 — Grep `searchCompact\|setSearch\|search &&` dans `programmes/index.tsx` → 0 occurrence
  - [x] T4.3 — Grep `PseudoFiltresTemporels\|toggleRowWrapper` dans `evaluations/page.tsx` → 0 occurrence
  - [x] T4.4 — Grep `#[0-9a-fA-F]` dans les 3 fichiers → 0 couleur hex introduite

## Dev Notes

### Fichiers à modifier

| Fichier | Changement |
|---------|------------|
| `aureak/apps/web/app/(admin)/methodologie/programmes/index.tsx` | Retirer TextInput recherche + état search |
| `aureak/apps/web/app/(admin)/activites/components/StatCards.tsx` | Aligner typo + picto sur pattern Présences |
| `aureak/apps/web/app/(admin)/activites/evaluations/page.tsx` | Déplacer evalType toggle dans filtresRow |

### Référence typo Présences (`presences/page.tsx` — `cardStyles`)

```
statIcon   : fontSize 22, marginBottom 4
cardLabel  : fontSize 10, fontWeight '700', letterSpacing 1, marginBottom space.sm
cardStat   : fontSize 28, fontWeight '900', marginBottom space.xs
cardSub    : fontSize 11, color muted
card.padding: space.md
```

### Toggle evalType à déplacer (`evaluations/page.tsx` lignes ~400-414)

Pattern exact à insérer dans `filtresRow` côté droit :
```tsx
<View style={styles.toggleRow}>
  {(['badges', 'connaissances', 'competences'] as EvalType[]).map(type => {
    const isActive = type === evalType
    return (
      <Pressable key={type} onPress={() => setEvalType(type)}
        style={[styles.toggleBtn, isActive && styles.toggleBtnActive] as never}>
        <AureakText variant="label" style={[styles.toggleLabel, isActive && styles.toggleLabelActive] as never}>
          {type.toUpperCase()}
        </AureakText>
      </Pressable>
    )
  })}
</View>
```

### Fichiers à NE PAS modifier
- `aureak/apps/web/app/(admin)/activites/presences/page.tsx` — référence uniquement
- Toute migration Supabase — changement UI pur

### Multi-tenant
Sans impact — modifications UI pures.
