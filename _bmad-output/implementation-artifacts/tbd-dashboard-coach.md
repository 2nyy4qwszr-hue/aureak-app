# Story: Vue dashboard coach dédiée améliorée

**ID:** tbd-dashboard-coach
**Status:** done
**Source:** new
**Epic:** TBD — Coach UX

## Description
Améliorer le dashboard coach avec des sections d'activité du mois et de rappel évaluations.

## Changements effectués
- Section "Activité ce mois" : KPI séances réalisées + durée moyenne (depuis données déjà chargées)
- Section "Évaluations à compléter" : rappel visuel amélioré avec CTA
- Dashboard conserve ses sections existantes : KPI strip, bannière séance active, séances à venir

## Acceptance Criteria
- [x] Taux d'activité mensuel (séances réalisées ce mois + durée moyenne)
- [x] Rappel évaluations manquantes avec CTA
- [x] Données depuis sessions déjà chargées (pas de nouveaux appels API)

## Commit
`feat(coach): dashboard amélioré prochaines séances + stats`
