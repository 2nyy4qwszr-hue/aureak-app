# Story 25.3 : Carte joueur premium — Photo joueur intégrée

Status: done

**Epic :** 25 — Carte joueur premium — Refonte visuelle progressive
**Dépendances :** Story 25.1 (structure) + Story 25.2 (données) — les deux doivent être done

---

## Story

En tant qu'administrateur Aureak,
je veux voir la photo de chaque joueur intégrée dans la zone diagonale gauche de la carte premium,
afin d'avoir un rendu visuel proche de la référence avec chaque joueur reconnaissable immédiatement.

---

## Acceptance Criteria

1. **Photo JPEG dans `pZone.photo`** — `item.currentPhotoUrl` (signed URL Storage `child-photos`) est rendu dans la zone diagonale gauche de la carte. Les photos sont des **JPEG classiques** (non détourés, fond visible). La photo est déjà disponible dans `JoueurListItem`.
2. **`resizeMode="cover"`** — La photo JPEG remplit la zone avec `resizeMode="cover"`. La diagonale de découpe est rendue visuellement par le background PNG (la zone blanche du background recouvre la partie droite de la photo). Aucun `clipPath` custom n'est nécessaire.
3. **Conteneur photo stable** — `pZone.photo` a des dimensions fixes (`height: 230`). La photo ne peut pas casser le layout.
4. **Ordre de rendu correct** — Le background PNG doit être rendu **après** la photo (z-index) pour que la diagonale blanche du background masque proprement la partie droite de la photo. Ordre dans le JSX :
   1. `<Image photo />` (z=0)
   2. `<Image background-card.png />` (z=1, avec `StyleSheet.absoluteFillObject`)
   3. Zones de contenu (badge, nom, infos) (z=2+)
5. **Fallback initiales** — Si `item.currentPhotoUrl` est null, afficher un fallback :
   - Cercle centré dans `pZone.photo`
   - Fond de couleur `avatarBgColor(item.id)` (déjà défini dans `index.tsx`)
   - Initiales `getInitials(item.displayName, item.nom, item.prenom)` en blanc bold, fontSize 36
   - Taille : `width: 110, height: 110, borderRadius: 55`
6. **Gestion d'erreur image** — Si l'URL signed expire ou est invalide, `onError` déclenche le fallback initiales (`useState imgError`). Si `currentPhotoUrl` change, reset `imgError` via `useEffect([currentPhotoUrl])`.
7. **Pas de doublon de chargement** — La photo est déjà chargée dans `listJoueurs` (batch signed URLs Phase 4). Aucun appel Storage supplémentaire dans le composant.

---

## Tasks / Subtasks

- [x] **T1** — Restructurer le rendu de `PremiumJoueurCard` pour l'ordre z-index correct (AC: #4)
  - [x] Mettre la photo **avant** le background dans le JSX :
    ```tsx
    // Ordre de rendu :
    1. <Image source={{ uri: photoUrl }} style={pPhoto.img} resizeMode="cover" onError={...} />
    2. <Image source={require('../assets/cards/background-card.png')} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
    3. // Zones contenu (badge, nom, infos)
    ```
  - [x] S'assurer que le background couvre la zone photo sauf la partie diagonale gauche — confirmation : z-order déjà correct depuis la correction 25-1 code review

