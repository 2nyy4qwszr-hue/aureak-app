# Story 73.5 : Design Méthodologie — Retrait bento stats + Cards méthodes pleine largeur uniformes

Status: done

## Story

En tant qu'admin,
je veux que la page Entraînements de Méthodologie affiche uniquement les 7 cards de méthodes en pleine largeur avec un fond uniforme blanc,
afin d'obtenir une interface épurée sans metrics redondantes et sans codes couleurs différenciés par méthode.

## Acceptance Criteria

1. Les 4 cards bento (ENTRAÎNEMENTS ACTIFS, MÉTHODES UTILISÉES, AVEC THÈME, TAUX COMPLÉTUDE) sont entièrement supprimées du rendu et du code JSX.
2. Les 3 useMemo associés (`totalActifs`, `nbMethodes`, `txCompletude`) ainsi que la variable `nbAvecTheme` sont supprimés du composant.
3. Les 7 cards méthodes (Goal and Player, Technique, Situationnel, Perfectionnement, Performance, Décisionnel, Intégration) s'affichent en flex wrap sur toute la largeur de la page, sans ScrollView horizontal.
4. Chaque card méthode a exactement le même fond blanc (`colors.light.surface`), le même `borderRadius` (`radius.cardLg` = 24), et la même bordure (`colors.border.light`) — aucune couleur différenciée par méthode (pas de `borderLeftColor`, pas de `backgroundColor` coloré).
5. Chaque card méthode contient : icône méthode (picto emoji), compteur de séances (nombre), label méthode (texte) — même mise en page pour toutes.
6. La taille des cards est uniforme : `flex: 1`, `minWidth: 130`, permettant au flex wrap de distribuer les 7 cards sur 2 lignes si nécessaire.
7. L'import `methodologyMethodColors` est retiré si plus utilisé dans ce fichier (vérifier usage restant dans les lignes du tableau avant de retirer l'import).
8. Les styles bento (`bentoRow`, `bentoCard`, `bentoCardDark`, `bentoPicto`, `bentoValue`, `bentoLabel`) et les styles anciens scroll méthodes (`statCardsScroll`, `statCardsRow`) sont supprimés du `StyleSheet`.

## Tasks / Subtasks

- [x] T1 — Retirer les 4 stat cards bento et leurs calculs (AC: 1, 2)
  - [x] T1.1 — Supprimer le bloc JSX `{/* ── Stat cards bento — vue synthétique ── */}` (lignes 125–147 de `seances/index.tsx`)
  - [x] T1.2 — Supprimer les 3 `useMemo` : `totalActifs` (ligne 90), `nbMethodes` (ligne 91), `txCompletude` (lignes 94–97)
  - [x] T1.3 — Supprimer la variable `nbAvecTheme = 0` (ligne 93) et son commentaire TODO

- [x] T2 — Refondre les cards méthodes en flex wrap pleine largeur (AC: 3, 4, 5, 6)
  - [x] T2.1 — Remplacer le `<ScrollView horizontal>` + `<View style={st.statCardsRow}>` par un `<View style={st.methodCardsWrap}>` (flex wrap, pleine largeur)
  - [x] T2.2 — Modifier le rendu de chaque card : supprimer `borderLeftColor: accentColor` et toute référence à `methodologyMethodColors` dans ce bloc ; appliquer style `st.methodCard` uniforme
  - [x] T2.3 — Ajouter les styles `methodCardsWrap` et `methodCard` dans le `StyleSheet` (voir Dev Notes)

- [x] T3 — Nettoyage imports et styles (AC: 7, 8)
  - [x] T3.1 — Vérifier si `methodologyMethodColors` est encore utilisé dans le tableau (lignes 287–290 de `seances/index.tsx`) — si oui, conserver l'import ; si non, le retirer
  - [x] T3.2 — Supprimer les styles obsolètes : `bentoRow`, `bentoCard`, `bentoCardDark`, `bentoPicto`, `bentoValue`, `bentoLabel`, `statCardsScroll`, `statCardsRow`, `statCard`, `statPicto`, `statCount`, `statLabel`

- [x] T4 — Validation (AC: tous)
  - [x] T4.1 — Naviguer vers `/methodologie/seances` — vérifier que les 4 bento cards ne s'affichent plus
  - [x] T4.2 — Vérifier que les 7 cards méthodes s'affichent en flex wrap sur la pleine largeur, fond blanc uniforme, même taille
  - [x] T4.3 — Vérifier qu'aucune erreur TypeScript n'est levée (`cd aureak && npx tsc --noEmit`)
  - [x] T4.4 — Vérifier qu'aucune erreur console JS n'apparaît dans le navigateur

## Dev Notes

### ⚠️ Contraintes Stack

Ce projet utilise :
- **React Native Web** (View, Pressable, StyleSheet, Image) — pas de Tailwind, pas de className
- **Tamagui** : XStack, YStack, Text — uniquement dans `_layout.tsx`
- **Tokens `@aureak/theme`** : `colors`, `space`, `shadows`, `radius`, `transitions`
- **Composants `@aureak/ui`** : AureakButton, AureakText, Badge, Card, Input
- **Accès Supabase UNIQUEMENT via `@aureak/api-client`** — jamais direct dans apps/
- **Styles via tokens uniquement** — jamais de couleurs hardcodées
- **Try/finally obligatoire** sur tout state setter de chargement

---

### T2 — Refonte cards méthodes (flex wrap pleine largeur)

Remplacer ce bloc (lignes 150–166 actuelles) :

