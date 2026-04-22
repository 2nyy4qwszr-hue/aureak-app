// @aureak/api-client — Point d'accès unique à Supabase
// RÈGLE : Ce package est le SEUL autorisé à importer @supabase/supabase-js

export { supabase } from './supabase'

// Story 57-1 — utilitaire compression image côté client (web only)
export { compressImage } from './utils/compress-image'

// Story 94.1 — Filtre AbortError Lock auth Supabase (faux-positifs React Strict Mode)
export { isAbortError } from './utils/is-abort-error'
export { signIn, signOut, getSession, inviteUser, disableUser, getUserRoleFromProfile } from './auth'

// Story 86-2 — Multi-rôle : table profile_roles
// Story 87-3 — listUserRolesHistory : historique accès onglet Accès fiche personne
export { listUserRoles, assignRoleToUser, revokeRoleFromUser, listUserRolesHistory } from './auth/profile-roles'
export type { UserRoleHistoryEntry } from './auth/profile-roles'

// Story 86-3 — Permissions granulaires : matrice section_permissions + overrides
// Story 87-3 — listUserOverridesHistory : timeline overrides onglet Accès
export {
  listDefaultPermissions,
  upsertDefaultPermission,
  listUserOverrides,
  upsertUserOverride,
  deleteUserOverride,
  getEffectivePermissions,
  listUserOverridesHistory,
} from './auth/section-permissions'
export type { UserSectionOverrideHistoryEntry } from './auth/section-permissions'

export {
  getChildAcademyStatus,
  listAcademySeasons,
  createAcademySeason,
  setCurrentSeason,
  listChildAcademyMemberships,
  addChildAcademyMembership,
  removeChildAcademyMembership,
  listChildStageParticipations,
  addChildStageParticipation,
  removeChildStageParticipation,
} from './academy/academyStatus'

export {
  listStages, listEvents, getStage, createStage, updateStage, softDeleteStage,
  listStageDays, createStageDay, updateStageDay, deleteStageDay,
  listStageBlocks, createStageBlock, updateStageBlock, deleteStageBlock,
  listStageBlockParticipants, addStageBlockParticipant, removeStageBlockParticipant,
} from './admin/stages'
export type {
  CreateStageParams, UpdateStageParams,
  CreateStageDayParams, CreateStageBlockParams, UpdateStageBlockParams,
} from './admin/stages'
export type { SignInParams, InviteUserParams } from './auth'

// Re-export des types Supabase — les autres packages ne doivent pas importer @supabase/supabase-js
export type { Session, User } from '@supabase/supabase-js'

export { createGrant, listActiveGrants, revokeGrant } from './access-grants'
export type { CreateGrantParams } from './access-grants'

export { createClub, listClubs, linkChildToClub, unlinkChildFromClub, updateClubAccessLevel } from './clubs'
export type { CreateClubParams, UpdateClubAccessLevelParams } from './clubs'

export {
  createThemeGroup, listThemeGroups, updateThemeGroupOrder, updateThemeGroup, deleteThemeGroup,
  createTheme, updateTheme, updateThemeOrder, updateThemePositionIndex, listThemes, getThemeByKey, createNewThemeVersion,
  createThemeSequence, listSequencesByTheme, updateThemeSequence, deleteThemeSequence,
} from './referentiel/themes'
export type {
  CreateThemeGroupParams, CreateThemeParams, UpdateThemeParams, NewThemeVersionParams, CreateThemeSequenceParams, UpdateThemeSequenceParams,
} from './referentiel/themes'

export {
  listMetaphorsByTheme, createThemeMetaphor, updateThemeMetaphor, deleteThemeMetaphor, linkMetaphorToSequence,
} from './referentiel/theme-metaphors'
export type { CreateThemeMetaphorParams, UpdateThemeMetaphorParams } from './referentiel/theme-metaphors'

export {
  createCriterion, listCriteriaBySequence,
  createFault, listFaultsByCriterion,
  createCue, listCuesByFault,
} from './referentiel/criteria'
export type { CreateCriterionParams, CreateFaultParams, CreateCueParams } from './referentiel/criteria'

export {
  createSituationGroup, listSituationGroups,
  createSituation, listSituations, getSituationByKey, createNewSituationVersion,
  createSituationCriterion, listSituationCriteria,
  linkSituationToTheme, unlinkSituationFromTheme, listThemeLinksForSituation,
  updateSituationGradeLevel,
} from './referentiel/situations'
export type {
  CreateSituationGroupParams, CreateSituationParams, NewSituationVersionParams, CreateSituationCriterionParams,
} from './referentiel/situations'

