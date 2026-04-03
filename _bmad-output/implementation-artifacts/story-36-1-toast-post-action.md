# Story 36-1 — Toast post-action systématique

**Epic:** 36
**Status:** ready-for-dev
**Priority:** medium

## Story
En tant qu'admin, je veux voir un toast de confirmation après chaque création réussie (séance, groupe, stage, thème) afin d'avoir un retour visuel immédiat que l'action a bien été enregistrée.

## Acceptance Criteria
- [ ] AC1: Après création réussie dans `seances/new.tsx`, un toast `"Séance créée"` est déclenché avant le `router.replace()`
- [ ] AC2: Après création réussie dans `stages/new.tsx`, un toast `"Stage créé"` est déclenché avant le `router.replace()`
- [ ] AC3: Si `groups/new.tsx` existe, un toast `"Groupe créé"` est déclenché après création réussie
- [ ] AC4: Si `methodologie/themes/new.tsx` existe, un toast `"Thème créé"` est déclenché après création réussie
- [ ] AC5: Le toast est déclenché AVANT le `router.replace()` ou `router.push()` pour garantir son affichage (le composant source est démonté après navigation)
- [ ] AC6: En cas d'erreur, un toast d'erreur est également déclenché (si un système de toast error existe)
- [ ] AC7: Le système de toast utilisé est celui déjà en place dans l'app (vérifier `ToastContext`, `useToast`, ou équivalent — ne pas créer un nouveau système)

## Tasks
- [ ] Identifier le système de toast existant dans l'app : chercher `useToast`, `ToastContext`, `toast.success` dans le codebase
- [ ] Lire `aureak/apps/web/app/(admin)/seances/new.tsx` pour identifier le handler de création et le `router.replace()` post-création
- [ ] Ajouter `toast.success('Séance créée')` (ou équivalent selon l'API toast trouvée) avant le `router.replace()` dans `seances/new.tsx`
- [ ] Lire `aureak/apps/web/app/(admin)/stages/new.tsx` et ajouter `toast.success('Stage créé')` avant la navigation
- [ ] Vérifier si `aureak/apps/web/app/(admin)/groups/new.tsx` existe — si oui, ajouter `toast.success('Groupe créé')`
- [ ] Vérifier si `aureak/apps/web/app/(admin)/methodologie/themes/new.tsx` existe — si oui, ajouter `toast.success('Thème créé')`
- [ ] QA: tester la création d'une séance et vérifier l'apparition du toast avant la redirection

## Dev Notes
- Fichiers à modifier: `aureak/apps/web/app/(admin)/seances/new.tsx`, `aureak/apps/web/app/(admin)/stages/new.tsx`, potentiellement `groups/new.tsx`, `methodologie/themes/new.tsx`
- IMPORTANT — vérifier le système toast existant avant d'implémenter :
  ```bash
  grep -r "useToast\|ToastContext\|toast\.success\|showToast" aureak/apps/web/components/ aureak/apps/web/app/
  ```
- Pattern attendu (adapter selon l'API toast réelle) :
  ```typescript
  const { toast } = useToast() // ou showToast, addToast, etc.
  // ...
  try {
    await createSeance(...)
    toast.success('Séance créée') // AVANT router.replace
    router.replace('/seances')
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') console.error('[SeancesNew] create error:', err)
    toast.error('Erreur lors de la création')
  } finally {
    setSaving(false)
  }
  ```
- Le toast doit être appelé dans le bloc `try`, AVANT la navigation, pour garantir son enregistrement dans le state du provider parent (qui survit à la navigation)
- Si aucun système de toast n'existe dans l'app, NE PAS créer un nouveau système — signaler le blocage et attendre implémentation du ToastProvider (voir `tbd-toasts-feedback.md`)
- Tokens à utiliser: aucun (le toast utilise son propre système de style)
- Console guards obligatoires dans les catch
