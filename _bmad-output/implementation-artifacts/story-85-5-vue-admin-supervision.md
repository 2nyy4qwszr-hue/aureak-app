# Story 85.5 : Vue admin supervision — filtres + suivi par commercial

Status: done

## Story

En tant qu'administrateur,
je veux une vue de supervision avec des filtres par commercial et par statut, et voir les clubs bloqués depuis longtemps,
afin de piloter la prospection sans être le point de passage de l'information.

## Context

L'admin accède à la même page `/developpement/prospection` que les commerciaux mais avec des capacités supplémentaires : filtres avancés, tri par date de dernier contact, highlight des situations bloquées.

## Dependencies

- Story 85.4 (fiche club + contacts)

## Acceptance Criteria

1. Quand `role === 'admin'`, la page prospection affiche des filtres supplémentaires :
   - Dropdown "Commercial" : filtre par commercial (tous / Serge / Mika / etc.)
   - Dropdown "Statut" : filtre par statut agrégé (tous / en cours / en attente / pas de suite / pas contacté)
2. Tri par défaut : clubs avec activité la plus récente en premier
3. Highlight visuel (bordure orange ou badge) sur les clubs "en attente" depuis > 14 jours
4. KPIs admin enrichis : total clubs | contactés | en cours | bloqués (> 14j) | jamais contactés
5. L'admin ne peut PAS ajouter de contact (pas de formulaire) — lecture seule
6. L'admin peut naviguer vers la fiche club et voir tous les contacts
7. Pas de régression pour le rôle commercial — les filtres avancés sont masqués pour eux

## Tasks / Subtasks

- [ ] T1 — Ajouter filtres dropdown (commercial, statut) conditionnels `role === 'admin'`
- [ ] T2 — Créer `_components/AdminFilters.tsx`
- [ ] T3 — Enrichir `ProspectionKPIs.tsx` avec le compteur "bloqués" pour admin
- [ ] T4 — Highlight clubs en attente > 14 jours (bordure `colors.status.warning` ou orange)
- [ ] T5 — Masquer le formulaire d'ajout de contact pour l'admin dans la fiche club
- [ ] T6 — QA : vérifier pas de régression commercial

## Files to Create / Modify

| Fichier | Action |
|---------|--------|
| `aureak/apps/web/app/(admin)/developpement/prospection/page.tsx` | Ajouter filtres admin conditionnels |
| `aureak/apps/web/app/(admin)/developpement/prospection/_components/AdminFilters.tsx` | Créer |
| `aureak/apps/web/app/(admin)/developpement/prospection/_components/ProspectionKPIs.tsx` | Enrichir KPIs admin |
| `aureak/apps/web/app/(admin)/developpement/prospection/[id]/page.tsx` | Masquer formulaire pour admin |

## Commit

`feat(epic-85): story 85.5 — vue admin supervision prospection + filtres + alertes`