export {
  createTaxonomy, listTaxonomies, deleteTaxonomy,
  createTaxonomyNode, listNodesByTaxonomy, deleteTaxonomyNode,
  classifyUnit, unclassifyUnit, listClassificationsByUnit, listClassificationsByNode,
} from './referentiel/taxonomies'
export type { CreateTaxonomyParams, CreateTaxonomyNodeParams, CreateUnitClassificationParams } from './referentiel/taxonomies'

export {
  createQuestion, publishQuestion, unpublishQuestion,
  listPublishedByTheme, listAllByTheme,
  addOption, listOptionsByQuestion, listOptionsByQuestionIds, deleteOption,
} from './referentiel/quiz'
export type { CreateQuestionParams, AddOptionParams } from './referentiel/quiz'

export {
  createSession,
  getSession as getSessionById,
  listSessionsByCoach, listUpcomingSessions,
  updateSession, cancelSession,
  assignCoach, listSessionCoaches, removeCoach,
  addSessionTheme, addSessionSituation, listSessionThemes, listSessionSituations,
  // Story 13.1 — guest management + attendees (camelCase mapping)
  addGuestToSession, removeGuestFromSession,
  listSessionAttendees,
  // Story 13.2 — calendrier & auto-génération
  listSchoolCalendarExceptions, addSchoolCalendarException, removeSchoolCalendarException,
  computeContentRef, buildSessionSequence,
  generateYearSessions,
  postponeSession, cancelSessionWithShift,
  listSessionsCalendar,
  // Story 13.3 — clôture coach, notes par joueur, remplacements
  closeSessionCoach,
  captureNewChildDuringSession, saveCoachNote,
  reportCoachAbsence, acceptReplacement,
  getActiveSessionsForCoach,
  // Story 19.4 — vues admin enrichies
  listSessionsAdminView, batchResolveCoachNames,
  // ARCH-1 wrappers for useSessionValidation
  getSessionValidationStatus, subscribeToSessionValidation,
  // Story 50.3 — dashboard countdown tile
  listNextSessionForDashboard,
  // Story 51.2 — topbar séance active permanente
  getActiveSession,
  // Story 53-3 — intensité séance
  updateSessionIntensity,
  // Story 61.2 — séance active du jour pour le coach
  getActiveSessionForCoach,
  // Story 72.1 — Dashboard "Sessions du jour"
  listTodaySessionsForDashboard,
  // Story 93.4 — Next session hero rich
  listNextUpcomingSessionRich,
} from './sessions/sessions'
export type { CreateSessionParams, UpdateSessionParams, GenerateYearSessionsResult, SessionCalendarRow, CaptureNewChildParams, SessionRowAdmin, UpcomingSessionRow, TodaySessionRow, UpcomingSessionRich } from './sessions/sessions'
export type { ActiveSessionInfo } from '@aureak/types'

export {
  createImplantation, listImplantations, updateImplantation, deleteImplantation,
  uploadImplantationPhoto,
  createGroup, createTransientGroup, updateGroup, deleteGroup, listGroupsByImplantation,
  getGroup, listAllGroups,
  addGroupMember, removeGroupMember, listGroupMembers, listGroupMembersWithProfiles,
  listGroupMembersWithDetails,
  listGroupStaff, addGroupStaff, updateGroupStaffRole, removeGroupStaff, listGroupsByCoach,
  listAvailableCoaches, listAvailableChildren,
  listSessionsByGroup,
  // Story 56-2 — Formation tactique
  updateGroupFormation,
  // Story 56-3 — Groupes + membres sans N+1
  listGroupsWithMembers,
  // Story 56-4 — Transfert joueur entre groupes
  transferGroupMember,
  // Story 56-7 — Générateur groupes par âge
  generateGroupsBySeason,
  AGE_CATEGORY_RANGES,
  // Story 57-5 — Stats hover implantation
  getImplantationHoverStats,
  // Story 57-6 — Comparaison deux implantations
  compareImplantations,
  // Story 57-8 — Prochaines séances par implantation
  listUpcomingSessionsByImplantation,
} from './sessions/implantations'
export type {
  UpdateGroupParams,
  CreateImplantationParams, CreateGroupParams, AddGroupStaffParams, CoachGroupEntry,
  // Story 56-3
  GroupWithMembers,
} from './sessions/implantations'
export {
  prefillSessionAttendees,
  recordAttendance, listAttendancesBySession,
  confirmCoachPresence as confirmCoachPresenceDb, checkinBlock,
  listSessionsWithAttendance, listPlayersWithAttendance,
  listSessionAttendeeRoster, batchResolveAttendeeNames,
  listAttendanceStatsByGroup,
  getGroupMembersRecentStreaks,
  // Story 54-6 — Heatmap mensuelle
  listAttendancesByChild,
  // Story 54-7 — Alertes absence pattern
  checkAbsenceAlertTrigger,
  listActiveAbsenceAlerts,
} from './sessions/attendances'
export type { RecordAttendanceParams, SessionAttendanceSummary, PlayerAttendanceSummary, AttendeeRosterEntry, AttendanceStat, PlayerRecentStreak, AttendanceHistoryRow, AbsenceAlertRow } from './sessions/attendances'

