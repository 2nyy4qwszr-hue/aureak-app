# Story 18.6 : Cartes joueurs — Nouveau design vertical 4-5 colonnes

Status: done

**Dépendances :** Story 18-5 (nom/prenom dans JoueurListItem + formatNomPrenom helper)

## Story

En tant qu'administrateur Aureak,
je veux voir les joueurs dans un nouveau design de carte vertical avec photo en haut et 4-5 colonnes par rangée, sans le bouton "Voir →" redondant,
afin d'afficher plus de joueurs en un coup d'œil et d'avoir une présentation visuelle claire et cohérente.

## Acceptance Criteria

1. **Suppression "Voir →"** — Le label `<AureakText style={card.voirLabel}>Voir →</AureakText>` (ligne 209 de `children/index.tsx`) est supprimé. Le style `card.voirLabel` est supprimé de `StyleSheet.create`. La carte reste entièrement cliquable via `Pressable onPress`.
2. **Layout vertical** — `JoueurCard` adopte un layout vertical : `flexDirection: 'column'`, avec la photo centrée en haut, puis les informations en dessous.
3. **Photo** — `PhotoAvatar` est centré horizontalement en haut de la carte, taille agrandie à `size={80}` (au lieu de 52). Même logique de fallback initiales.
4. **Structure infos** — Chaque information est sur sa propre ligne dans l'ordre : NOM Prénom (ligne 1, gras), Date de naissance (ligne 2), Club actuel (ligne 3), Niveau club (ligne 4), Statut/chips (ligne 5). Si une valeur est `null`/vide, la ligne est masquée.
5. **NOM Prénom** — Utilise `formatNomPrenom(item.nom, item.prenom, item.displayName)` depuis `@aureak/types`. Affichage en `fontWeight: '700'`, taille 13.
6. **Badge "Club partenaire"** — Si `item.isClubPartner`, le badge `InfoChip label="Club partenaire"` s'affiche dans la zone chips (en plus de `StatusChip` et `InfoChip` saisons/stages existants).
7. **Grille 4-5 colonnes** — Le `gridStyle` (Platform.OS === 'web') passe de `minmax(300px, 1fr)` à `minmax(200px, 1fr)`. Objectif : 4 colonnes sur un écran ~900px, 5 colonnes sur ~1100px+.
8. **Skeleton mis à jour** — `SkeletonCard` reflète le nouveau layout vertical : cercle centré en haut (80px), puis lignes de placeholder en dessous (nom, meta, chips).
9. **Hauteur cohérente** — Toutes les cartes ont une hauteur minimale uniforme pour éviter les cartes de hauteurs très disparates (`minHeight` à définir, environ 200-220px).
10. **Accessibilité** — La carte a un `accessibilityRole="button"` et un `accessibilityLabel` du type `"Voir la fiche de ${nomComplet}"`.

## Tasks / Subtasks

