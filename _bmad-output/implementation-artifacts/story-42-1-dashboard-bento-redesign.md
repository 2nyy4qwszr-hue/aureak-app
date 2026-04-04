# Story 42.1 : Dashboard admin — refonte bento visuel

Status: ready-for-dev

## Story

En tant qu'admin,
je veux un tableau de bord en layout bento avec des KPIs visuellement hiérarchisés,
afin d'avoir une vue d'ensemble attractive et lisible d'un coup d'œil.

## Acceptance Criteria

1. La page `/dashboard` utilise un layout bento grid CSS avec des cartes de tailles variées (large, medium, small)
2. Les KPIs prioritaires occupent les grandes cartes : nombre de joueurs actifs (large), taux de présence global (large), séances cette semaine (medium)
3. Les KPIs secondaires en cartes medium/small : absences coachs, anomalies critiques, stages à venir
4. Chaque KPI card affiche : chiffre principal en typographie large (48px+), label, tendance optionnelle (↑/↓ vs semaine précédente)
5. Les couleurs suivent les tokens : `colors.status.present` pour les bons taux, `colors.status.absent` pour les alertes, `colors.accent.gold` pour les valeurs clés
6. Le layout est responsive : bento 3 colonnes sur desktop → 2 colonnes tablette → 1 colonne mobile
7. Le skeleton loading existant est adapté au nouveau layout bento
8. Zéro couleur hardcodée — tokens uniquement

## Technical Tasks

- [ ] Lire `aureak/apps/web/app/(admin)/dashboard/page.tsx` entièrement
- [ ] Lire `_agents/design-references/desktop-admin-bento-v2.html` pour la référence visuelle
- [ ] Remplacer le layout KPI strip (6 colonnes égales) par un bento grid CSS avec `grid-template-areas`
- [ ] Cartes grandes : `joueurs-actifs` (span 2 cols) + `taux-presence` (span 2 cols)
- [ ] Cartes medium : `seances-semaine`, `absences-coachs`, `anomalies`
- [ ] Cartes small : `stages-a-venir`, `groupes-actifs`
- [ ] Adapter `DashboardSkeleton` au nouveau grid
- [ ] Vérifier TypeScript `npx tsc --noEmit`

## Files

- `aureak/apps/web/app/(admin)/dashboard/page.tsx` (modifier)

## Dependencies

Aucune — toutes les APIs `getDashboardKpiCounts` et `getImplantationStats` existent déjà.

## Notes

Référence design : `_agents/design-references/desktop-admin-bento-v2.html` — reproduire l'esprit bento avec les tokens Aureak Light Premium.
