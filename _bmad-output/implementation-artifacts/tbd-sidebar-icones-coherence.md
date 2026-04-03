# Story: Cohérence icônes sidebar (active gold)

**ID:** tbd-sidebar-icones-coherence
**Status:** done
**Source:** new
**Epic:** TBD — UI Polish

## Description
Améliorer la cohérence de l'état actif de la sidebar admin. Les items actifs doivent avoir un style gold cohérent : bordure gauche gold, fond gold teinté, texte gold gras. Corriger la détection `isActive` pour les routes racines afin d'éviter les faux positifs (ex: `/` matchant tous les chemins).

## Acceptance Criteria
- [x] Items actifs : bordure gauche gold 3px, fond `colors.accent.gold + '18'`, texte `colors.accent.gold` fontWeight 600
- [x] Items inactifs : pas de fond, texte `colors.text.muted`
- [x] Hover : fond `colors.light.hover` avec transition smooth
- [x] Détection `isActive` corrigée pour éviter `/` matchant tout
- [x] Pattern cohérent sur tous les groupes nav

## Tasks
- [x] Lire `_layout.tsx` existant
- [x] Améliorer le style active state (bordure plus marquée, fond légèrement plus opaque)
- [x] Corriger la logique `isActive` pour les routes racines
- [x] Commit

## Commit
`fix(sidebar): cohérence icônes état actif gold`
