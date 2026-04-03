# Story: Vue par implantation — dashboard analytique

**ID:** tbd-vue-implantation
**Status:** done
**Source:** new
**Epic:** TBD — Analytics

## Description
Créer une page `analytics/implantation/page.tsx` avec un dashboard par implantation.
Sélecteur d'implantation → KPIs (séances, présence, maîtrise) + liste des groupes.

## Changements effectués
- `analytics/implantation/page.tsx` : dashboard complet par implantation
  - Chargement via `listImplantations` + `getImplantationStats`
  - Chips de sélection d'implantation
  - KPI cards : séances totales, taux de clôture, taux présence, taux maîtrise
  - Section groupes de l'implantation via `listGroupsByImplantation`
  - Barre de progression colorée par taux
- `analytics/implantation/index.tsx` : re-export

## Acceptance Criteria
- [x] Sélecteur d'implantation
- [x] KPIs par implantation depuis `getImplantationStats`
- [x] Liste des groupes de l'implantation
- [x] Barres de progression pour les taux

## Commit
`feat(analytics): dashboard par implantation`
