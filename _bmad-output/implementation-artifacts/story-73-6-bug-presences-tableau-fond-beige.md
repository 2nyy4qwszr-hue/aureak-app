# Story 73.6 : BUG — Présences : fond ScrollView blanc + tableau heatmap invisible sans données

Status: done

## Story

En tant qu'admin,
je veux que la page Présences affiche un fond beige uniforme (y compris la zone de scroll) et un état vide explicite quand aucune donnée de présence n'est disponible,
afin de ne pas voir une page blanche vide qui laisse croire que la feature est cassée.

## Acceptance Criteria

1. Le `ScrollView` de `presences/page.tsx` a `backgroundColor: colors.light.primary` sur son style — le fond de la zone scrollable est beige même quand le contenu ne remplit pas l'écran.
2. Le `scrollContent` (contentContainerStyle) a également `backgroundColor: colors.light.primary` — aucune zone blanche entre les cards et le bas de la page.
3. Le `TableauGroupes` reçoit des lignes triées par date descend (séances les plus récentes en premier) — la colonne `allDates` affiche les 5 dernières dates réelles.
4. Quand `groupPresenceRows` contient des lignes mais que `allDates` est vide (aucune séance trouvée), le tableau affiche un empty state explicite : "Aucune séance trouvée pour la période sélectionnée." plutôt qu'un tableau fantôme avec uniquement la colonne GROUPE et ASSIDUITÉ.
5. Quand `groupPresenceRows` est vide (aucun groupe), le message actuel "Aucune donnée de présence disponible." est enrichi d'un sous-titre : "Créez des groupes et enregistrez des présences pour voir les données ici."
6. Aucune couleur hardcodée n'est introduite — uniquement des tokens `@aureak/theme`.

## Tasks / Subtasks

- [x] T1 — Corriger le fond ScrollView (AC: 1, 2)
  - [x] T1.1 — Dans `pageStyles`, ajouter `backgroundColor: colors.light.primary` au style `scroll`
  - [x] T1.2 — Dans `pageStyles`, ajouter `backgroundColor: colors.light.primary` au style `scrollContent`

- [x] T2 — Corriger le tri des sessions dans `groupPresenceRows` (AC: 3, 4)
  - [x] T2.1 — Dans le `useMemo` `groupPresenceRows` (ligne ~1150), trier `sessions` par `scheduledAt` descend avant `.slice(0, 5)` : `const last5Sessions = [...sessions].sort((a, b) => new Date(b.scheduledAt ?? 0).getTime() - new Date(a.scheduledAt ?? 0).getTime()).slice(0, 5)`
  - [x] T2.2 — Dans `TableauGroupes`, détecter `rows.length > 0 && allDates.length === 0` et afficher un empty state dédié : "Aucune séance trouvée pour la période sélectionnée."

- [x] T3 — Enrichir le message empty state aucun groupe (AC: 5)
  - [x] T3.1 — Dans `TableauGroupes`, quand `rows.length === 0`, ajouter un `AureakText` sous-titre avec `colors.text.subtle` : "Créez des groupes et enregistrez des présences pour voir les données ici."

- [x] T4 — Validation (AC: tous)
  - [x] T4.1 — Naviguer sur `/activites/presences` : vérifier que le fond de la page est entièrement beige `#F3EFE7`, y compris la zone en dessous des cards
  - [x] T4.2 — Avec scope Global et aucune présence enregistrée : vérifier que l'empty state "Aucune séance trouvée pour la période sélectionnée." s'affiche dans une card blanche sur fond beige
  - [x] T4.3 — Avec scope Global et des données : vérifier que le tableau affiche bien des colonnes de dates (5 dernières séances triées par date desc)
  - [x] T4.4 — QA scan : `grep -n "backgroundColor" presences/page.tsx` — les styles `scroll` et `scrollContent` ont `colors.light.primary`

## Dev Notes

### Contraintes Stack

