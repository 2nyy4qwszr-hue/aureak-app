# Story 23.5 : Recomposition visuelle des cartes Clubs

Status: done

## Story

En tant qu'administrateur Aureak,
je veux que chaque club soit affiché sous forme d'une carte visuelle premium et structurée (logo, nom, ville, province, compteur gardiens),
afin de scanner rapidement les clubs et d'obtenir une vue cohérente avec le reste de l'administration Aureak.

## Contexte

Cette story crée le composant `ClubCard` qui sera utilisé dans la grille multi-colonnes (Story 23.1). Elle consolide visuellement toutes les données enrichies ajoutées par les stories 23.2 (logo), 23.3 (statut/relation), et 23.4 (compteur gardiens).

**Références visuelles :**
- `ThemeCard.tsx` (`methodologie/_components/ThemeCard.tsx`) : bannière image + body infos + hover shadow
- `children/index.tsx` : grille de cards avec photo avatar, infos joueurs, badges statut
- `clubs/[clubId]/page.tsx` : couleurs badge par statut, palette gold/blue/zinc

**Ordre d'implémentation** : dépend de 23.2, 23.3, 23.4 pour avoir toutes les données. Peut être amorcée avec des données simulées (`gardienCount: 0, logoUrl: null`) si implémentée avant les autres.

## Objectif

Créer un composant `ClubCard` autonome et réutilisable, puis l'intégrer dans la page liste des clubs (prépare Story 23.1).

## Scope IN

- Nouveau composant `aureak/apps/web/app/(admin)/clubs/_components/ClubCard.tsx`
- Structure visuelle : zone logo + corps (nom, ville, province, compteur gardiens, badge statut)
- États hover (élévation shadow, border gold)
- Skeleton loading card (`ClubCardSkeleton`)
- Fallbacks : placeholder logo, données manquantes
- Responsive : le composant s'adapte à la largeur de sa cellule de grille (pas de logique responsive interne)

## Scope OUT

- La logique de grille (responsive, nombre de colonnes) est dans Story 23.1
- Pas d'actions directement dans la carte (pas de menu contextuel, pas de bouton "Modifier") — la carte est cliquable globalement → navigate vers la fiche
- Pas d'affichage du matricule (trop technique pour la vue grille)
- Pas d'affichage de l'email / téléphone dans la carte

## Hiérarchie Visuelle de la Carte

```
┌────────────────────────────┐
│  [Zone logo 80x80]         │  ← logo ou placeholder ⚽ (fond muted)
│  avec badge statut overlay │  ← coin supérieur droit : badge relation type
├────────────────────────────┤
│  Nom du club               │  ← text variant="label", fontWeight 700, 14px
│  Ville · Province          │  ← text caption, muted, 11px
├────────────────────────────┤
│  [ 12 gardiens ]           │  ← stat principale, gold, fontWeight 800, 22px
│  venus à l'académie        │  ← sous-label, muted, 10px
└────────────────────────────┘
```

**Note** : le compteur gardiens est la stat principale visible. Il doit visuellement dominer la carte (grande taille, couleur gold).

## Structure du Composant

### Props

```ts
type ClubCardProps = {
  club    : ClubDirectoryEntry  // ou un sous-type ClubCardData si on veut découpler
  onPress : () => void
}
```

### Composant