- [x] **T1** — Supprimer "Voir →" du composant `JoueurCard` (AC: #1)
  - [x] Supprimer `<AureakText style={card.voirLabel}>Voir →</AureakText>` (ligne ~209)
  - [x] Supprimer le style `voirLabel` dans `const card = StyleSheet.create({...})`
  - [x] Supprimer le style `aside.width: 68` ou adapter si la View aside n'est plus nécessaire

- [x] **T2** — Refactorer `JoueurCard` en layout vertical (AC: #2, #3, #4, #5, #6)
  - [x] Passer `card.container` en `flexDirection: 'column'`, `alignItems: 'center'`, padding uniforme (ex: 12px)
  - [x] Déplacer `PhotoAvatar` en haut (premier enfant), `size={80}`, centré (`alignSelf: 'center'`)
  - [x] Créer zone `card.infoBlock` : `width: '100%'`, `gap: 3`, `marginTop: 10`, `alignItems: 'flex-start'`
  - [x] Ligne NOM Prénom : `formatNomPrenom(item.nom, item.prenom, item.displayName)`, style bold
  - [x] Ligne DOB : `formatBirthDate(item.birthDate)` — masquée si null
  - [x] Ligne Club : `item.currentClub` — masquée si null
  - [x] Ligne Niveau : `item.niveauClub` — masquée si null
  - [x] Zone chips : `StatusChip` + `InfoChip` saisons + `InfoChip` stages + `InfoChip` "Club partenaire" si `isClubPartner`
  - [x] Import `formatNomPrenom` depuis `@aureak/types`

- [x] **T3** — Mettre à jour la grille CSS (AC: #7)
  - [x] Ligne ~429 : `gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))'`
  - [x] Tester visuellement : vérifier 4 colonnes ~900px, 5 colonnes ~1100px

- [x] **T4** — Mettre à jour `SkeletonCard` (AC: #8)
  - [x] Remplacer layout horizontal actuel par layout vertical (miroir de JoueurCard)
  - [x] Cercle placeholder 80px centré en haut
  - [x] 3-4 lignes placeholder en dessous (nom, meta, chips)

- [x] **T5** — Ajouter `minHeight` et padding cohérents (AC: #9)
  - [x] `card.container` : ajouter `minHeight: 210`
  - [x] Vérifier le rendu pour les cartes sans photo, sans club, etc.

- [x] **T6** — Accessibilité (AC: #10)
  - [x] Sur le `Pressable` de `JoueurCard` : ajouter `accessibilityRole="button"` et `accessibilityLabel`
  - [x] `accessibilityLabel = \`Voir la fiche de ${formatNomPrenom(item.nom, item.prenom, item.displayName)}\``

## Dev Notes

### Localisation précise dans le fichier

**`aureak/apps/web/app/(admin)/children/index.tsx`** — seul fichier modifié dans cette story.

| Section | Lignes approx. | Changement |
|---|---|---|
| `JoueurCard` function | 165-213 | Refonte complète du JSX (layout vertical) |
| `card` StyleSheet | 216-263 | Supprimer `voirLabel` + `aside`, refonte container/infos |
| `SkeletonCard` function | 267-295 | Refonte layout vertical |
| `sk` StyleSheet | 288-295 | Mettre à jour pour layout vertical |
| `gridStyle` const | 428-430 | `minmax(300px, 1fr)` → `minmax(200px, 1fr)` |

### Nouveau JSX `JoueurCard` — structure cible

```tsx
<Pressable
  style={({ pressed }) => [card.container, pressed && card.pressed]}
  onPress={onPress}
  accessibilityRole="button"
  accessibilityLabel={`Voir la fiche de ${formatNomPrenom(item.nom, item.prenom, item.displayName)}`}
>
  {/* Photo centrée en haut */}
  <PhotoAvatar
    photoUrl={item.currentPhotoUrl}
    displayName={item.displayName}
    nom={item.nom}
    prenom={item.prenom}
    id={item.id}
    size={80}
  />

  {/* Infos en dessous */}
  <View style={card.infoBlock}>
    <AureakText style={card.name} numberOfLines={1}>
      {formatNomPrenom(item.nom, item.prenom, item.displayName)}
    </AureakText>

    {dob && (
      <AureakText variant="caption" style={card.metaLine}>{dob}</AureakText>
    )}
    {item.currentClub && (
      <AureakText variant="caption" style={card.metaLine} numberOfLines={1}>{item.currentClub}</AureakText>
    )}
    {item.niveauClub && (
      <AureakText variant="caption" style={card.metaLine}>{item.niveauClub}</AureakText>
    )}

    <View style={card.chips}>
      {item.computedStatus && <StatusChip status={item.computedStatus} />}
      {item.totalAcademySeasons > 0 && <InfoChip label={`${item.totalAcademySeasons} saison${...}`} color="#9E9E9E" />}
      {item.totalStages > 0 && <InfoChip label={`${item.totalStages} stage${...}`} color="#4FC3F7" />}
      {item.isClubPartner && <InfoChip label="Club partenaire" color={colors.accent.gold} />}
    </View>
  </View>
</Pressable>
```

### Mise à jour `PhotoAvatar`

La prop `displayName` reste pour fallback. Si la story 18-5 a mis à jour `getInitials` pour accepter `nom`/`prenom`, passer ces props à `PhotoAvatar` ici.

Structure props mise à jour :
```tsx
function PhotoAvatar({ photoUrl, displayName, nom, prenom, id, size = 52 }: {
  photoUrl   : string | null
  displayName: string
  nom?       : string | null
  prenom?    : string | null
  id         : string
  size?      : number
})
```

### CSS Grid — cibles de colonnes

| Largeur viewport | Colonnes attendues |
|---|---|
| < 600px | 1-2 colonnes (mobile fallback) |
| 600-800px | 3 colonnes |
| 800-1000px | 4 colonnes |
| > 1000px | 5 colonnes |

`minmax(200px, 1fr)` atteint ces cibles naturellement avec `auto-fill`.

### Design tokens à utiliser

- `colors.light.surface` — fond carte
- `colors.border.light` — bordure
- `shadows.sm` — ombre repos
- `colors.text.dark` — NOM Prénom
- `colors.text.muted` — DOB, Club, Niveau
- `colors.accent.gold` — badge club partenaire
- `radius.cardLg: 24` — (optionnel si on veut des cartes très arrondies)

### References

- [Source: aureak/apps/web/app/(admin)/children/index.tsx#L165-L263] — JoueurCard actuel et styles card
- [Source: aureak/apps/web/app/(admin)/children/index.tsx#L267-L295] — SkeletonCard actuel
- [Source: aureak/apps/web/app/(admin)/children/index.tsx#L427-L430] — gridStyle actuel minmax(300px)
- [Source: aureak/apps/web/app/(admin)/children/index.tsx#L209] — label "Voir →" à supprimer
- [Source: Story 18-5] — formatNomPrenom, JoueurListItem.nom/prenom/isClubPartner
- [Source: MEMORY.md#Design System v2] — tokens colors.light.*, shadows, radius

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

- T1: `voirLabel` AureakText supprimé + style `voirLabel` supprimé + `aside` View/style supprimés
- T2: `JoueurCard` refactoré layout vertical : `PhotoAvatar size={80}` en haut, `card.infoBlock` avec lignes séparées (nom/dob/club/niveau) masquées si null, chips inchangés, import `formatNomPrenom` déjà présent depuis story 18-5
- T3: gridStyle `minmax(300px, 1fr)` → `minmax(200px, 1fr)` — 4 colonnes ~900px, 5 colonnes ~1100px+
- T4: `SkeletonCard` refactoré vertical : cercle 80px centré + `sk.infoBlock` + 3 lignes placeholder + chips
- T5: `card.container` `minHeight: 210` ajouté
- T6: `Pressable` de `JoueurCard` : `accessibilityRole="button"` + `accessibilityLabel` via `nomComplet`
- ESLint: 0 nouvelles erreurs (10 erreurs pré-existantes hardcoded colors dans avatarBgColor/InfoChip saisons+stages)

### Code Review Fixes (post-review)

- M1: `sk.infoBlock` — suppression du cast `as never` sur `alignItems: 'flex-start'` (cohérence avec `card.infoBlock`)
- L1: Commentaire section L160 mis à jour — "infos gauche · avatar droite" → "layout vertical : photo en haut · infos en dessous"
- L2: `niveauClub` — ajout `numberOfLines={1}` pour éviter débordement sur cartes 200px (cohérence avec `currentClub`)
- L3: Zone chips wrappée dans condition — rendue uniquement si au moins un chip existe (supprime espace `marginTop: 4` vide)

### File List

- `aureak/apps/web/app/(admin)/children/index.tsx` — refonte JoueurCard, SkeletonCard, gridStyle