Ce projet utilise :
- **React Native Web** (View, Pressable, StyleSheet, ScrollView) — pas de Tailwind, pas de className
- **Tamagui** : XStack, YStack, Text — uniquement dans `_layout.tsx`
- **Tokens `@aureak/theme`** : `colors`, `space`, `shadows`, `radius`, `transitions`
- **Composants `@aureak/ui`** : AureakButton, AureakText, Badge, Card, Input
- **Accès Supabase UNIQUEMENT via `@aureak/api-client`** — jamais direct dans apps/
- **Styles via tokens uniquement** — jamais de couleurs hardcodées
- **Try/finally obligatoire** sur tout state setter de chargement

---

### T1 — Fond ScrollView

**Fichier** : `aureak/apps/web/app/(admin)/activites/presences/page.tsx`

**Avant (lignes ~1283–1294)** :
```tsx
const pageStyles = StyleSheet.create({
  container: {
    flex           : 1,
    backgroundColor: colors.light.primary,  // déjà correct
  },
  scroll: {
    flex: 1,
    // ← manque backgroundColor
  },
  scrollContent: {
    paddingTop   : space.md,
    paddingBottom: space.xxl,
    // ← manque backgroundColor
  },
  ...
})
```

**Après correction** :
```tsx
const pageStyles = StyleSheet.create({
  container: {
    flex           : 1,
    backgroundColor: colors.light.primary,
  },
  scroll: {
    flex           : 1,
    backgroundColor: colors.light.primary,  // ← ajouté
  },
  scrollContent: {
    paddingTop     : space.md,
    paddingBottom  : space.xxl,
    backgroundColor: colors.light.primary,  // ← ajouté
  },
  ...
})
```

Sur React Native Web, le `ScrollView` sans `backgroundColor` peut afficher blanc sur la zone non remplie par le contenu (notamment quand peu de données). Les deux propriétés — sur le scroll ET sur le contentContainerStyle — sont nécessaires pour couvrir tous les cas.

---

### T2 — Tri des sessions + empty state colonnes vides

**Fichier** : `aureak/apps/web/app/(admin)/activites/presences/page.tsx`

**Problème actuel (ligne ~1154)** :
```tsx
const last5Sessions = sessions.slice(0, 5)
```
Le tableau `sessions` n'est pas trié par date — les 5 premiers éléments peuvent ne pas correspondre aux sessions les plus récentes. De plus, si aucune session du groupe ne correspond (mismatch `groupId`), `allDates` dans `TableauGroupes` est vide et le tableau affiche uniquement GROUPE + ASSIDUITÉ 0%.

**Après correction** :
```tsx
const last5Sessions = [...sessions]
  .sort((a, b) => new Date(b.scheduledAt ?? 0).getTime() - new Date(a.scheduledAt ?? 0).getTime())
  .slice(0, 5)
```

**Dans `TableauGroupes` (ligne ~314 — après `if (rows.length === 0)`)** :
```tsx
// Après la guard rows.length === 0, avant le return principal :
if (allDates.length === 0) {
  return (
    <View style={tableStyles.empty}>
      <AureakText style={tableStyles.emptyText}>
        Aucune séance trouvée pour la période sélectionnée.
      </AureakText>
      <AureakText style={tableStyles.emptySubText}>
        Vérifiez les filtres de scope ou attendez que des séances soient enregistrées.
      </AureakText>
    </View>
  )
}
```

Ajouter dans `tableStyles` :
```tsx
emptySubText: {
  color     : colors.text.subtle,
  fontSize  : 12,
  fontFamily: fonts.body,
  marginTop : space.xs,
  textAlign : 'center',
},
```

Attention : `allDates` est calculé via `useMemo` à l'intérieur de `TableauGroupes`. La garde `allDates.length === 0` doit être placée **après** le calcul de `allDates`, avant le `return` du JSX complet. Restructurer le composant :

