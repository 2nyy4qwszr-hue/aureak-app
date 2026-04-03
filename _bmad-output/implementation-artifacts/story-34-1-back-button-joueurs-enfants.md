# Story 34-1 — Back button: joueurs & enfants

**Epic:** 34
**Status:** ready-for-dev
**Priority:** high

## Story
En tant qu'admin, je veux pouvoir revenir à la liste depuis une fiche joueur ou enfant via un bouton ← Retour visible en haut de la page afin de naviguer rapidement sans utiliser le bouton navigateur.

## Acceptance Criteria
- [ ] AC1: Un bouton "← Joueurs" apparaît en haut de `children/[childId]/page.tsx`, avant le titre de la fiche
- [ ] AC2: Un bouton "← Joueurs" apparaît en haut de `players/[playerId]/page.tsx`, avant le titre de la fiche (si la page existe)
- [ ] AC3: Le clic sur le bouton déclenche `router.back()` (ou `router.push('/children')` si `router.back()` peut sortir de l'app)
- [ ] AC4: Le bouton est stylé avec les tokens theme : couleur `colors.text.muted`, hover `colors.accent.gold`, fond transparent
- [ ] AC5: Le bouton est positionné au-dessus du card header (avant le nom du joueur), dans la zone de contenu principal
- [ ] AC6: Sur mobile (si applicable), le bouton reste accessible et non tronqué

## Tasks
- [ ] Lire `aureak/apps/web/app/(admin)/children/[childId]/page.tsx` pour identifier l'emplacement exact du header (avant le titre/nom)
- [ ] Vérifier si `aureak/apps/web/app/(admin)/players/[playerId]/page.tsx` existe
- [ ] Ajouter dans `children/[childId]/page.tsx` le composant back button :
  ```typescript
  import { useRouter } from 'expo-router'
  // ...
  const router = useRouter()
  // Dans le JSX, avant le card header :
  <Pressable onPress={() => router.back()} style={styles.backBtn}>
    <AureakText style={styles.backBtnText}>← Joueurs</AureakText>
  </Pressable>
  ```
- [ ] Ajouter les styles `backBtn` et `backBtnText` dans le StyleSheet local (tokens: `colors.text.muted`, `space.sm`, `space.md`)
- [ ] Si `players/[playerId]/page.tsx` existe, répliquer le même pattern
- [ ] QA: vérifier que le bouton est visible au scroll initial (sans défilement)

## Dev Notes
- Fichiers à modifier: `aureak/apps/web/app/(admin)/children/[childId]/page.tsx`, `aureak/apps/web/app/(admin)/players/[playerId]/page.tsx` (si existant)
- Tokens à utiliser: `colors.text.muted`, `colors.accent.gold`, `space.sm`, `space.md`, `transitions.fast`
- Pattern style:
  ```typescript
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: space.sm,
    paddingHorizontal: space.md,
    alignSelf: 'flex-start',
    marginBottom: space.sm,
  },
  backBtnText: {
    color: colors.text.muted,
    fontSize: 14,
  },
  ```
- `useRouter` est importé depuis `expo-router` — vérifier l'import existant dans le fichier
- Ne pas modifier la structure des données ni les appels API
- Routing Expo Router : `router.back()` est préférable à `router.push('/children')` car il respecte la pile de navigation