```tsx
// aureak/apps/web/app/(admin)/clubs/_components/ClubCard.tsx

import React, { useState } from 'react'
import { View, Image, Pressable, StyleSheet } from 'react-native'
import { AureakText } from '@aureak/ui'
import { colors, space, shadows, radius } from '@aureak/theme'
import type { ClubDirectoryEntry, ClubRelationType } from '@aureak/types'
import { CLUB_RELATION_TYPE_LABELS } from '@aureak/types'

// Couleurs par type de relation
const RELATION_BADGE_COLORS: Record<ClubRelationType, string> = {
  partenaire: colors.accent.gold,
  associe   : '#60a5fa',
  normal    : colors.text.muted,
}

type Props = {
  club   : ClubDirectoryEntry
  onPress: () => void
}

export default function ClubCard({ club, onPress }: Props) {
  const [hovered, setHovered] = useState(false)
  const [imgError, setImgError] = useState(false)

  const showLogo = !!club.logoUrl && !imgError
  const badgeColor = RELATION_BADGE_COLORS[club.clubRelationType ?? 'normal']

  return (
    <Pressable
      onPress={onPress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={[s.card, hovered && s.cardHover]}
    >
      {/* ── Zone Logo ── */}
      <View style={s.logoZone}>
        {showLogo ? (
          <Image
            source={{ uri: club.logoUrl! }}
            style={s.logoImage}
            resizeMode="contain"
            onError={() => setImgError(true)}
          />
        ) : (
          <View style={s.logoPlaceholder}>
            <AureakText style={s.logoIcon}>⚽</AureakText>
          </View>
        )}

        {/* Badge type de relation (overlay coin droit) */}
        {club.clubRelationType !== 'normal' && (
          <View style={[s.relationBadge, { borderColor: badgeColor, backgroundColor: badgeColor + '20' }]}>
            <AureakText style={[s.relationBadgeText, { color: badgeColor }]}>
              {CLUB_RELATION_TYPE_LABELS[club.clubRelationType]}
            </AureakText>
          </View>
        )}
      </View>

      {/* ── Corps ── */}
      <View style={s.body}>
        {/* Nom */}
        <AureakText variant="label" style={s.name} numberOfLines={2}>
          {club.nom}
        </AureakText>

        {/* Ville · Province */}
        {(club.ville || club.province) && (
          <AureakText variant="caption" style={s.location}>
            {[club.ville, club.province].filter(Boolean).join(' · ')}
          </AureakText>
        )}

        {/* Compteur gardiens — stat principale */}
        <View style={s.statBlock}>
          <AureakText style={s.statNumber}>
            {club.gardienCount ?? 0}
          </AureakText>
          <AureakText style={s.statLabel}>
            {(club.gardienCount ?? 0) <= 1 ? 'gardien' : 'gardiens'}
          </AureakText>
        </View>
      </View>
    </Pressable>
  )
}
```

### Styles

```ts
const s = StyleSheet.create({
  card: {
    backgroundColor: colors.light.surface,
    borderRadius   : radius.card,  // 12
    borderWidth    : 1,
    borderColor    : colors.border.light,
    overflow       : 'hidden',
    boxShadow      : shadows.sm,
  } as never,
  cardHover: {
    boxShadow  : shadows.md,
    borderColor: colors.accent.gold + '60',
  } as never,

  // Zone logo
  logoZone: {
    backgroundColor: colors.light.muted,
    alignItems     : 'center',
    justifyContent : 'center',
    paddingVertical: space.md,
    position       : 'relative',
  },
  logoImage: {
    width : 80,
    height: 80,
  },
  logoPlaceholder: {
    width           : 80,
    height          : 80,
    alignItems      : 'center',
    justifyContent  : 'center',
    backgroundColor : colors.accent.gold + '10',
    borderRadius    : radius.card,
  },
  logoIcon: {
    fontSize: 36,
  } as never,

  // Badge relation type
  relationBadge: {
    position         : 'absolute' as never,
    top              : space.sm,
    right            : space.sm,
    borderWidth      : 1,
    borderRadius     : 8,
    paddingHorizontal: 7,
    paddingVertical  : 2,
  },
  relationBadgeText: {
    fontSize  : 9,
    fontWeight: '700',
  } as never,

  // Corps
  body: {
    padding: space.md,
    gap    : space.xs,
  },
  name: {
    color     : colors.text.dark,
    fontSize  : 14,
    fontWeight: '700',
    lineHeight: 18,
  } as never,
  location: {
    color   : colors.text.muted,
    fontSize: 11,
  } as never,

  // Stat gardiens
  statBlock: {
    marginTop  : space.sm,
    alignItems : 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border.divider,
    paddingTop : space.sm,
  },
  statNumber: {
    fontSize  : 28,
    fontWeight: '800',
    color     : colors.accent.gold,
    lineHeight: 32,
  } as never,
  statLabel: {
    fontSize  : 10,
    color     : colors.text.muted,
    fontWeight: '500',
    textTransform: 'uppercase' as never,
    letterSpacing: 0.5,
  } as never,
})
```

### Skeleton

```tsx
export function ClubCardSkeleton() {
  return (
    <View style={sk.card}>
      <View style={sk.logoZone} />
      <View style={sk.body}>
        <View style={sk.nameLine} />
        <View style={sk.locationLine} />
        <View style={sk.statLine} />
      </View>
    </View>
  )
}

const sk = StyleSheet.create({
  card       : { backgroundColor: colors.light.surface, borderRadius: radius.card, borderWidth: 1, borderColor: colors.border.light, overflow: 'hidden', opacity: 0.6 },
  logoZone   : { height: 112, backgroundColor: colors.light.muted },
  body       : { padding: space.md, gap: space.sm },
  nameLine   : { height: 14, backgroundColor: colors.light.muted, borderRadius: 4, width: '75%' },
  locationLine: { height: 11, backgroundColor: colors.light.muted, borderRadius: 4, width: '50%' },
  statLine   : { height: 32, backgroundColor: colors.light.muted, borderRadius: 4, width: '40%', alignSelf: 'center', marginTop: space.sm },
})
```