export {
  generateRecurrenceSessions, cancelRecurrenceSeries, cancelSessionRpc, modifySingleException,
} from './sessions/recurrence'
export type { RecurrenceRule, GenerateRecurrenceParams } from './sessions/recurrence'

export {
  confirmCoachPresence, getCoachPresenceStatus, canCloseSession,
} from './sessions/presence'

export {
  upsertSessionNote, getSessionNote,
  submitContentFeedback, listFeedback, updateFeedbackStatus,
} from './sessions/notes'
export type { SubmitFeedbackParams } from './sessions/notes'

// Story 21.2 — Session Theme Blocks
export {
  listSessionThemeBlocks, addSessionThemeBlock, updateSessionThemeBlock, removeSessionThemeBlock,
} from './sessions/session-theme-blocks'
export type { AddSessionThemeBlockParams } from './sessions/session-theme-blocks'

// Story 21.3 — Session Workshops (Ateliers)
export {
  listSessionWorkshops, addSessionWorkshop, updateSessionWorkshop, removeSessionWorkshop,
  uploadWorkshopPdf, uploadWorkshopCard,
} from './sessions/session-workshops'
export type { AddSessionWorkshopParams, UpdateSessionWorkshopPatch } from './sessions/session-workshops'

export {
  applyAttendanceEvent, listSessionEvents,
} from './sessions/attendances'
export type { ApplyAttendanceEventParams, ApplyEventResult } from './sessions/attendances'

export {
  getAttendanceTimeline, restoreAttendance, markConflictsReviewed,
} from './sessions/timeline'
export type { TimelineEvent, AttendanceSnapshot, AttendanceTimeline } from './sessions/timeline'

// Story 32.2 — Dashboard Opérationnel Séances
export {
  listSessionCards, getSessionDetail,
  listAdminAlerts, resolveAlert,
  getCoachQualityMetrics, listChildConsecutiveAbsences,
  getTopGroupByAttendance,
} from './sessions/dashboard'
export type { SessionCardFilters, SessionDetailRow } from './sessions/dashboard'

// Story 33.1 — Dashboard Admin Présences
export {
  listSessionsWithPresence, getSessionAttendanceDetail,
  correctAttendance, updateCoachPresence,
  addTrialAttendance, listTrialConversionSuggestions, convertTrialToMember,
} from './sessions/presences'
export type {
  PresenceCardFilters, AttendeeWithStatus, CoachPresenceRow,
  SessionAttendanceDetail, TrialConversionSuggestion,
} from './sessions/presences'

// Story 33.2 — Workflow Coach Présences & Badges
export {
  getCoachSessionRoster, markAttendance, addTrialByCoach,
  listAvailableBadges, awardBadge, removeBadge,
  uploadSessionPhoto, listSessionPhotos,
  getChildSessionCard, listSessionBadgeAwards,
} from './sessions/coach-attendance'
export type {
  RosterChild, TrialChildData, ChildSessionCard,
} from './sessions/coach-attendance'

// Story 32.3 — Coach Séance du Jour + Signaux Techniques
export {
  getTodaySession, getAvailableTrainings, selectTrainingForSession,
  getChildSessionContext, createTechnicalSignal, resolveTechnicalSignal,
  getChildTechnicalProfile, listSessionSignals,
} from './sessions/coach-session'
export type {
  TodaySessionResult, TrainingWithCooldown,
  ChildSessionContext, CreateTechnicalSignalParams,
} from './sessions/coach-session'

