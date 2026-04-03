# Story 34-3 — Back button: séances, groupes & stages

**Epic:** 34
**Status:** ready-for-dev
**Priority:** high

## Story
En tant qu'admin ou coach, je veux pouvoir revenir à la liste depuis une fiche séance, groupe ou stage via un bouton ← Retour afin de naviguer efficacement dans les sections opérationnelles.

## Acceptance Criteria
- [ ] AC1: Un bouton "← Séances" apparaît en haut de `seances/[sessionId]/page.tsx`
- [ ] AC2: Un bouton "← Groupes" apparaît en haut de `groups/[groupId]/page.tsx`
- [ ] AC3: Un bouton "← Stages" apparaît en haut de `stages/[stageId]/page.tsx`
- [ ] AC4: Le clic déclenche `router.back()` dans les trois pages
- [ ] AC5: Style cohérent avec story-34-1 et 34-2 : `colors.text.muted`, fond transparent, positionné avant le header principal
- [ ] AC6: Le bouton reste visible sur la vue planning journées (stages) sans être masqué par un sticky header

## Tasks
- [ ] Vérifier si `aureak/apps/web/app/(admin)/seances/[sessionId]/page.tsx` (ou `index.tsx`) existe
- [ ] Lire `aureak/apps/web/app/(admin)/groups/[groupId]/page.tsx` pour identifier l'emplacement du header
- [ ] Lire `aureak/apps/web/app/(admin)/stages/[stageId]/page.tsx` pour identifier l'emplacement du header (attention aux onglets journées)
- [ ] Ajouter le back button "← Séances" dans la page séance si elle existe
- [ ] Ajouter le back button "← Groupes" dans `groups/[groupId]/page.tsx`
- [ ] Ajouter le back button "← Stages" dans `stages/[stageId]/page.tsx`, avant les onglets journées
- [ ] Ajouter les styles dans le StyleSheet de chaque fichier (même pattern story-34-1)
- [ ] QA: vérifier que dans `stages/[stageId]/page.tsx` le bouton n'est pas masqué par les onglets journées sticky

## Dev Notes
- Fichiers à modifier: `aureak/apps/web/app/(admin)/seances/[sessionId]/page.tsx` (si existant), `aureak/apps/web/app/(admin)/groups/[groupId]/page.tsx`, `aureak/apps/web/app/(admin)/stages/[stageId]/page.tsx`
- Tokens à utiliser: `colors.text.muted`, `colors.accent.gold`, `space.sm`, `space.md`
- Même StyleSheet pattern que stories 34-1 et 34-2 — pas de nouveau composant, inline dans chaque page
- Dans `stages/[stageId]/page.tsx` : la vue planning a des onglets par journée — le back button doit être AVANT les onglets dans le flux de rendu
- Dans `groups/[groupId]/page.tsx` : attention aux sections "Membres" et "Staff" — le back button va tout en haut avant le titre du groupe
- Si `seances/[sessionId]/page.tsx` n'existe pas (route inexistante dans le routing actuel), skip cette sous-tâche et le noter dans le Dev Agent Record
- Dépendance suggérée : implémenter après story-34-1 pour réutiliser le pattern (non bloquant)