```tsx
{/* ── Stat cards méthodes ── */}
<ScrollView horizontal showsHorizontalScrollIndicator={false} style={st.statCardsScroll}>
  <View style={st.statCardsRow}>
    {methodCounts.map(({ method, count }) => {
      const accentColor = methodologyMethodColors[method]
      return (
        <View
          key={method}
          style={[st.statCard, { borderLeftColor: accentColor } as object]}
        >
          <AureakText style={st.statPicto}>{METHOD_PICTOS[method]}</AureakText>
          <AureakText style={st.statCount}>{count}</AureakText>
          <AureakText style={st.statLabel}>{method}</AureakText>
        </View>
      )
    })}
  </View>
</ScrollView>
```

Par ce nouveau bloc :

```tsx
{/* ── Cards méthodes — pleine largeur, uniforme ── */}
<View style={st.methodCardsWrap}>
  {methodCounts.map(({ method, count }) => (
    <View key={method} style={st.methodCard}>
      <AureakText style={st.methodCardPicto}>{METHOD_PICTOS[method]}</AureakText>
      <AureakText style={st.methodCardCount}>{count}</AureakText>
      <AureakText style={st.methodCardLabel}>{method}</AureakText>
    </View>
  ))}
</View>
```

---

### T2.3 — Styles à ajouter dans StyleSheet

```tsx
// Cards méthodes — pleine largeur, uniforme
methodCardsWrap: {
  flexDirection : 'row',
  flexWrap      : 'wrap',
  gap           : space.sm,
},
methodCard: {
  flex             : 1,
  minWidth         : 130,
  backgroundColor  : colors.light.surface,
  borderRadius     : radius.cardLg,
  borderWidth      : 1,
  borderColor      : colors.border.light,
  paddingHorizontal: space.md,
  paddingVertical  : 14,
  alignItems       : 'center',
  gap              : 4,
  // @ts-ignore web
  boxShadow        : shadows.sm,
},
methodCardPicto: { fontSize: 28 },
methodCardCount: {
  fontSize  : 22,
  fontWeight: '900',
  fontFamily: 'Montserrat',
  color     : colors.text.dark,
},
methodCardLabel: {
  fontSize     : 9,
  fontWeight   : '700',
  color        : colors.text.muted,
  textTransform: 'uppercase',
  letterSpacing: 0.8,
  textAlign    : 'center',
},
```

Référence tokens : `radius.cardLg = 24` dans `aureak/packages/theme/src/tokens.ts`

---

### T3.1 — Vérification import `methodologyMethodColors`

Dans `seances/index.tsx`, `methodologyMethodColors` est utilisé à deux endroits :
1. **Lignes 152–158 (bloc cards méthodes)** — supprimé par T2.2
2. **Ligne 288 (tableau, variable `methodColor`)** : `const methodColor = session.method ? methodologyMethodColors[session.method] ?? colors.border.light : colors.border.light` — **à conserver** car utilisé pour colorer le cercle méthode dans les lignes du tableau

**Conclusion** : L'import `methodologyMethodColors` depuis `@aureak/theme` doit être **conservé** (usage dans le tableau).

---

### Design

Tokens à utiliser :
```tsx
import { colors, space, shadows, radius } from '@aureak/theme'

// Card méthode uniforme
backgroundColor : colors.light.surface  // blanc pur
borderRadius    : radius.cardLg          // 24px
borderColor     : colors.border.light
boxShadow       : shadows.sm            // jamais shadows.sm.spread etc.
color (count)   : colors.text.dark
color (label)   : colors.text.muted
```

Principes design à respecter :
- Uniformité visuelle — aucune différenciation couleur entre méthodes dans les cards de synthèse
- Pleine largeur — les cards occupent tout l'espace disponible via flex wrap (pas de scroll horizontal)
- Cohérence avec le reste de la page — même fond blanc que les cards de la page (colors.light.surface)

---

### Fichiers à créer / modifier

| Fichier | Action | Notes |
|---------|--------|-------|
| `aureak/apps/web/app/(admin)/methodologie/seances/index.tsx` | Modifier | Retirer bento cards + refondre méthodes cards |

### Fichiers à NE PAS modifier

- `aureak/packages/theme/src/tokens.ts` — non impacté
- `aureak/packages/types/src/enums.ts` — non impacté
- `aureak/apps/web/app/(admin)/methodologie/seances/new.tsx` — non impacté
- `aureak/apps/web/app/(admin)/methodologie/seances/[id]/page.tsx` — non impacté
- Tout fichier hors `methodologie/seances/index.tsx`

---

### Dépendances à protéger

- Le tableau de séances (lignes ~256–366) doit rester intégralement intact — ne pas toucher aux colonnes, styles de lignes, ni à la logique `methodColor` du tableau
- Les filtres (filtersBar, chips, dropdown méthodes) doivent rester intacts
- `methodCounts` (calcul useMemo des counts par méthode) doit être conservé — utilisé par les nouvelles cards

---

### Références

- Design tokens : `aureak/packages/theme/src/tokens.ts` — `radius.cardLg = 24`
- Fichier cible : `aureak/apps/web/app/(admin)/methodologie/seances/index.tsx`
- Story source des 4 bento cards à retirer : `_bmad-output/implementation-artifacts/story-72-5-design-methodologie-entrainements-statcards-bento.md`
- Pattern flex wrap de référence (présences heatmap) : `aureak/apps/web/app/(admin)/activites/presences/page.tsx`

---

### Multi-tenant

Aucun impact multi-tenant — modification purement UI, pas de requête DB ni de filtre tenant.

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List

| Fichier | Statut |
|---------|--------|
| `aureak/apps/web/app/(admin)/methodologie/seances/index.tsx` | À modifier |
