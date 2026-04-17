# Story 85.4 : Fiche club + ajout/modification contact

Status: done

## Story

En tant que commercial,
je veux ouvrir la fiche d'un club, voir tous les contacts logués par tous les commerciaux, et ajouter mon propre contact en moins de 30 secondes,
afin de partager l'info en temps réel avec mes collègues.

## Context

Quand un commercial tape sur un club dans la liste (Story 85.3), il accède à la fiche détaillée. Cette fiche montre les infos du club + la liste de tous les contacts commerciaux existants + un formulaire d'ajout rapide.

## Dependencies

- Story 85.3 (liste clubs)

## Acceptance Criteria

1. Page `/developpement/prospection/[id]` affiche la fiche d'un club
2. En-tête : nom du club, ville, province, badge statut agrégé, badge partenaire/associé si applicable
3. Si partenaire/associé : mention "Club partenaire Aureak" — pas de formulaire d'ajout
4. Liste des contacts logués (tous commerciaux) triée par date décroissante :
   - Nom du contact au club
   - Rôle au club
   - Commercial Aureak (display name)
   - Date du contact
   - Statut (badge coloré)
   - Note
5. Formulaire "Ajouter un contact" (commerciaux uniquement, pas admin) :
   - Nom du contact (requis)
   - Rôle au club (optionnel)
   - Statut (sélecteur : premier contact / en cours / en attente / pas de suite)
   - Note (optionnel)
   - Date = automatique, commercial = automatique
6. Un commercial peut modifier ses propres contacts (statut + note) — pas ceux des autres
7. Pas de bouton supprimer
8. Après ajout, la liste se met à jour immédiatement (optimistic update)
9. try/finally sur le submit, console guards

## Tasks / Subtasks

- [ ] T1 — Créer route `developpement/prospection/[id]/page.tsx` + `[id]/index.tsx`
- [ ] T2 — Créer `_components/ClubDetail.tsx` — en-tête club + infos
- [ ] T3 — Créer `_components/ContactList.tsx` — liste contacts avec badges statut
- [ ] T4 — Créer `_components/ContactForm.tsx` — formulaire ajout (React Hook Form + Zod)
- [ ] T5 — Créer `_components/ContactEditInline.tsx` — modification inline statut/note (own contacts)
- [ ] T6 — Intégrer `createCommercialContact()` et `updateCommercialContact()` depuis api-client
- [ ] T7 — Optimistic update après ajout/modification
- [ ] T8 — QA : try/finally + console guards + responsive

## Files to Create / Modify

| Fichier | Action |
|---------|--------|
| `aureak/apps/web/app/(admin)/developpement/prospection/[id]/page.tsx` | Créer |
| `aureak/apps/web/app/(admin)/developpement/prospection/[id]/index.tsx` | Créer (re-export) |
| `aureak/apps/web/app/(admin)/developpement/prospection/_components/ClubDetail.tsx` | Créer |
| `aureak/apps/web/app/(admin)/developpement/prospection/_components/ContactList.tsx` | Créer |
| `aureak/apps/web/app/(admin)/developpement/prospection/_components/ContactForm.tsx` | Créer |
| `aureak/apps/web/app/(admin)/developpement/prospection/_components/ContactEditInline.tsx` | Créer |

## Commit

`feat(epic-85): story 85.4 — fiche club + ajout/modification contacts commerciaux`
