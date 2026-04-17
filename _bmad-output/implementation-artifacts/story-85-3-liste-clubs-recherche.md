# Story 85.3 : Liste clubs + recherche + badges statut

Status: done

## Story

En tant que commercial,
je veux voir la liste de tous les clubs avec un badge de statut commercial et une recherche instantanée,
afin de vérifier en 2 secondes si un club a déjà été contacté.

## Context

Remplace le placeholder prospection (Story 63.3) par la vraie liste clubs. Source : `club_directory` via `listClubDirectory()` existant + `listAllCommercialContacts()` (Story 85.1) pour calculer les statuts agrégés.

## Dependencies

- Story 85.1 (API commercial contacts)
- Story 85.2 (accès commercial au layout)

## Acceptance Criteria

1. La page `/developpement/prospection` affiche la liste des clubs depuis `club_directory`
2. Chaque club affiche un **badge statut** agrégé :
   - **Partenaire/Associé** (gold) — `club_relation_type` = `partenaire` ou `associe` → pas d'action
   - **En cours** (jaune) — au moins 1 contact avec statut `premier_contact`, `en_cours` ou `en_attente`
   - **Pas de suite** (rouge) — tous les contacts ont statut `pas_de_suite`
   - **Pas contacté** (gris) — aucun contact logué
3. Compteurs en haut : total clubs | contactés | en cours | jamais contactés
4. Recherche par nom de club — filtrage instantané côté client
5. Clubs partenaires/associés affichés mais grisés (pas cliquables ou marqués comme acquis)
6. Design conforme au DS Aureak : fond `colors.light.primary`, cards `colors.light.surface`, accent gold
7. Responsive mobile-first

## Tasks / Subtasks

- [ ] T1 — Créer `_components/ProspectionKPIs.tsx` — compteurs agrégés
- [ ] T2 — Créer `_components/ClubCard.tsx` — card club avec badge statut
- [ ] T3 — Créer `_components/ClubList.tsx` — liste + recherche + filtrage
- [ ] T4 — Remplacer le contenu de `developpement/prospection/page.tsx` par la vraie liste
- [ ] T5 — Charger `listClubDirectory()` + `listAllCommercialContacts()` et calculer statuts agrégés
- [ ] T6 — Style responsive mobile-first
- [ ] T7 — Vérifier try/finally + console guards

## Files to Create / Modify

| Fichier | Action |
|---------|--------|
| `aureak/apps/web/app/(admin)/developpement/prospection/page.tsx` | Remplacer placeholder |
| `aureak/apps/web/app/(admin)/developpement/prospection/_components/ProspectionKPIs.tsx` | Créer |
| `aureak/apps/web/app/(admin)/developpement/prospection/_components/ClubCard.tsx` | Créer |
| `aureak/apps/web/app/(admin)/developpement/prospection/_components/ClubList.tsx` | Créer |

## Commit

`feat(epic-85): story 85.3 — liste clubs + recherche + badges statut prospection`