```tsx
function TableauGroupes({ rows, page, onPage, onClickGroup }: TableauGroupesProps) {
  const totalPages = Math.ceil(rows.length / PAGE_SIZE)
  const sliced = rows.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  const allDates = useMemo(() => {
    const dateSet = new Set<string>()
    for (const r of rows) {
      for (const s of r.sessions) dateSet.add(s.date)
    }
    return Array.from(dateSet).slice(-5)
  }, [rows])

  // Guard 1 — aucun groupe
  if (rows.length === 0) {
    return (
      <View style={tableStyles.empty}>
        <AureakText style={tableStyles.emptyText}>Aucune donnée de présence disponible.</AureakText>
        <AureakText style={tableStyles.emptySubText}>
          Créez des groupes et enregistrez des présences pour voir les données ici.
        </AureakText>
      </View>
    )
  }

  // Guard 2 — groupes chargés mais aucune séance pour la période
  if (allDates.length === 0) {
    return (
      <View style={tableStyles.empty}>
        <AureakText style={tableStyles.emptyText}>Aucune séance trouvée pour la période sélectionnée.</AureakText>
        <AureakText style={tableStyles.emptySubText}>
          Vérifiez les filtres de scope ou attendez que des séances soient enregistrées.
        </AureakText>
      </View>
    )
  }

  // ... reste du rendu tableau
}
```

---

### Design

Tokens à utiliser :
```tsx
import { colors, space, fonts } from '@aureak/theme'

// fond page (scroll + scrollContent)
backgroundColor: colors.light.primary   // #F3EFE7 — beige

// texte empty state principal
color: colors.text.muted

// texte empty state sous-titre
color: colors.text.subtle
```

Principes design :
- Fond clair uniforme — blanc (#FFFFFF) ou beige (#F3EFE7), jamais de zone blanche non intentionnelle
- Empty state = message principal clair + sous-titre explicatif actionnable, centré dans une card blanche

---

### Fichiers à créer / modifier

| Fichier | Action | Notes |
|---------|--------|-------|
| `aureak/apps/web/app/(admin)/activites/presences/page.tsx` | Modifier | T1 : scroll + scrollContent backgroundColor ; T2 : tri sessions + guards empty state dans TableauGroupes |

### Fichiers à NE PAS modifier

- `aureak/apps/web/app/(admin)/activites/components/ActivitesHeader.tsx` — couvert par story 73-2
- `aureak/apps/web/app/(admin)/activites/page.tsx` — couvert par story 73-2
- `aureak/apps/web/app/(admin)/activites/presences/index.tsx` — re-export uniquement, pas de logique
- Tout fichier `@aureak/api-client` — aucun changement de données nécessaire

---

### Dépendances à protéger

- Story 65-2 a défini la structure complète du composant `TableauGroupes` — ne pas changer ses props ni son interface externe
- Story 72-8 prévoit de corriger des couleurs hardcodées `#18181B`/`#FFFFFF` dans `presences/page.tsx` — cette story-73-6 ne touche pas les couleurs de texte/onglets, uniquement fond scroll et logique tableau
- Story 65-6 modifie `presences/page.tsx` (vue joueur inline) — les modifications T1 (pageStyles) et T2 (groupPresenceRows + TableauGroupes) n'affectent pas la VueJoueurInline

---

### Références

- Design tokens : `aureak/packages/theme/src/tokens.ts`
- Pattern fond beige sur container : `aureak/apps/web/app/(admin)/activites/presences/page.tsx` ligne 1286 (`pageStyles.container`)
- `TableauGroupes` composant : `aureak/apps/web/app/(admin)/activites/presences/page.tsx` lignes 301–418
- `groupPresenceRows` useMemo : `aureak/apps/web/app/(admin)/activites/presences/page.tsx` lignes 1150–1175
- Pattern empty state avec sous-titre : `aureak/apps/web/app/(admin)/activites/presences/page.tsx` lignes 664–670 (vide HeatmapGroupe)

---

### Multi-tenant

Sans objet — changement purement visuel et correctif logique local (tri en mémoire). Aucune modification de requête DB ou de RLS.

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List

| Fichier | Statut |
|---------|--------|
| `aureak/apps/web/app/(admin)/activites/presences/page.tsx` | À modifier |
