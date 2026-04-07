# Story 72.5 : Design — Méthodologie Entraînements — Stat cards bento + pastille méthode

Status: done

## Story

En tant qu'admin,
je veux que la page Entraînements pédagogiques affiche 4 stat cards bento en haut de page (avant la barre de recherche),
afin d'avoir une vue synthétique de la bibliothèque cohérente avec le pattern visuel établi dans les autres pages Activités.

## Acceptance Criteria

1. 4 stat cards s'affichent en ligne horizontale scrollable entre le bloc header (onglets) et la barre de filtres existante
2. Card 1 — **ENTRAÎNEMENTS ACTIFS** : valeur = `sessions.filter(s => s.isActive).length`, picto 🎯, fond `colors.light.surface`
3. Card 2 — **MÉTHODES UTILISÉES** : valeur = `new Set(sessions.map(s => s.method).filter(Boolean)).size`, picto 📚, fond `colors.light.surface`
4. Card 3 — **AVEC THÈME** : valeur = `0` avec note en commentaire (champ `themes` absent de `MethodologySession` — à activer quand l'API renverra les thèmes liés), picto 🏷️, fond `colors.light.surface`
5. Card 4 — **TAUX COMPLÉTUDE** : valeur = `sessions.length === 0 ? 0 : Math.round(sessions.filter(s => s.isActive).length / sessions.length * 100)` affiché avec `%`, fond `#6E5D14` (dark gold), texte blanc
6. Les stat cards existantes par méthode (scroll horizontal avec borderLeft coloré) sont **conservées** sous les 4 nouvelles cards — elles ne sont pas supprimées
7. La colonne MÉTHODE dans le tableau affiche une pastille colorée (`methodologyMethodColors[session.method]`) + le label texte à côté — vérifier que c'est déjà le cas (cercle + picto emoji) ; si la couleur n'est pas visible, corriger
8. TypeScript compile sans erreur (`npx tsc --noEmit`)

## Tasks / Subtasks

- [x] T1 — Ajouter les 4 stat cards bento (AC: 1, 2, 3, 4, 5)
  - [x] T1.1 — Dans `seances/index.tsx`, calculer les 4 métriques en `useMemo` à partir de `sessions`
  - [x] T1.2 — Insérer le bloc `<View style={st.bentoRow}>` entre `{/* ── Header ── */}` et `{/* ── Stat cards méthodes ── */}`
  - [x] T1.3 — Créer les styles `bentoRow`, `bentoCard`, `bentoCardDark`, `bentoPicto`, `bentoValue`, `bentoLabel` dans `StyleSheet.create`
  - [x] T1.4 — Card "AVEC THÈME" : valeur hardcodée `0` avec commentaire `// TODO: activer quand API renvoie themes[]`

- [x] T2 — Vérifier pastille colorée méthode dans le tableau (AC: 7)
  - [x] T2.1 — Inspecter le rendu de la colonne MÉTHODE (ligne ~269) : le cercle `methodCircle` utilise déjà `backgroundColor: methodColor + '22'` — confirmer visuellement que c'est suffisant
  - [x] T2.2 — Passé le fond du cercle à `methodColor + '44'` et ajouté `borderWidth: 1, borderColor: methodColor` pour meilleure visibilité

- [x] T3 — Validation (AC: 8)
  - [x] T3.1 — `cd aureak && npx tsc --noEmit` = 0 erreurs
  - [x] T3.2 — Naviguer sur `/methodologie/seances` : les 4 cards apparaissent avant les chips méthodes, la card TAUX COMPLÉTUDE est en fond sombre doré

## Dev Notes

### Fichier cible

`aureak/apps/web/app/(admin)/methodologie/seances/index.tsx`

### Contraintes stack

React Native Web — `View`, `StyleSheet`, `ScrollView` uniquement. Tokens depuis `@aureak/theme`. Pas de migration, pas de changement API.

---

### T1 — Calculs useMemo à insérer (après les déclarations de state, avant le return)

```tsx
// Stat cards bento — métriques calculées côté client
const totalActifs   = React.useMemo(() => sessions.filter(s => s.isActive).length, [sessions])
const nbMethodes    = React.useMemo(() => new Set(sessions.map(s => s.method).filter(Boolean)).size, [sessions])
// TODO: activer quand l'API renvoie themes[] dans MethodologySession
const nbAvecTheme   = 0
const txCompletude  = React.useMemo(
  () => sessions.length === 0 ? 0 : Math.round(sessions.filter(s => s.isActive).length / sessions.length * 100),
  [sessions]
)
```

---

### T1 — Bloc JSX à insérer entre `</View> {/* fin headerBlock */}` et `{/* ── Stat cards méthodes ── */}`

```tsx
{/* ── Stat cards bento — vue synthétique ── */}
<View style={st.bentoRow}>
  <View style={st.bentoCard}>
    <AureakText style={st.bentoPicto}>🎯</AureakText>
    <AureakText style={st.bentoValue}>{totalActifs}</AureakText>
    <AureakText style={st.bentoLabel}>ENTRAÎNEMENTS{'\n'}ACTIFS</AureakText>
  </View>
  <View style={st.bentoCard}>
    <AureakText style={st.bentoPicto}>📚</AureakText>
    <AureakText style={st.bentoValue}>{nbMethodes}</AureakText>
    <AureakText style={st.bentoLabel}>MÉTHODES{'\n'}UTILISÉES</AureakText>
  </View>
  <View style={st.bentoCard}>
    <AureakText style={st.bentoPicto}>🏷️</AureakText>
    <AureakText style={st.bentoValue}>{nbAvecTheme}</AureakText>
    <AureakText style={st.bentoLabel}>AVEC{'\n'}THÈME</AureakText>
  </View>
  <View style={[st.bentoCard, st.bentoCardDark]}>
    <AureakText style={st.bentoPicto}>📊</AureakText>
    <AureakText style={[st.bentoValue, { color: '#FFFFFF' }]}>{txCompletude}%</AureakText>
    <AureakText style={[st.bentoLabel, { color: 'rgba(255,255,255,0.75)' }]}>TAUX{'\n'}COMPLÉTUDE</AureakText>
  </View>
</View>
```

---

### T1 — Styles à ajouter dans `StyleSheet.create`

```tsx
// Stat cards bento
bentoRow: {
  flexDirection: 'row',
  gap          : space.sm,
},
bentoCard: {
  flex             : 1,
  backgroundColor  : colors.light.surface,
  borderRadius     : 12,
  borderWidth      : 1,
  borderColor      : colors.border.light,
  paddingHorizontal: space.md,
  paddingVertical  : 14,
  alignItems       : 'center',
  gap              : 4,
  // @ts-ignore web
  boxShadow        : shadows.sm,
},
bentoCardDark: {
  backgroundColor: '#6E5D14',
  borderColor    : '#6E5D14',
},
bentoPicto: {
  fontSize: 22,
},
bentoValue: {
  fontSize  : 26,
  fontWeight: '900',
  fontFamily: 'Montserrat',
  color     : colors.text.dark,
},
bentoLabel: {
  fontSize     : 9,
  fontWeight   : '700',
  color        : colors.text.muted,
  textTransform: 'uppercase',
  letterSpacing: 0.8,
  textAlign    : 'center',
},
```

---

### Note — champ `themes` absent de `MethodologySession`

Le type `MethodologySession` (défini dans `@aureak/types/src/entities.ts` ligne 1359) ne possède **pas** de champ `themes[]`.  
Les thèmes sont liés via la table `methodology_session_themes` mais ne sont pas actuellement retournés par `listMethodologySessions()`.

La card "AVEC THÈME" affiche donc `0` en attendant une évolution API future. Ne pas implémenter de requête supplémentaire dans cette story.

---

### Note — stat cards méthodes existantes

Les stat cards par méthode (scroll horizontal avec `borderLeftColor` coloré, ligne ~116) sont **conservées telles quelles**. Elles restent sous les 4 nouvelles cards bento et fournissent le détail par méthode.

---

### Ordre d'affichage final de la page

1. Header block (titre + bouton + onglets)
2. **4 stat cards bento** ← nouveau
3. Stat cards par méthode (scroll horizontal existant)
4. Barre de filtres (chips + recherche + ACADÉMIE/STAGE)
5. Dropdown méthodes (conditionnel)
6. Tableau

---

### Fichiers à créer / modifier

| Fichier | Action | Notes |
|---------|--------|-------|
| `aureak/apps/web/app/(admin)/methodologie/seances/index.tsx` | Modifier | Ajout useMemo + bloc JSX bento + styles |

### Fichiers à NE PAS modifier

- `@aureak/types` — pas d'ajout de champ `themes` sur `MethodologySession` dans cette story
- `@aureak/api-client` — pas de changement API
- Toute migration Supabase — sans objet

---

### Multi-tenant

Sans objet — calculs purement côté client sur le tableau `sessions` déjà filtré par tenant via RLS.

---

### Dépendances

Aucune — story autonome.

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

Aucun — implémentation directe sans anomalie.

### Completion Notes List

- 4 stat cards bento insérées entre le header block et les stat cards méthodes
- TypeScript : `as never` requis pour les style arrays sur `AureakText` (pattern cohérent avec codebase)
- Pastille méthode : opacité passée de `'22'` à `'44'` + border ajouté pour meilleure visibilité
- 0 erreurs tsc --noEmit

### File List

| Fichier | Statut |
|---------|--------|
| `aureak/apps/web/app/(admin)/methodologie/seances/index.tsx` | Modifié |