## Impacts Front-End

### Fichier à créer

`aureak/apps/web/app/(admin)/clubs/_components/ClubCard.tsx`

### Intégration temporaire dans `clubs/page.tsx`

En attendant la Story 23.1 (grille responsive), on peut tester le composant en remplaçant une ligne de la table par une carte, ou simplement valider le composant de manière isolée.

**Important** : la Story 23.1 effectuera la vraie intégration dans la grille. Cette story se concentre uniquement sur le composant card et sa validation visuelle.

## Validations

- Affiche correctement tous les fallbacks (pas de logo, pas de ville, gardienCount = 0)
- Hover visible (shadow + border gold léger)
- Nom tronqué à 2 lignes si trop long (`numberOfLines={2}`)
- Badge relation uniquement si `clubRelationType !== 'normal'` (évite l'encombrement visuel)
- Skeleton cohérent avec les dimensions de la carte

## Dépendances

- **Dépend strictement de** :
  - Story 23.3 : `ClubRelationType`, `CLUB_RELATION_TYPE_LABELS` dans `@aureak/types`, `clubRelationType` dans `ClubDirectoryEntry`
  - Story 23.2 : `logoUrl` dans `ClubDirectoryEntry`
  - Story 23.4 : `gardienCount` dans `ClubDirectoryEntry`
- **Bloque** : Story 23.1 (la grille importe `ClubCard`)
- **Important** : peut être développée avant 23.2/23.3/23.4 en utilisant des valeurs par défaut (`logoUrl: null, clubRelationType: 'normal', gardienCount: 0`) pour tester visuellement, puis finalisée une fois les autres stories complètes

## Risques / Points d'Attention

1. **Taille fixe vs responsive** : la zone logo est en taille fixe (80x80). Si les logos ont des ratios très variables, `resizeMode="contain"` avec un fond de couleur uniforme est la solution retenue. Pas de recadrage forcé.
2. **Stat "0 gardien"** : afficher 0 peut sembler négatif pour des clubs récents. L'admin peut filtrer par statut ou ne pas afficher ce compteur pour les clubs à 0. Décision : l'afficher quand même pour être exhaustif.
3. **Accessibilité** : le `Pressable` doit avoir un `accessibilityLabel` contenant le nom du club.
4. **Performances** : si la liste contient 200+ clubs, chaque `ClubCard` est rendu. Prévoir une liste virtualisée dans Story 23.1 (`FlatList` ou pagination existante).

## Critères d'Acceptation

1. Le composant `ClubCard` est créé et importable depuis `clubs/_components/ClubCard`
2. Affiche le logo si disponible, sinon le placeholder ⚽
3. Affiche le nom du club (tronqué à 2 lignes si nécessaire)
4. Affiche ville et province si disponibles, sinon rien (pas de "—")
5. Affiche le compteur gardiens avec la mise en avant gold
6. Le badge de relation type (`Partenaire` / `Associé`) s'affiche uniquement pour les clubs non-normaux
7. L'état hover (shadow elevation + border gold) fonctionne sur web
8. `ClubCardSkeleton` s'affiche correctement en état loading
9. Types TypeScript compilent sans erreur

## Suggestions de Tests

- Test visuel : afficher 3 cartes (partenaire + associé + normal) avec logos différents
- Test fallback : card avec `logoUrl: null` → placeholder ⚽ visible
- Test fallback : card avec `ville: null` et `province: null` → pas de ligne location
- Test overflow : nom très long → tronqué à 2 lignes
- Test hover : cursor hover → shadow augmentée, border légèrement dorée

## Questions Critiques

1. **"0 gardien"** : afficher le compteur même à 0 ? Ou le masquer si `gardienCount === 0` ? Je recommande de l'afficher toujours pour cohérence visuelle.
2. **Placeholder logo** : le ⚽ est-il le bon fallback, ou préfères-tu les initiales du club (style `PlayerCard`) ? Les initiales sont plus distinctives visuellement.
3. **Badge "normal"** : confirmer que les clubs à statut "normal" n'affichent PAS de badge (pour garder la carte épurée).

## Tasks / Subtasks

- [x] Vérifier que 23.3 est complète (types `ClubRelationType` disponibles) (dépendance)
- [x] Vérifier que 23.2 est complète (`logoUrl` dans `ClubDirectoryEntry`) (dépendance)
- [x] Vérifier que 23.4 est complète (`gardienCount` dans `ClubDirectoryEntry`) (dépendance)
- [x] Créer `aureak/apps/web/app/(admin)/clubs/_components/ClubCard.tsx` (AC: 1-8)
  - [x] Composant `ClubCard` avec props et logique hover
  - [x] Zone logo avec image + fallback placeholder
  - [x] Badge type de relation (overlay)
  - [x] Corps : nom, ville/province, stat gardiens
  - [x] Composant `ClubCardSkeleton`
  - [x] Styles `StyleSheet`
- [x] Vérifier compilation TypeScript (AC: 9)

## Dev Notes

### Structure de fichiers impactée
- `aureak/apps/web/app/(admin)/clubs/_components/ClubCard.tsx` (NOUVEAU)

### Références de code
- `ThemeCard.tsx` : modèle principal (bannière + body + hover)
  - Fichier : `aureak/apps/web/app/(admin)/methodologie/_components/ThemeCard.tsx`
- `children/index.tsx` : pattern `avatarBgColor()` si initiales comme fallback
- `clubs/[clubId]/page.tsx` ligne 123-128 : `STATUT_COLORS` pour les couleurs badges

### Ordre d'intégration
1. Développer le composant en isolation avec des props mockées
2. Tester visuellement dans la page liste (remplacement temporaire d'une ligne de table)
3. Story 23.1 intègre définitivement le composant dans la grille responsive

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

_none_

### Completion Notes List

- Résolution dépendance 23.2 : `logoUrl: string | null` ajouté à `ClubDirectoryEntry` (entities.ts). Populated automatiquement par l'api-client via `createSignedUrls` (batch) dans `listClubDirectory` et `createSignedUrl` (single) dans `getClubDirectoryEntry`.
- `LOGO_BUCKET` constant déplacée en tête de `club-directory.ts` pour être accessible aux nouvelles fonctions.
- `clubs/[clubId]/page.tsx` simplifié : suppression du state `logoSignedUrl` et de l'import `getClubLogoSignedUrl` — la page utilise maintenant `club.logoUrl` directement.
- `ClubCard.tsx` créé avec `ClubCardSkeleton` exporté nommé. Badge relation masqué pour type `'normal'` (conformément à l'AC 6).

### File List

- `aureak/packages/types/src/entities.ts` — ajout `logoUrl: string | null` dans `ClubDirectoryEntry`
- `aureak/packages/api-client/src/admin/club-directory.ts` — `logoUrl: null` dans `mapRow`, batch signed URLs dans `listClubDirectory`, single signed URL dans `getClubDirectoryEntry`, `LOGO_BUCKET` déplacé en tête
- `aureak/apps/web/app/(admin)/clubs/[clubId]/page.tsx` — suppression `logoSignedUrl` state, utilisation `club.logoUrl`
- `aureak/apps/web/app/(admin)/clubs/_components/ClubCard.tsx` — NOUVEAU : composant `ClubCard` + `ClubCardSkeleton`
- `aureak/apps/web/app/(admin)/clubs/_components/index.ts` — NOUVEAU : barrel export `ClubCard` + `ClubCardSkeleton`

### Senior Developer Review

**Reviewer:** claude-sonnet-4-6 (adversarial)
**Result:** PASS (toutes issues corrigées)

- **H1 FIXED** — pluralisation `count <= 1` → `count === 1` (`ClubCard.tsx:88`)
- **M1 FIXED** — `useEffect(() => setImgError(false), [club.logoUrl])` ajouté (`ClubCard.tsx:30`)
- **M2 FIXED** — `uploadClubLogo` ne génère plus la signed URL (retourne `signedUrl: null`) — appel Storage superflu supprimé
- **M3 FIXED** — `console.warn` ajouté pour les items `signedUrl: null` dans le batch `createSignedUrls`
- **L1 FIXED** — `RELATION_BADGE_COLORS` typé `Record<Exclude<ClubRelationType, 'normal'>, string>` — entrée morte supprimée
- **L2 FIXED** — `?? 'normal'` redondant supprimé via refactor L1 (`isNonNormal` guard)
- **L3 FIXED** — `_components/index.ts` barrel créé
