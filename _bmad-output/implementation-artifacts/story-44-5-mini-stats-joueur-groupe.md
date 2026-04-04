# Story 44.5 : Mini stats joueur dans la fiche groupe

Status: ready-for-dev

## Story

En tant qu'admin,
je veux voir la date de naissance, le club et le taux de présence de chaque joueur dans la fiche groupe,
afin d'avoir un aperçu rapide du profil et de l'assiduité sans ouvrir chaque fiche.

## Acceptance Criteria

1. Dans `groups/[groupId]/page.tsx`, chaque membre de la liste affiche en plus du nom : date de naissance (format court "DD/MM/YYYY"), club actuel (texte)
2. Le taux de présence est affiché : "X% (P présents / N séances)" calculé depuis les attendances du joueur dans ce groupe
3. Le taux utilise la couleur token : ≥80% → `colors.status.present`, 60-79% → `colors.status.attention`, <60% → `colors.status.absent`
4. Les infos supplémentaires s'affichent en sous-ligne compacte sous le nom, pas en colonnes séparées
5. Si aucune séance n'a eu lieu dans le groupe → afficher "Aucune séance" à la place du taux

## Technical Tasks

- [ ] Lire `aureak/apps/web/app/(admin)/groups/[groupId]/page.tsx` entièrement — comprendre la liste membres
- [ ] Lire `aureak/packages/api-client/src/` — vérifier si une fonction retourne les stats présence par child + group
- [ ] Si absente : ajouter `listAttendanceStatsByGroup(groupId, tenantId)` dans `sessions/` ou `evaluations/` qui retourne `{ childId, present, total }[]`
- [ ] Charger les stats au mount du groupe avec try/finally + state `attendanceStats`
- [ ] Afficher sous le nom : `[DD/MM/YYYY] · [club] · [X%]` avec couleur taux
- [ ] Styles via tokens uniquement, zéro hardcode
- [ ] Vérifier TypeScript

## Files

- `aureak/apps/web/app/(admin)/groups/[groupId]/page.tsx` (modifier)
- `aureak/packages/api-client/src/sessions/` ou `attendance/` (ajouter fonction stats si manquante)

## Dependencies

- Table `attendances` ✅
- `ChildDirectoryEntry.birthDate`, `currentClub` ✅ dans types
