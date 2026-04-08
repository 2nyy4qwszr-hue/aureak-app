# Story 69.2 : BUG — Label "En_cours" non mappé dans /stages

Status: done

## Story
En tant qu'admin, je veux que le statut "En cours" des stages s'affiche lisiblement (et non "En_cours" brut), afin d'avoir une interface claire et professionnelle.

## Acceptance Criteria
1. Le badge statut des stages affiche "En cours" (avec espace) au lieu de "En_cours" (avec underscore)
2. Tous les statuts stages sont mappés via un dictionnaire lisible
3. Zéro valeur enum brute visible dans l'UI (ni dans les badges, ni dans les filtres)

## Tasks
- [x] T1 — Dans `stages/index.tsx`, localiser le composant `StatusBadge` — actuellement il affiche `{status.toUpperCase()}` directement (ligne ~36), ce qui produit "EN_COURS"
- [x] T2 — Vérifier si `STAGE_STATUS_LABELS` existe dans `@aureak/types` — si oui : l'importer et l'utiliser. Si non : créer un map local `const STAGE_STATUS_LABELS: Record<StageStatus, string> = { planifié: 'Planifié', en_cours: 'En cours', terminé: 'Terminé', annulé: 'Annulé' }`
- [x] T3 — Dans `StatusBadge`, remplacer `{status.toUpperCase()}` par `{STAGE_STATUS_LABELS[status].toUpperCase()}` (ou sans toUpperCase si le label suffit)
- [x] T4 — Vérifier dans `stages/[stageId]/page.tsx` si le statut est aussi affiché brut — appliquer le même mapping
- [x] T5 — Vérifier les boutons de filtre statut dans `stages/index.tsx` (ligne ~50+) : si le libellé du filtre affiche la valeur enum brute, appliquer le même mapping

## Dev Notes
Fix purement UI — aucune migration. Le bug est dans `StatusBadge` à la ligne `{status.toUpperCase()}` dans `stages/index.tsx`. `StageStatus` type = `'planifié' | 'en_cours' | 'terminé' | 'annulé'` (vérifier dans `@aureak/types`).

Fichiers : `aureak/apps/web/app/(admin)/stages/index.tsx` + `aureak/apps/web/app/(admin)/stages/[stageId]/page.tsx`

## Dev Agent Record
### Agent Model Used
claude-sonnet-4-6

### Résultat
Le bug était déjà corrigé dans le codebase. Les deux fichiers `stages/index.tsx` et `stages/[stageId]/page.tsx` disposaient déjà d'un `STATUS_LABELS: Record<StageStatus, string>` local avec `en_cours: 'En cours'`, et le `StatusBadge` utilisait déjà `STATUS_LABELS[status].toUpperCase()` (pas `status.toUpperCase()`). Les filtres utilisaient aussi correctement `STATUS_LABELS[st as StageStatus]`. Zéro modification de code nécessaire. `npx tsc --noEmit` : 0 erreurs.

### File List
| Fichier | Statut |
|---------|--------|
| `aureak/apps/web/app/(admin)/stages/index.tsx` | Vérifié — déjà correct |
| `aureak/apps/web/app/(admin)/stages/[stageId]/page.tsx` | Vérifié — déjà correct |
