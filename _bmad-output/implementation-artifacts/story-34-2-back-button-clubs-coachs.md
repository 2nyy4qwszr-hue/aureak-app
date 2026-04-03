# Story 34-2 — Back button: clubs & coachs

**Epic:** 34
**Status:** ready-for-dev
**Priority:** high

## Story
En tant qu'admin, je veux pouvoir revenir à la liste depuis une fiche club ou coach via un bouton ← Retour afin de naviguer rapidement sans perdre le contexte de liste.

## Acceptance Criteria
- [ ] AC1: Un bouton "← Clubs" apparaît en haut de `clubs/[clubId]/page.tsx`, avant le header de la fiche club
- [ ] AC2: Un bouton "← Coachs" apparaît en haut de `coaches/[coachId]/page.tsx`, avant le header de la fiche coach (si la page existe)
- [ ] AC3: Le clic déclenche `router.back()`
- [ ] AC4: Style cohérent avec story-34-1 : `colors.text.muted`, hover `colors.accent.gold`, fond transparent
- [ ] AC5: Le bouton est positionné dans la zone de contenu, visible sans défilement

## Tasks
- [ ] Lire `aureak/apps/web/app/(admin)/clubs/[clubId]/page.tsx` pour identifier l'emplacement du header club
- [ ] Vérifier si `aureak/apps/web/app/(admin)/coaches/[coachId]/page.tsx` (ou équivalent) existe
- [ ] Ajouter le back button dans `clubs/[clubId]/page.tsx` avec label "← Clubs"
- [ ] Si `coaches/[coachId]/page.tsx` existe, ajouter le back button avec label "← Coachs"
- [ ] Ajouter les styles dans le StyleSheet de chaque fichier modifié (réutiliser le même pattern que story-34-1)
- [ ] QA: vérifier positionnement et lisibilité du bouton dans les deux pages

## Dev Notes
- Fichiers à modifier: `aureak/apps/web/app/(admin)/clubs/[clubId]/page.tsx`, `aureak/apps/web/app/(admin)/coaches/[coachId]/page.tsx` (si existant)
- Tokens à utiliser: `colors.text.muted`, `colors.accent.gold`, `space.sm`, `space.md`
- Même pattern exact que story-34-1 — copier le StyleSheet `backBtn` / `backBtnText`
- Dans `clubs/[clubId]/page.tsx`, le header inclut potentiellement le logo + nom du club + boutons d'action — placer le back button AVANT ce bloc header
- Ne pas modifier la logique d'édition inline ni les appels API clubs
- Dépendance suggérée : implémenter après story-34-1 pour réutiliser le pattern établi (non bloquant)