export {
  applyEvaluationEvent, listEvaluationsBySession, listMergedEvaluations,
  validateSession, closeSession,
  // Story 55-3 — Croissance joueur
  listRecentEvaluationsForChild,
  // Story 55-2 — Moyennes axes radar
  getAverageEvaluationsByPlayer,
  // Story 55-4 — isPersonalBest
  listEvaluationsBySessionWithPB,
} from './evaluations/evaluations'
export type { ApplyEvaluationParams, ApplyEvaluationResult, CloseSessionResult } from './evaluations/evaluations'
export type { PlayerAxisAverage, EvalWithPersonalBest } from './evaluations/evaluations'

export { getChildProfile, getAttendanceSource } from './parent/childProfile'

export {
  createLearningAttempt, submitAnswer, stopAttempt, getPlayerProgress, getSessionLearningReport,
  listGroupQuizResults,
} from './learning/learning'
export type { CreateAttemptResult, SubmitAnswerResult, GroupQuizResult } from './learning/learning'

export {
  getImplantationStats, getComparisonReport, listAnomalies, resolveAnomaly,
  sendAdminMessage, listAdminMessages,
} from './admin/supervision'
export type { ImplantationStats, AnomalyEvent } from './admin/supervision'

export {
  createTicket, replyToTicket, updateTicketStatus, listMyTickets, getTicketWithReplies,
  listAllTickets, getTicketById, listTicketReplies, softDeleteTicket,
} from './parent/tickets'
export type { CreateTicketParams, TicketCategory, TicketStatus, Ticket, TicketReply } from './parent/tickets'

export {
  suspendUser, reactivateUser, requestUserDeletion, listLifecycleEvents,
} from './admin/lifecycle'

export {
  listConsentsByChild, revokeConsent, grantConsent,
} from './parent/consents'
export type { ConsentType, Consent } from './parent/consents'

export {
  submitGdprRequest, listMyGdprRequests, listAllGdprRequests, processGdprRequest,
} from './parent/gdpr'
export type { GdprRequestType, GdprRequestStatus, GdprRequest } from './parent/gdpr'

export { listAuditLogs } from './admin/audit'
export type { AuditLog, AuditFilters } from './admin/audit'

export {
  createExportJob, listExportJobs, triggerExport,
} from './admin/exports'
export type { ExportType, ExportStatus, ExportJob, CreateExportJobParams } from './admin/exports'

export {
  awardCoachGrade, listCoachGradeHistory, getCoachCurrentGrade,
} from './admin/grades'
export type { CoachGradeLevel, CoachGrade } from './admin/grades'

export {
  listThemesWithGrades, listSituationsWithGrades,
  updateThemeGradeLevel,
} from './admin/grade-permissions'
export type { GradeContentItem } from './admin/grade-permissions'

export {
  createProfileFiche, inviteProfileUser,
} from './admin/profiles'
export type { CreateProfileFicheParams, InviteProfileUserParams, ProfileRole } from './admin/profiles'

export {
  listUsers, getUserProfile,
} from './admin/users'
export type { UserRow, ListUsersOpts } from './admin/users'

export {
  getAdminPlayerProfile, getPlayerAttendanceHistory,
} from './admin/playerProfile'
export type { AdminPlayerProfile, PlayerAttendanceRecord } from './admin/playerProfile'

export {
  listAvatarItems, getPlayerAvatar, listUnlockedItems, equipAvatarItem,
} from './gamification/avatar'
export type { AvatarSlot, AvatarItem, PlayerAvatar, UnlockedItem } from './gamification/avatar'

export {
  getChildThemeProgression, getSkillCardCollection,
} from './gamification/progression'
export type { MasteryStatus, ThemeProgressEntry, SkillCardCollectionEntry } from './gamification/progression'

export {
  listActiveQuests, listAllQuests,
} from './gamification/quests'
export type { QuestStatus, PlayerQuest } from './gamification/quests'

// Story 59-1 + 59-3 — XP étendu + leaderboard
export {
  awardXp, getXpLedger, getXpProgression, getXPLeaderboard, XP_RATES,
} from './gamification/xp'

// Story 59-4 — Badges définitions
// Story 59-9 — getAchievementDetails (fetch joueur+badge pour toast Realtime)
export {
  listBadgeDefinitions, listPlayerBadges, getAchievementDetails,
} from './gamification/badges'
export type { AchievementToastData } from './gamification/badges'

// Story 59-5 — Quêtes coaches
export {
  getCoachWeeklyQuests, assignCoachWeeklyQuests, updateCoachQuestProgress,
} from './gamification/coach-quests'