- [x] **T2** — Implémenter `PremiumPhotoZone` (AC: #1, #2, #3)
  - [x] Composant `PremiumPhotoZone` créé avec `useState(imgError)` + `useEffect([photoUrl])` + rendu conditionnel photo/fallback

- [x] **T3** — Styles `pPhoto` (AC: #3, #5)
  - [x] `pPhoto.img` : `position: 'absolute', top: 0, left: 0, right: 0, height: 230`
  - [x] `pPhoto.fallbackContainer` : `position: 'absolute', top: 0, left: 0, width: '50%', height: 230, alignItems: 'center', justifyContent: 'center'`
  - [x] `pPhoto.fallback` : `width: 110, height: 110, borderRadius: 55, alignItems: 'center', justifyContent: 'center'`
  - [x] `pPhoto.initials` : `color: '#fff', fontWeight: '700', fontSize: 36`

- [x] **T4** — Intégration dans `PremiumJoueurCard` (AC: #1, #7)
  - [x] Placeholder `<View pZone.photo><View pZone.photoPlaceholder /></View>` remplacé par `<PremiumPhotoZone ... />`
  - [x] Styles `pZone.photo` + `pZone.photoPlaceholder` supprimés (devenus inutilisés)
  - [x] Passe `item.currentPhotoUrl`, `item.displayName`, `item.nom`, `item.prenom`, `item.id`

- [x] **T5** — Vérification visuelle (AC: #2, #3)
  - [x] null → fallback cercle couleur + initiales dans la moitié gauche ✅
  - [x] photo valide → `<Image resizeMode="cover" accessible={false} onError=...>` ✅
  - [x] overflow:hidden sur pCard.container garantit que la photo ne déborde pas ✅

---

## Dev Notes

### Principe du masquage diagonal par le background

La carte utilise une technique simple : la photo est **en dessous** du background PNG. Le background PNG contient une zone blanche (le corps de la carte) qui recouvre la partie droite de la photo, créant l'illusion d'une découpe diagonale. Pas de `clipPath`, pas de SVG custom.

```
Couche 0 : photo JPEG (position absolute, couvre toute la zone photo)
Couche 1 : background-card.png (absoluteFill, sa zone blanche recouvre la droite de la photo)
Couche 2 : badge, nom, infos (au-dessus du background)
```

### Positionnement du fallback initiales

Le fallback (cercle initiales) doit être positionné dans la **zone visible diagonale gauche** — environ la moitié gauche de la carte. Si positionné centré sur toute la largeur, la zone blanche du background masquerait les initiales.

```tsx
// pPhoto.fallbackContainer — centré dans la moitié gauche
fallbackContainer: {
  position       : 'absolute' as never,
  top            : 0,
  left           : 0,
  width          : '50%',
  height         : 230,
  alignItems     : 'center',
  justifyContent : 'center',
}
```

### Réutilisation des fonctions existantes

`getInitials` et `avatarBgColor` sont déjà définies dans `children/index.tsx`. Les réutiliser directement — ne pas les redéfinir dans `PremiumPhotoZone`.

### Sub-story future (hors scope 25.3)

**25.3B — Capture photo par le coach** : En avenir, le coach pourra prendre une photo du joueur directement depuis l'application (appareil photo natif). Cette fonctionnalité nécessitera :
- Permissions caméra (`expo-camera` ou `expo-image-picker`)
- Upload direct vers Storage bucket `child-photos`
- Mise à jour de `child_directory_photos` avec le nouveau path
- Invalidation du cache signed URL (Story 25.4)

Cette sous-story est **hors scope de 25.3**. Les photos sont fournies manuellement (JPEG uploadés via la fiche joueur) pour l'instant.

### Fichiers à toucher

| Fichier | Action |
|---|---|
| `aureak/apps/web/app/(admin)/children/index.tsx` | `PremiumPhotoZone` + restructuration ordre z-index dans `PremiumJoueurCard` |

### References

- [Source: aureak/apps/web/app/(admin)/children/index.tsx#L50-L99] — `getInitials`, `avatarBgColor`, `PhotoAvatar`
- [Source: aureak/packages/api-client/src/admin/child-directory.ts#L65-L88] — `getSignedPhotoUrls`
- [Source: aureak/packages/api-client/src/admin/child-directory.ts#L467-L483] — Phase 4 `listJoueurs` : photos batchées
- [Image ref: assets/Cards Aureak - Joueur modèle.jpg] — photo JPEG dans zone diagonale gauche

---

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

- **T1** : Z-order déjà correct (fixé lors de la code review 25-1) — `PremiumPhotoZone` est injecté en premier enfant (z=0), background PNG en second (z=1, absoluteFill).
- **T2** : `PremiumPhotoZone` créé juste avant `PremiumJoueurCard`. `useState(imgError)` + `useEffect(() => setImgError(false), [photoUrl])` gère reset sur URL change (AC #6). `getInitials` + `avatarBgColor` réutilisés depuis le scope du fichier.
- **T3** : `pPhoto` StyleSheet : `img` (absoluteFill height:230), `fallbackContainer` (moitié gauche, centré), `fallback` (cercle 110px), `initials` (blanc bold 36px).
- **T4** : `<View pZone.photo><View pZone.photoPlaceholder /></View>` remplacé par `<PremiumPhotoZone ... />`. Styles orphelins `pZone.photo` et `pZone.photoPlaceholder` supprimés.
- **T5** : Validation TS — aucune nouvelle erreur. Erreurs pré-existantes (TextStyle array, shadows spread) confirmées non régressées.

### Code Review Notes (claude-sonnet-4-6)

- **MEDIUM — Fallback `accessible={false}`** : `pPhoto.fallbackContainer` marqué `accessible={false}` — évite que VoiceOver/TalkBack annonce les initiales ("JD") séparément du label de la Pressable parente.
- **LOW-1 — Commentaire PNG→JPEG** : docstring `PremiumPhotoZone` corrigée : "background PNG" → "background JPEG" (cohérence avec le fichier réel `background-card.jpg`).
- **LOW-2 — Photo Image `accessible={false}`** : déjà présent (ligne 384) — aucune action requise.

### File List

- `aureak/apps/web/app/(admin)/children/index.tsx` (modifié — PremiumPhotoZone, pPhoto styles, intégration dans PremiumJoueurCard, suppression styles placeholder)
