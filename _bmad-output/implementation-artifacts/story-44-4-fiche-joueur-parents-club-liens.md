# Story 44.4 : Fiche joueur — parents liés et club actuel cliquable

Status: done

## Story

En tant qu'admin,
je veux voir les parents liés à un joueur et naviguer vers son club depuis sa fiche,
afin d'accéder rapidement aux contacts et à la fiche club sans chercher manuellement.

## Acceptance Criteria

1. Dans `children/[childId]/page.tsx`, la section "Parents" affiche les contacts parents liés (nom, email, téléphone) — utiliser les données déjà disponibles dans la fiche (`parent1Name`, `parent1Email`, `parent2Name`, `parent2Email`)
2. Le champ "Club actuel" est un lien cliquable → `router.push('/clubs/' + child.clubDirectoryId)` si `clubDirectoryId` est défini
3. Si `clubDirectoryId` est null → afficher le texte du club sans lien
4. Sur la fiche club `clubs/[clubId]/page.tsx`, la section "Joueurs actuellement" est déjà présente — vérifier qu'elle se charge correctement et affiche tous les joueurs liés via `club_directory_child_links`

## Technical Tasks

- [x] Lire `aureak/apps/web/app/(admin)/children/[childId]/page.tsx` — section parents et club
- [x] Vérifier les champs disponibles : `parent1Nom`, `parent1Email`, `parent1Tel`, `parent2Nom`, `parent2Email`, `parent2Tel` dans le type `ChildDirectoryEntry`
- [x] Rendre le club actuel cliquable avec `Pressable` + `router.push` si `clubDirectoryId` présent — déjà implémenté (lignes 1524-1530 et header fiche)
- [x] Vérifier section parents — affichage avec fallback "—" via `InfoRow` (lignes 1784-1820)
- [x] Lire `aureak/apps/web/app/(admin)/clubs/[clubId]/page.tsx` — `listChildrenOfClub` correctement utilisé avec try/finally et console guard
- [x] Vérifier TypeScript — 0 erreur

## Files

- `aureak/apps/web/app/(admin)/children/[childId]/page.tsx` (modifier)
- `aureak/apps/web/app/(admin)/clubs/[clubId]/page.tsx` (vérifier / corriger si besoin)

## Dependencies

- `club_directory_child_links` table ✅ (migration 00045)
- `listChildrenOfClub` API ✅ (dans `@aureak/api-client`)