// Story 59-6 — Score académie global KPI
export { getAcademyScore } from './gamification/academy-score'
export type { AcademyScoreResult } from './gamification/academy-score'

// Story 59-7 — Milestones académie
export {
  getUncelebratedMilestones, checkAcademyMilestones, markMilestoneCelebrated,
} from './gamification/milestones'
export type { AcademyMilestone } from './gamification/milestones'

// Story 59-8 — Profil admin gamifié
export {
  getAdminProfile, getAdminActivityStats,
} from './gamification/admin-profile'
export type { AdminProfile, AdminActivityStats } from './gamification/admin-profile'

// Story 59-10 — Trophée de saison
export { getSeasonTrophyData } from './gamification/season-trophy'
export type { SeasonTrophyData } from './gamification/season-trophy'

export {
  listPartnerships, createPartnership, updatePartnership, listPartnerAccessStats,
} from './admin/partnerships'
export type { PartnershipAccessLevel, ClubPartnership, CreatePartnershipParams } from './admin/partnerships'

export {
  listHistoryByChild, listAffiliatedChildrenByClub,
  addHistoryEntry, updateHistoryEntry, deleteHistoryEntry,
} from './child-club-history'
export type { AddHistoryEntryParams, UpdateHistoryEntryParams } from './child-club-history'

export {
  listChildDirectory, getChildDirectoryEntry,
  createChildDirectoryEntry,
  updateChildDirectoryEntry, softDeleteChildDirectoryEntry,
  listChildDirectoryHistory, addChildHistoryEntry, updateChildHistoryEntry, deleteChildHistoryEntry,
  listJoueurs,
  // Story 18.2 — gestion photos joueurs
  listChildPhotos, addChildPhoto, setCurrentPhoto, deleteChildPhoto,
  // Story 42.3 — compteur joueurs actifs saison courante
  countActivePlayersCurrentSeason,
  // Story 49-3 — joueurs via annuaire (liaison implicite club_directory_id)
  listChildrenByClubDirectoryId,
  // Story 49-7 — club calculé depuis l'historique football (vue v_child_current_club)
  getChildCurrentClubFromHistory,
  // Story 89.1 — recherche annuaire + détection doublons prospects
  searchChildDirectoryByName,
  findProspectDuplicates,
} from './admin/child-directory'
export type {
  ListChildDirectoryOpts, UpdateChildDirectoryParams,
  CreateChildDirectoryParams,
  AddChildHistoryParams, UpdateChildHistoryParams,
  JoueurListItem, ListJoueursOpts,
  // Story 18.2
  AddChildPhotoParams,
} from './admin/child-directory'

export {
  listChildInjuries, addChildInjury, deleteChildInjury,
} from './admin/injuries'
export type { AddInjuryParams } from './admin/injuries'

// Story 89.4 — Invitations séance gratuite (prospection)
export {
  listProspectInvitations, sendTrialInvitation,
} from './admin/prospect-invitations'
export type { SendTrialInvitationParams, SendTrialInvitationResult } from './admin/prospect-invitations'

// Story 89.5 — Liste d'attente intelligente + notification absence
export {
  listWaitlist, listWaitlistByChild,
  addToWaitlist, removeFromWaitlist,
  confirmTrialSlot,
} from './admin/trial-waitlist'
export type {
  ListWaitlistParams, AddToWaitlistParams, ConfirmTrialSlotResult,
} from './admin/trial-waitlist'

// Story 89.6 — Séance gratuite usage unique traçable
export {
  recordTrialOutcome, resetTrialRight, getProspectFunnelStats,
} from './admin/trial-usage'
export type {
  RecordTrialOutcomeParams, ProspectFunnelStats,
} from './admin/trial-usage'

// Story 89.2 — Évaluations scout sur prospects gardiens
export {
  listScoutEvaluationsByChild,
  getScoutEvaluationStats,
  createScoutEvaluation,
  updateScoutEvaluation,
  deleteScoutEvaluation,
} from './admin/prospect-scout-evaluations'
export type {
  CreateScoutEvaluationParams, UpdateScoutEvaluationParams,
} from './admin/prospect-scout-evaluations'

