# Story 32-1 — Bug: uncaught error post-login

**Epic:** 32
**Status:** ready-for-dev
**Priority:** high

## Story
En tant qu'admin, je veux que la connexion ne produise aucune erreur non-catchée dans la console afin d'assurer une expérience stable et d'éviter des crashs silencieux au démarrage.

## Acceptance Criteria
- [ ] AC1: Après login admin, zéro erreur non-catchée visible dans la console navigateur (JS errors / unhandled rejections)
- [ ] AC2: `NotificationContext.tsx` — le subscribe Supabase Realtime est enveloppé dans un try/catch ; la désinscription (unsubscribe) se fait dans le finally ou le cleanup du useEffect
- [ ] AC3: `SearchContext.tsx` — le debounce et tout appel async dans le contexte sont enveloppés en try/catch ; les erreurs sont loguées via console guard (`if (process.env.NODE_ENV !== 'production')`)
- [ ] AC4: `_layout.tsx` — chaque Provider qui effectue un appel async au mount est protégé ; aucun state setter de chargement n'est appelé hors try/finally
- [ ] AC5: Les console.error introduits respectent le guard `NODE_ENV !== 'production'`

## Tasks
- [ ] Lire `aureak/apps/web/components/NotificationContext.tsx` en entier et identifier les appels Realtime non-catchés
- [ ] Lire `aureak/apps/web/components/SearchContext.tsx` en entier et identifier les debounces/appels async non-catchés
- [ ] Lire `aureak/apps/web/app/(admin)/_layout.tsx` et identifier les providers et useEffects au mount
- [ ] Dans `NotificationContext.tsx` : envelopper le subscribe dans try/catch ; ajouter cleanup unsubscribe dans le return du useEffect
- [ ] Dans `SearchContext.tsx` : envelopper tout appel async dans try/catch + console guard
- [ ] Dans `_layout.tsx` : protéger tout appel async au mount (try/finally sur setLoading si applicable)
- [ ] QA scan post-correction : vérifier absence de `setLoading(false)` hors finally, absence de `catch(() => {})` silencieux

## Dev Notes
- Fichiers à modifier: `aureak/apps/web/components/NotificationContext.tsx`, `aureak/apps/web/components/SearchContext.tsx`, `aureak/apps/web/app/(admin)/_layout.tsx`
- Pattern try/finally obligatoire:
  ```typescript
  setLoading(true)
  try {
    await someCall()
  } finally {
    setLoading(false)
  }
  ```
- Console guard obligatoire:
  ```typescript
  if (process.env.NODE_ENV !== 'production') console.error('[NotificationContext] error:', err)
  ```
- Pattern cleanup Realtime Supabase:
  ```typescript
  useEffect(() => {
    let channel: RealtimeChannel
    try {
      channel = supabase.channel('...').on(...).subscribe()
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[NotificationContext] subscribe error:', err)
    }
    return () => { channel?.unsubscribe() }
  }, [])
  ```
- Ne pas modifier la logique métier — correction défensive uniquement
- Routing Expo Router : ne pas toucher aux fichiers `index.tsx` qui re-exportent `page.tsx`
