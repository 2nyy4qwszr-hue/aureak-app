# Story 35-2 — Empty states: fiches détail

**Epic:** 35
**Status:** ready-for-dev
**Priority:** medium

## Story
En tant qu'admin, je veux voir un message clair quand les sections d'une fiche (historique football, membres d'un groupe, coachs d'un groupe) sont vides afin de savoir que la section est vide et non en erreur, avec un appel à l'action direct.

## Acceptance Criteria
- [ ] AC1: Dans `children/[childId]/page.tsx` — section historique football : quand `history.length === 0` et chargement terminé, afficher `<EmptyState title="Aucun historique football" subtitle="Aucun parcours enregistré pour ce joueur" ctaLabel="Ajouter un parcours" onCta={handleOpenAddHistoryModal} />`
- [ ] AC2: Dans `groups/[groupId]/page.tsx` — section membres : quand `members.length === 0` et chargement terminé, afficher `<EmptyState title="Aucun membre" subtitle="Ce groupe n'a pas encore de membres" />`
- [ ] AC3: Dans `groups/[groupId]/page.tsx` — section coachs/staff : quand `staff.length === 0` et chargement terminé, afficher `<EmptyState title="Aucun coach assigné" subtitle="Ajoutez un coach à ce groupe" />`
- [ ] AC4: Le composant `EmptyState` utilisé est celui créé en story-35-1 (import depuis `@aureak/ui`)
- [ ] AC5: Les EmptyState de détail ne proposent un CTA que si l'action est disponible dans le contexte (ex: historique → CTA ouvrir modal ; membres → pas de CTA si ajout non implémenté dans cette page)
- [ ] AC6: Aucun EmptyState n'est affiché pendant le chargement de la section

## Tasks
- [ ] Vérifier que story-35-1 est `done` (composant `EmptyState` disponible dans `@aureak/ui`)
- [ ] Lire `aureak/apps/web/app/(admin)/children/[childId]/page.tsx` pour identifier la section historique football et la variable `history` (ou équivalent)
- [ ] Identifier dans `children/[childId]/page.tsx` le handler d'ouverture du modal ajout historique (`handleOpenAddHistoryModal` ou équivalent)
- [ ] Intégrer `EmptyState` dans la section historique football de `children/[childId]/page.tsx`
- [ ] Lire `aureak/apps/web/app/(admin)/groups/[groupId]/page.tsx` pour identifier les variables `members` et `staff` (ou équivalents)
- [ ] Intégrer `EmptyState` dans la section membres de `groups/[groupId]/page.tsx`
- [ ] Intégrer `EmptyState` dans la section staff/coachs de `groups/[groupId]/page.tsx`
- [ ] QA: vérifier les 3 cas avec des données vides

## Dev Notes
- Fichiers à modifier: `aureak/apps/web/app/(admin)/children/[childId]/page.tsx`, `aureak/apps/web/app/(admin)/groups/[groupId]/page.tsx`
- Dépendance: story-35-1 doit être `done` avant d'implémenter celle-ci
- Import dans les pages:
  ```typescript
  import { EmptyState } from '@aureak/ui'
  ```
- Dans `children/[childId]/page.tsx` : la section historique football peut être dans un bloc conditionnel — remplacer le rendu vide actuel (ou null) par `<EmptyState ...>`
- Dans `groups/[groupId]/page.tsx` : vérifier les noms exacts des variables state (peuvent être `groupMembers`, `groupStaff`, `staffList`, etc.) avant d'implémenter
- Le CTA "Ajouter un parcours" doit ouvrir le modal existant (ne pas créer de nouvelle navigation)
- Pour les sections membres/staff sans CTA d'ajout dans la page détail, ne pas passer `ctaLabel` ni `onCta` — l'EmptyState affichera juste le message
- Pas de migration DB nécessaire