// Story 89.3 — Visibilité conditionnelle RGPD coordonnées parent prospects
export {
  getChildDirectoryRgpd,
  listChildDirectoryRgpd,
  requestRgpdAccess,
  listRgpdAccessRequests,
  resolveRgpdAccessRequest,
  hasPendingRgpdRequest,
  listRgpdGrants,
  revokeRgpdGrant,
  listRgpdAccessLog,
} from './admin/prospect-rgpd'
export type {
  CreateAccessRequestParams, ListAccessRequestsOpts,
} from './admin/prospect-rgpd'

export {
  listClubDirectory, getClubDirectoryEntry,
  createClubDirectoryEntry, updateClubDirectoryEntry, softDeleteClubDirectoryEntry,
  listChildrenOfClub, listCurrentPlayersOfClub, listAffiliatedPlayersOfClub,
  linkChildToClubDirectory, unlinkChildFromClubDirectory,
  listCoachesOfClub, linkCoachToClubDirectory, unlinkCoachFromClubDirectory,
  uploadClubLogo, deleteClubLogo, getClubLogoSignedUrl,
} from './admin/club-directory'
export type {
  ClubDirectoryFields, CreateClubDirectoryParams, UpdateClubDirectoryParams,
  ListClubDirectoryOpts, ClubChildLinkRow,
} from './admin/club-directory'

// ── Theme Dossier Pédagogique (migration 00056) ───────────────────────────────
export {
  getThemeVision, upsertThemeVision,
  getThemePageTerrain, upsertThemePageTerrain,
  setSequenceCriteria, getSequenceCriteria,
  listThemeMiniExercises, createThemeMiniExercise, updateThemeMiniExercise, deleteThemeMiniExercise,
  listThemeHomeExercises, createThemeHomeExercise, updateThemeHomeExercise, deleteThemeHomeExercise,
  setHomeExerciseCriteria,
  listThemeVideoEvalTemplates, createThemeVideoEvalTemplate, updateThemeVideoEvalTemplate, deleteThemeVideoEvalTemplate,
  setVideoEvalTemplateCriteria,
  listThemeBadgeLevels, createThemeBadgeLevel, updateThemeBadgeLevel, deleteThemeBadgeLevel,
  listThemeResources, createThemeResource, updateThemeResource, deleteThemeResource,
  listThemeAgeDifferentiation, upsertThemeAgeDifferentiation,
  updateCriterionExtended, updateFaultExtended,
  deleteCriterionById, deleteFaultById,
  listCriteriaByTheme, listFaultsByCriterionExtended,
  listFaultsByCriteriaIds, listCriteriaLinksBySequenceIds,
  listFaultsByTheme,
} from './referentiel/theme-dossier'

// ── Story 51.3 — Recherche unifiée Command Palette ────────────────────────────
export { searchUnified } from './admin/search'
export type { UnifiedSearchResult, SearchPlayerResult, SearchClubResult, SearchSessionResult } from './admin/search'

// ── RBFA enrichissement clubs (migration 00081/00082) — Story 28-1 ───────────
export { searchRbfaClubs }                    from './admin/rbfa-search'
export type { RbfaRawClub }                   from './admin/rbfa-search'
export { parseRbfaClub, parseRbfaClubs }      from './admin/rbfa-parser'
export { scoreCandidate, findBestMatch }      from './admin/club-matching'
export type { ClubToMatch }                   from './admin/club-matching'
export { importRbfaLogo }                     from './admin/club-logo-import'
export type { LogoImportResult }              from './admin/club-logo-import'
export { syncMissingClubLogos, resetAllClubsForSync, getClubRbfaStats } from './admin/rbfa-sync'
export type { RbfaStats } from './admin/rbfa-sync'
export {
  listPendingMatchReviews,
  confirmMatchReview,
  rejectMatchReview,
}                                             from './admin/club-match-reviews'

// ── Méthodologie pédagogique (migration 00050) ────────────────────────────────
export {
  listMethodologyThemes, getMethodologyTheme, createMethodologyTheme, updateMethodologyTheme, toggleMethodologyTheme,
  listMethodologySituations, getMethodologySituation, createMethodologySituation, updateMethodologySituation, toggleMethodologySituation,
  listMethodologySessions, getMethodologySession, createMethodologySession, updateMethodologySession, toggleMethodologySession, softDeleteMethodologySession,
  linkMethodologySessionTheme, unlinkMethodologySessionTheme, listMethodologySessionThemes,
  linkMethodologySessionSituation, unlinkMethodologySessionSituation, listMethodologySessionSituations,
  addSituationToSession,
  getThemeOfWeek,
  getRecommendedSituations,
  listSessionModules,
  upsertSessionModule,
  addSituationToModule,
  removeSituationFromModule,
  listMethodologyExercises,
  listMethodologyProgrammes,
  createMethodologyProgramme,
  getMethodologyProgramme,
  updateMethodologyProgramme,
  softDeleteMethodologyProgramme,
  addProgrammeSession,
  removeProgrammeSession,
  updateProgrammeSessionDate,
  updateProgrammeSessionPosition,
  duplicateMethodologyProgramme,
} from './methodology'
export type {
  CreateMethodologyThemeParams,
  CreateMethodologySituationParams,
  CreateMethodologySessionParams,
  CreateMethodologyProgrammeParams,
  MethodologyModule,
} from './methodology'

