# Story: Calendrier visuel des séances (mensuel/hebdomadaire)

**ID:** tbd-calendrier-seances
**Status:** done
**Source:** new
**Epic:** TBD — Séances UX

## Description
Créer une vue calendrier pour les séances.

## Résultat audit
La page `seances/page.tsx` (Story 19.4) dispose déjà d'un calendrier complet :
- `MonthView.tsx` : grille mensuelle avec dots colorés par type de session
- `WeekView.tsx` : vue semaine avec créneaux horaires
- `DayView.tsx` : vue journée détaillée
- `YearView.tsx` : vue annuelle avec tous les mois

Le calendrier charge les séances depuis l'API et les affiche avec des couleurs par type.
Les filtres groupe + implantation + statut sont déjà disponibles.

Aucun développement supplémentaire requis. Story validée comme déjà implémentée.

## Commit
`feat(seances): vue calendrier mensuel`
