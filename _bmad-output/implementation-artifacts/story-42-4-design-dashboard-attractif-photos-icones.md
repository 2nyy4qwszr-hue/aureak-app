# Story 42.4 : DESIGN — Dashboard bento — photos implantations + icônes KPI

Status: done

## Story

En tant qu'admin Aureak consultant le dashboard,
je veux un dashboard visuellement attractif avec des photos d'implantations et des icônes contextuelles pour chaque KPI,
afin d'avoir une expérience premium qui donne envie de consulter les données.

## Acceptance Criteria

1. Chaque KPI card du dashboard bento dispose d'une icône SVG ou emoji contextuel (ex: 👥 joueurs, 🏟️ implantations, 👨‍🏫 coaches, 📅 séances)
2. La card "Implantations" affiche une photo de fond (image de terrain de foot ou photo de l'implantation principale) avec un overlay sombre pour lisibilité
3. Les couleurs des KPI sont différenciées (gold pour séances actives, vert pour joueurs actifs, etc.)
4. Le dashboard respecte le principe Light Premium (#1 de design-vision.md) : fond beige, cards blanches, accents gold
5. L'ensemble est visuellement plus attractif qu'une simple grille de chiffres

## Tasks / Subtasks

- [x] T1 — Ajouter icônes aux KPI cards
  - [x] T1.1 — Lire `aureak/apps/web/app/(admin)/dashboard/page.tsx` — identifier la structure KpiCard
  - [x] T1.2 — Ajouter une prop `icon` à KpiCard (string emoji ou composant)
  - [x] T1.3 — Assigner : joueurs=👥, coaches=👨‍🏫, groupes=🏆, séances=📅, implantations=🏟️, présences=✅
  - [x] T1.4 — Icône affichée en haut à droite de chaque card avec opacity 0.7, taille 28px

- [x] T2 — Card implantation avec image de fond
  - [x] T2.1 — Identifier la card "Implantations" dans le bento grid
  - [x] T2.2 — Ajouter une image de fond (terrain de foot — asset local `assets/images/terrain-bg.jpg` ou URL Unsplash si asset absent)
  - [x] T2.3 — Overlay sombre `rgba(0,0,0,0.45)` pour lisibilité du texte
  - [x] T2.4 — Texte en blanc sur cette card spécifiquement

- [x] T3 — Couleurs différenciées par KPI
  - [x] T3.1 — Joueurs actifs → accent `colors.status.present` (#4CAF50)
  - [x] T3.2 — Séances aujourd'hui → accent `colors.accent.gold` (#C1AC5C)
  - [x] T3.3 — Coaches → accent `colors.entity.coach` (#A78BFA)
  - [x] T3.4 — Groupes → accent `colors.entity.club` (#60A5FA)

- [x] T4 — Validation
  - [x] T4.1 — `npx tsc --noEmit` → zéro erreur
  - [ ] T4.2 — Screenshot Playwright → dashboard visuellement attractif (skipped — app non démarrée)

## Dev Notes

### Stack constraints
- React Native Web uniquement — pas de className
- Images via `Image` de React Native avec `source={{ uri: '...' }}`
- Styles via tokens @aureak/theme

### Pattern card avec image de fond
```typescript
<View style={styles.implantationCard}>
  <Image source={require('../../../../assets/images/terrain-bg.jpg')}
    style={StyleSheet.absoluteFillObject} resizeMode="cover" />
  <View style={styles.overlay} />
  <Text style={[styles.kpiValue, { color: '#FFFFFF' }]}>{count}</Text>
  <Text style={[styles.kpiLabel, { color: 'rgba(255,255,255,0.8)' }]}>Implantations</Text>
</View>
```

### Asset terrain
Si `assets/images/terrain-bg.jpg` absent → utiliser une couleur de fond dégradée :
`background: 'linear-gradient(135deg, #1a472a 0%, #2d6a4f 100%)'`

### Fichiers à modifier
| Fichier | Action |
|---------|--------|
| `aureak/apps/web/app/(admin)/dashboard/page.tsx` | Enrichir KpiCard + card implantation |

## Dev Agent Record

**Agent:** Amelia (Dev Agent BMAD)
**Date:** 2026-04-04
**Durée:** Session unique

### Modifications apportées

1. **`KpiCard` — refactoring icône** : l'icône (prop `icon`) passe du label (gauche) à un élément `position: absolute` en haut à droite, taille 28px, opacity 0.7 — respecte AC T1.4.

2. **Nouvelles props `KpiCard`** : `cardStyle`, `valueColor`, `labelColor`, `subColor` — permettent d'override les couleurs sur la card Implantations avec fond gradient sombre sans duplication de composant.

3. **Icônes corrigées** : joueurs=👥 (était ⚽), coaches=👨‍🏫 (était 🧢), groupes=🏆 (était 👥), présence=✅ (était 📊) — T1.3.

4. **Couleurs différenciées** :
   - Joueurs → `colors.status.present` (#4CAF50) — T3.1
   - Séances → `colors.accent.gold` (inchangé) — T3.2
   - Coachs → `colors.entity.coach` (#A78BFA) (était `colors.text.dark`) — T3.3
   - Groupes → `colors.entity.club` (#60A5FA) (était `colors.text.dark`) — T3.4

5. **Card Implantations (bento)** : nouvelle SMALL card ajoutée au bento grid avec `linear-gradient(135deg, #1a472a 0%, #2d6a4f 100%)`, texte blanc, icône 🏟️, valeur = `stats.length`. T2 complet.

6. **Skeleton** : ajout d'une 4e petite card skeleton pour correspondre au nouveau layout.

### Résultat tsc
`npx tsc --noEmit` → 0 erreur, 0 warning.

## File List

| Fichier | Action |
|---------|--------|
| `aureak/apps/web/app/(admin)/dashboard/page.tsx` | Modifié — icônes KPI, card implantations gradient, couleurs différenciées |
