// Story 62.4 — Textes éducatifs Aureak pour HelpTooltip
// Tous les textes sont en français simple, compréhensibles par un parent non sportif.

export const HELP_TEXTS = {
  // ── Métriques joueur ─────────────────────────────────────────────────────
  attendance: 'Pourcentage de séances auxquelles le joueur a assisté sur les 30 derniers jours. Un taux de 80 % ou plus est excellent.',
  mastery   : 'Note moyenne attribuée par les coachs sur la maîtrise technique, de 1 (débutant) à 5 (expert). Calculée sur toutes les évaluations de la saison.',
  academyStatus: 'Statut du joueur dans l\'académie : Académicien = inscrit cette saison, Ancien = ex-joueur, Prospect = en évaluation pour rejoindre l\'académie.',

  // ── KPIs dashboard ───────────────────────────────────────────────────────
  activeKpi    : 'Nombre de joueurs ayant au moins une séance enregistrée au cours des 30 derniers jours.',
  sessionsKpi  : 'Nombre de séances terrain planifiées ou réalisées au cours du mois en cours.',
  attendanceKpi: 'Taux de présence moyen calculé sur toutes les séances réalisées ce mois-ci, tous groupes confondus.',
  masteryKpi   : 'Note de maîtrise moyenne de tous les joueurs actifs, issue des évaluations de la saison en cours.',
  coachesKpi   : 'Nombre de coachs actifs ayant dirigé au moins une séance ce mois-ci.',
  groupsKpi    : 'Nombre de groupes permanents actifs (hors groupes ponctuels automatiques).',
} as const

export type HelpTextKey = keyof typeof HELP_TEXTS
