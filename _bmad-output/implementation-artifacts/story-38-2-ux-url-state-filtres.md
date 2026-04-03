# Story 38-2 — UX: URL state filtres & pagination

**Epic:** 38
**Status:** ready-for-dev
**Priority:** medium

## Story
En tant qu'admin, je veux que les filtres et la pagination des listes clubs et joueurs soient persistés dans l'URL afin de pouvoir partager des liens filtrés et utiliser le bouton retour du navigateur.

## Acceptance Criteria
- [ ] AC1: Dans `clubs/page.tsx`, les paramètres search, statut (actif/inactif), province et page courant sont persistés dans les query params URL (ex: `?search=liège&province=Liège&page=2`).
- [ ] AC2: Dans `children/index.tsx`, les paramètres search, statut et page sont persistés dans les query params URL.
- [ ] AC3: Au chargement de la page avec des query params, les filtres sont initialisés depuis l'URL.
- [ ] AC4: Le bouton "Précédent" du navigateur restaure l'état des filtres précédents.
- [ ] AC5: Un lien partagé avec query params ouvre la page avec les filtres appliqués.
- [ ] AC6: La modification d'un filtre met à jour l'URL sans rechargement de page (navigation shallow).

## Tasks
- [ ] Lire `aureak/apps/web/app/(admin)/clubs/page.tsx` pour identifier les states de filtres actuels (search, province, actif, page).
- [ ] Lire `aureak/apps/web/app/(admin)/children/index.tsx` pour identifier les states de filtres actuels (search, statut, page).
- [ ] Dans `clubs/page.tsx` : remplacer les `useState` de filtres par `useSearchParams` (Expo Router) pour lecture initiale + `useRouter().replace()` pour mise à jour.
- [ ] Créer un helper `updateSearchParam(router, searchParams, key, value)` local ou importé depuis un utils partagé pour simplifier la mise à jour URL.
- [ ] Dans `children/index.tsx` : même pattern avec les filtres de cette page.
- [ ] S'assurer que reset du filtre (valeur vide) supprime le query param de l'URL (pas `?search=`).
- [ ] Tester : naviguer vers `clubs/page?province=Liège` → vérifier que le filtre province est pré-sélectionné.
- [ ] QA scan : vérifier try/finally sur les chargements de données.

## Dev Notes
- Fichiers à modifier:
  - `aureak/apps/web/app/(admin)/clubs/page.tsx`
  - `aureak/apps/web/app/(admin)/children/index.tsx`
- Import Expo Router : `import { useRouter, useLocalSearchParams } from 'expo-router'`
- Pattern mise à jour URL :
  ```typescript
  const router = useRouter()
  const params = useLocalSearchParams<{ search?: string; province?: string; page?: string }>()

  const setFilter = (key: string, value: string | undefined) => {
    const current = new URLSearchParams(window.location.search)
    if (value) current.set(key, value)
    else current.delete(key)
    router.replace(`${window.location.pathname}?${current.toString()}`)
  }
  ```
- La pagination doit reset à 1 quand un filtre change (supprimer `page` de l'URL à chaque changement de filtre)
- Pas de migration Supabase — feature purement frontend
- Dépendances story : aucune (tokens et composants existants suffisants)
