// @aureak/business-logic — Logique métier pure

export { useAuthStore } from './stores/useAuthStore'
export { isAdmin, isCoach, isParent, isChild, hasRole } from './auth/roles'
export { filterByAudience } from './referentiel/filterByAudience'
export type { UserProfile } from './referentiel/filterByAudience'

export { SyncQueueService } from './sync/SyncQueueService'
export type { QueueOperation, LocalQueueItem, SyncDB, ApplyEventFn } from './sync/SyncQueueService'
export { useSyncStatus } from './sync/useSyncStatus'
export type { SyncStatus } from './sync/useSyncStatus'

export { BackgroundSyncService } from './sync/BackgroundSyncService'
export { useRecordEvaluation } from './sync/useRecordEvaluation'
export { useSessionValidation } from './sessions/useSessionValidation'
export { TICKET_SUBJECT_TEMPLATES } from './tickets/subject-templates'
export { useQuiz } from './learning/useQuiz'
export { computeRankings } from './admin/computeRankings'
export type { ImplantationStat, RankedStat } from './admin/computeRankings'

export { computeTeamLevelStars } from './admin/teamLevelStars'

export {
  generateGroupName,
  buildGroupBaseName,
  formatGroupTime,
  GROUP_METHODS,
  DAYS_OF_WEEK,
  GROUP_DURATIONS,
  AGE_CATEGORY_TO_METHOD,
  METHOD_COLOR,
} from './groups/generateGroupName'
export type { GroupMethod, DayOfWeek } from './groups/generateGroupName'

export {
  ACADEMY_STATUS_CONFIG,
  generateAcademyBadges,
  isActiveAcademician,
  hasAcademyHistory,
} from './groups/academyStatus'

export { computePlayerStats, computePlayerTier, computePlayerXP, computePlayerBadges } from './playerStats'
export type { PlayerStats } from './playerStats'

// Story 57-7 — Score de santé implantation
export { computeImplantationHealth } from './implantation-health'