// ── Résolution de profils (ARCH-1 : accès centralisé) ────────────────────────
export { getProfileDisplayName, resolveProfileDisplayNames } from './profiles'

// ── Admin — Dashboard KPI counts + Activity Feed (Story 50.5) + Streaks (Story 50.6) + Nav Badges (Story 51.4) ──
export { getDashboardKpiCounts, fetchActivityFeed, getTopStreakPlayers, getNavBadgeCounts, getPlayerOfWeek } from './admin/dashboard'
export type { DashboardKpiCounts, ActivityEventItem, ActivityEventType, StreakPlayer, NavBadgeCounts } from './admin/dashboard'

// ── Admin — Évaluations (vue admin) ──────────────────────────────────────────
export { listEvaluationsAdmin, getCoachEvaluationBias, listDangerousPlayers } from './admin/evaluations'
export type { AdminEvalRow, BiasPeriod } from './admin/evaluations'

// ── Admin — Coachs (liste paginée + stats activité) ──────────────────────────
export { listCoaches, getCoachSessionStats, listCoachRecentSessions, detectInactiveCoaches } from './admin/coaches'
export type { CoachListRow, CoachSessionStats, CoachRecentSession, InactiveCoach } from './admin/coaches'

// ── Admin — Notifications Edge Function ──────────────────────────────────────
export { sendGradeNotification } from './admin/notifications'
export type { SendGradeNotificationParams } from './admin/notifications'

// ── Parent — Enfants liés à un parent ────────────────────────────────────────
export { listChildrenOfParent } from './parent/parentChildren'
export type { ParentChildLink } from './parent/parentChildren'

// ── Club — Données dashboard + fiche gardien ─────────────────────────────────
export {
  getClubByUserId,
  listChildIdsForClub,
  listAttendancesForChildren,
  listEvaluationsForChildren,
  listAttendeeSessionsForChildren,
  listUpcomingSessionsForIds,
} from './club/clubData'
export type {
  ClubRow,
  ClubAttendanceRow,
  ClubEvalRow,
  ClubUpcomingSession,
} from './club/clubData'

export { getGoalkeeperDetail } from './club/goalkeeperDetail'
export type {
  GoalkeeperDetail,
  GoalkeeperDetailAtt,
  GoalkeeperDetailEval,
} from './club/goalkeeperDetail'

// ── Sessions — IDs présents + séances évaluées ───────────────────────────────
export { listPresentChildIdsForSession } from './sessions/attendances'
export { listEvaluatedSessionIds } from './evaluations/evaluations'

// ── Sessions — Notes par joueur (ARCH-1) ─────────────────────────────────────
export { listSessionAttendeesWithNotes } from './sessions/sessionNotes'
export type { SessionAttendeeWithNote } from './sessions/sessionNotes'

// ── Child — Dashboard extra (prochaine séance + dernière éval) ───────────────
export { getChildDashboardExtra } from './child/childDashboard'
export type { ChildDashboardExtra, ChildNextSession, ChildLastEval } from './child/childDashboard'

// ── Child — Quiz QCM post-séance (Story 75.6) ────────────────────────────────
export { getLastSessionQuiz } from './child/childQuiz'
export type { ChildQuizData } from './child/childQuiz'

// ── Child — Quiz QCM session explicite (Story 75.7) ──────────────────────────
export { getSessionQuiz } from './child/childQuiz'

// ── Parent — Préférences et historique notifications ─────────────────────────
export { getNotificationPreferences, listNotificationLogs, saveNotificationPreferences } from './parent/notifications'
export type { NotificationPreferences, NotificationLog } from './parent/notifications'

