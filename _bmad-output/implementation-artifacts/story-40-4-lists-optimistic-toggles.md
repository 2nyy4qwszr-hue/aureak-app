# Story 40-4 — Lists: optimistic UI toggles

**Epic:** 40
**Status:** ready-for-dev
**Priority:** medium

## Story
En tant qu'admin, je veux que les toggles Actif/Inactif dans les fiches détail se mettent à jour visuellement de façon instantanée afin que l'interface semble réactive, avec rollback automatique en cas d'erreur.

## Acceptance Criteria
- [ ] AC1: Dans `clubs/[clubId]/page.tsx`, le toggle "Actif/Inactif" met à jour l'UI immédiatement sans attendre la réponse API
- [ ] AC2: Si l'appel API échoue, l'état revient à la valeur précédente (rollback)
- [ ] AC3: En cas d'erreur, un toast "Erreur — modification annulée" est affiché
- [ ] AC4: Le même pattern est appliqué au toggle "Partenaire" dans `clubs/[clubId]/page.tsx`
- [ ] AC5: Le même pattern est appliqué au toggle "Actif" dans `children/[childId]/page.tsx`
- [ ] AC6: Pendant l'appel API, le toggle est désactivé (pour éviter double-clic) — sans masquer l'UI
- [ ] AC7: En cas de succès, aucune notification n'est requise (l'UI reflète déjà le bon état)

## Tasks
- [ ] Modifier `aureak/apps/web/app/(admin)/clubs/[clubId]/page.tsx` — remplacer le toggle actif par pattern optimistic: `useState(club.actif)`, update immédiat, rollback dans catch
- [ ] Modifier `aureak/apps/web/app/(admin)/clubs/[clubId]/page.tsx` — même pattern pour toggle `is_partner`
- [ ] Modifier `aureak/apps/web/app/(admin)/children/[childId]/page.tsx` — pattern optimistic pour toggle `actif`
- [ ] Vérifier que le composant Toast/notification est disponible dans `@aureak/ui` — si non, utiliser `alert()` temporairement avec TODO
- [ ] Vérifier QA: try/catch/finally correct, console guards présents, rollback bien dans le catch

## Dev Notes
- Fichiers à modifier:
  - `aureak/apps/web/app/(admin)/clubs/[clubId]/page.tsx`
  - `aureak/apps/web/app/(admin)/children/[childId]/page.tsx`
- Pattern optimistic complet:
  ```typescript
  const [optimisticActif, setOptimisticActif] = useState(entity.actif)
  const [isToggling, setIsToggling] = useState(false)

  const handleToggleActif = async () => {
    if (isToggling) return
    const previous = optimisticActif
    setOptimisticActif(!previous)  // Update immédiat
    setIsToggling(true)
    try {
      await updateEntity(id, { actif: !previous })
    } catch (err) {
      setOptimisticActif(previous)  // Rollback
      showToast('Erreur — modification annulée')
      if (process.env.NODE_ENV !== 'production') console.error('[ClubDetail] toggle actif error:', err)
    } finally {
      setIsToggling(false)
    }
  }
  ```
- L'état `optimisticActif` est initialisé depuis les props/données fetchées, mais isolé — pas de re-init si les données parent re-fetchent (sauf si l'ID change)
- Pas de migration Supabase nécessaire
