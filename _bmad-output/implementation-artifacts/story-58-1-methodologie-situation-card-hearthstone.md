# Story 58-1 — Méthodologie : Situation card style Hearthstone

**Epic** : 58 — Méthodologie "Tactical Notebook"
**Status** : done
**Priority** : medium
**Effort** : M (demi-journée)

---

## Contexte

La page `/methodologie/situations` liste les exercices/situations pédagogiques sous forme de lignes tabulaires. Cette story redesigne l'affichage en cards premium inspirées de l'esthétique Hearthstone : illustration terrain ASCII, étoiles de difficulté, badge méthode coloré, objectif pédagogique. Un composant `SituationCard` réutilisable est créé dans `@aureak/ui`.

---

## User Story

**En tant que** coach ou administrateur Aureak,
**je veux** voir les exercices sous forme de cards visuellement riches,
**afin de** parcourir la bibliothèque pédagogique de façon intuitive et mémoriser rapidement les exercices.

---

## Acceptance Criteria

- [ ] AC1 — Un composant `SituationCard` est créé dans `aureak/packages/ui/src/SituationCard.tsx` avec les props : `situation: MethodologySituation`, `onPress?: () => void`, `difficulty?: number` (1–5, défaut 3), `isRecommended?: boolean`
- [ ] AC2 — La card a un fond blanc (`colors.light.surface`), `borderRadius: radius.cardLg`, `boxShadow: shadows.md`, dimensions min-height 200px, max-width 280px (ou responsive en grille)
- [ ] AC3 — La zone supérieure de la card (hauteur 90px) affiche une illustration ASCII du terrain vue du dessus : ligne centrale, surface de réparation, point de penalty — dessinée en `Text` monospace dans un `View` fond vert foncé (`#1a472a`) — l'illustration est statique et commune à toutes les situations
- [ ] AC4 — Un badge méthode coloré (`methodologyMethodColors[situation.method]` depuis `@aureak/theme`) est affiché en overlay haut-droite de la zone illustration, avec le label de la méthode en `fontSize: 10`, `fontWeight: '700'`
- [ ] AC5 — Sous l'illustration, afficher : **nom** de la situation en `fontWeight: '700'`, `fontSize: 15` ; **objectif** en `fontSize: 12`, `colors.text.muted`, `numberOfLines: 2`
- [ ] AC6 — Une rangée d'étoiles (★★★☆☆ pour difficulté 3) est affichée sous l'objectif : étoiles pleines en `colors.accent.gold`, étoiles vides en `colors.border.light`
- [ ] AC7 — Si `isRecommended` est vrai, un badge "✦ Recommandé" or est affiché en haut-gauche en overlay sur la zone illustration
- [ ] AC8 — La page `methodologie/situations/index.tsx` remplace la liste tabulaire par une grille de `SituationCard` (2 colonnes sur mobile, 3 sur desktop via `useWindowDimensions`) — les cartes sont cliquables et naviguent vers la fiche détail
- [ ] AC9 — Zéro hardcode — tokens `@aureak/theme` partout sauf les couleurs terrain (`#1a472a`, `#2d6a4f`) qui sont des constantes locales nommées `FIELD_DARK` / `FIELD_LIGHT`
- [ ] AC10 — Export de `SituationCard` depuis `@aureak/ui/src/index.ts`

---

## Tasks

### T1 — Composant `SituationCard` dans `@aureak/ui`

Fichier : `aureak/packages/ui/src/SituationCard.tsx` (nouveau)

Structure :
```tsx
import { colors, radius, shadows, space } from '@aureak/theme'
import { methodologyMethodColors } from '@aureak/theme'
import type { MethodologySituation } from '@aureak/types'

const FIELD_DARK  = '#1a472a'
const FIELD_LIGHT = '#2d6a4f'

const FIELD_ASCII = `
  ┌─────────────────────┐
  │                     │
  │   ┌───────────┐     │
  │   │     ●     │     │
  │   └───────────┘     │
  │─────────────────────│
  │   ┌───────────┐     │
  │   │           │     │
  │   └───────────┘     │
  └─────────────────────┘
`.trim()

export function SituationCard({ situation, onPress, difficulty = 3, isRecommended = false }: Props) {
  const methodColor = methodologyMethodColors[situation.method] ?? colors.accent.gold
  return (
    <Pressable onPress={onPress} style={styles.card}>
      {/* Zone illustration terrain */}
      <View style={styles.fieldZone}>
        <Text style={styles.fieldAscii}>{FIELD_ASCII}</Text>
        {/* Badge méthode */}
        <View style={[styles.methodBadge, { backgroundColor: methodColor }]}>
          <AureakText variant="caption" style={{ color: '#FFFFFF', fontSize: 10, fontWeight: '700' }}>
            {situation.method}
          </AureakText>
        </View>
        {/* Badge recommandé */}
        {isRecommended && (
          <View style={styles.recommendedBadge}>
            <AureakText variant="caption" style={{ color: colors.accent.gold, fontSize: 10, fontWeight: '700' }}>
              ✦ Recommandé
            </AureakText>
          </View>
        )}
      </View>
      {/* Zone infos */}
      <View style={styles.infoZone}>
        <AureakText variant="body" style={{ fontWeight: '700', fontSize: 15, color: colors.text.dark }}>
          {situation.name}
        </AureakText>
        {situation.objective && (
          <AureakText variant="caption" style={{ color: colors.text.muted, marginTop: space.xs }} numberOfLines={2}>
            {situation.objective}
          </AureakText>
        )}
        {/* Étoiles difficulté */}
        <View style={{ flexDirection: 'row', marginTop: space.xs, gap: 2 }}>
          {[1,2,3,4,5].map(i => (
            <AureakText key={i} style={{ color: i <= difficulty ? colors.accent.gold : colors.border.light, fontSize: 14 }}>
              ★
            </AureakText>
          ))}
        </View>
      </View>
    </Pressable>
  )
}
```

- [ ] Composant `SituationCard` créé avec tous les ACs

### T2 — Export depuis `@aureak/ui`

Fichier : `aureak/packages/ui/src/index.ts`
Ajouter : `export { SituationCard } from './SituationCard'`

- [ ] Export ajouté

### T3 — Migration grille dans `methodologie/situations/index.tsx`

Remplacer la liste tabulaire par une grille de `SituationCard` :
- Import `SituationCard` depuis `@aureak/ui`
- `useWindowDimensions` pour déterminer 2 ou 3 colonnes (seuil 900px)
- Conserver les filtres par méthode en haut de page
- Conserver les boutons d'actions (nouveau, filtres)

- [ ] Grille de cards implémentée dans la page situations

---

## Dépendances

- Epic 20 `done` — méthodologie CRUD existant, type `MethodologySituation` disponible
- `methodologyMethodColors` dans `@aureak/theme` — confirmé (MEMORY.md)

---

## Fichiers modifiés

| Fichier | Action |
|---------|--------|
| `aureak/packages/ui/src/SituationCard.tsx` | Créer |
| `aureak/packages/ui/src/index.ts` | Modifier — export `SituationCard` |
| `aureak/apps/web/app/(admin)/methodologie/situations/index.tsx` | Modifier — grille de cards |

---

## QA post-story

```bash
grep -n "console\." aureak/packages/ui/src/SituationCard.tsx | grep -v "NODE_ENV"
grep -n "'#[0-9A-Fa-f]'" aureak/packages/ui/src/SituationCard.tsx
# Seules FIELD_DARK et FIELD_LIGHT sont autorisées
```

---

## Commit message cible

```
feat(epic-58): story 58-1 — méthodologie situation card Hearthstone-style + grille
```