// Story 33.3 — Vue Parent : Présences Heatmap & Badges
export {
  submitAbsenceJustification, getAbsenceJustification,
  getChildAttendanceHeatmap, computeAttendanceStats,
  getChildBadgeHistory, getSessionPhoto,
} from './parent/attendance-heatmap'
export type {
  AttendanceStats, SessionPhotoPublic,
} from './parent/attendance-heatmap'

// Story tbd-notifs-inapp — Notifications in-app
export {
  listInAppNotifications, markNotificationRead, markAllNotificationsRead, countUnreadNotifications,
} from './notifications'
export type { InAppNotification } from './notifications'

// ── Analytics (Epic 60) ───────────────────────────────────────────────────────
export {
  getStatsRoomKpis,
  getAttendanceByGroupMonth,
  getSessionHeatmap,
  getImplantationRankings,
  getPlayerRankings,
  getMonthlyReportData,
} from './analytics'
export type { StatsRoomKpis } from './analytics'

// Story 60.8 — Live counters Realtime
export { useLiveSessionCounts } from './realtime/liveSessionCounts'
export type { LiveSessionCounts } from './realtime/liveSessionCounts'

// Story 61.5 — Offline mode : cache + queue
export {
  setCacheItem, getCacheItem, invalidateCache, getCacheTimestamp, isCacheStale, CACHE_KEYS,
  enqueueAction, getQueue, dequeueAction, processQueue,
  useOfflineCache,
} from './offline'
export type { OfflineQueueItem } from './offline'

// ── Epic 85 — Registre Commercial Clubs ─────────────────────────────────────
export {
  listCommercialContactsByClub,
  listAllCommercialContacts,
  createCommercialContact,
  updateCommercialContact,
} from './admin/commercial-contacts'

// ── Epic 88 — Story 88.5 : Ressources commerciales ──────────────────────────
export {
  listCommercialResources,
  updateCommercialResource,
  uploadCommercialResourceFile,
  getResourceDownloadUrl,
} from './admin/commercial-resources'

// ── Epic 91 — Story 91.2 : Médiathèque ──────────────────────────────────────
export {
  listMediaItems,
  uploadMediaItem,
  approveMediaItem,
  rejectMediaItem,
  softDeleteMediaItem,
  getMediaItemUrl,
} from './admin/media-items'
export type { ListMediaItemsFilters } from './admin/media-items'

// ── Epic 88 — Pipeline CRM Clubs Prospects (Story 88-2) ──────────────────────
export {
  listClubProspects,
  getClubProspect,
  createClubProspect,
  updateClubProspect,
  updateClubProspectStatusById,
  addProspectContact,
  updateProspectContact,
  deleteProspectContact,
  getProspectPipelineStats,
  listProspectActions,
  addProspectAction,
  listMyActions,
  listAttributionRules,
  createAttributionRule,
  updateAttributionRule,
  deleteAttributionRule,
  suggestAttribution,
  saveAttributionResult,
} from './admin/prospection'
export type {
  ListClubProspectsFilters,
  ProspectPipelineStats,
  ListMyActionsFilters,
} from './admin/prospection'

// ── Epic 90 — Story 90.1 : Pipeline prospection entraîneurs ─────────────────
export {
  listCoachProspects,
  getCoachProspect,
  createCoachProspect,
  updateCoachProspect,
  updateCoachProspectStatus,
} from './admin/coach-prospection'
export type { ListCoachProspectsFilters } from './admin/coach-prospection'

// ── Story 87.4 — Invitation dédiée commercial/manager/marketeur ──────────────
export { invitePerson } from './admin/invite-person'
export type { InvitePersonParams, InvitePersonResult, InvitePersonMode, InvitePersonRole } from './admin/invite-person'

// ── Story 87.1 — Profils Académie par rôle (commercial | manager | marketeur) ─
// ── Story 87.2 — countManagerOverrides (fiche universelle module accès) ──────
export {
  listProfilesByRole,
  countManagersWithOverrides,
  countManagerOverrides,
  countActiveCommercialPipeline,
  countMonthlyClosedWon,
} from './admin/profiles-by-role'
export type {
  ProfileListRow, ProfileRoleFilter, ListProfilesByRoleOpts,
} from './admin/profiles-by-role'

// ── Story 93.2 — Compteurs par hub (Activités, Méthodologie, Académie) ───────
export {
  getActivitesCounts,
  getMethodologieCounts,
  getAcademieCounts,
} from './admin/hub-counts'
export type {
  ActivitesCounts, MethodologieCounts, AcademieCounts,
} from './admin/hub-counts'

