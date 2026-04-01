// @aureak/api-client — Point d'accès unique à Supabase
// RÈGLE : Ce package est le SEUL autorisé à importer @supabase/supabase-js

export { supabase } from './supabase'
export { signIn, signOut, getSession, inviteUser, disableUser, getUserRoleFromProfile } from './auth'

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
  listStages, getStage, createStage, updateStage, softDeleteStage,
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
} from './sessions/sessions'
export type { CreateSessionParams, UpdateSessionParams, GenerateYearSessionsResult, SessionCalendarRow, CaptureNewChildParams, SessionRowAdmin } from './sessions/sessions'

export {
  createImplantation, listImplantations, updateImplantation, deleteImplantation,
  createGroup, createTransientGroup, updateGroup, deleteGroup, listGroupsByImplantation,
  getGroup, listAllGroups,
  addGroupMember, removeGroupMember, listGroupMembers, listGroupMembersWithProfiles,
  listGroupStaff, addGroupStaff, updateGroupStaffRole, removeGroupStaff,
  listAvailableCoaches, listAvailableChildren,
  listSessionsByGroup,
} from './sessions/implantations'
export type {
  CreateImplantationParams, CreateGroupParams, AddGroupStaffParams,
} from './sessions/implantations'
export {
  prefillSessionAttendees,
  recordAttendance, listAttendancesBySession,
  confirmCoachPresence as confirmCoachPresenceDb, checkinBlock,
  listSessionsWithAttendance, listPlayersWithAttendance,
  listSessionAttendeeRoster, batchResolveAttendeeNames,
} from './sessions/attendances'
export type { RecordAttendanceParams, SessionAttendanceSummary, PlayerAttendanceSummary, AttendeeRosterEntry } from './sessions/attendances'

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
  applyEvaluationEvent, listEvaluationsBySession, listMergedEvaluations,
  validateSession, closeSession,
} from './evaluations/evaluations'
export type { ApplyEvaluationParams, ApplyEvaluationResult, CloseSessionResult } from './evaluations/evaluations'

export { getChildProfile, getAttendanceSource } from './parent/childProfile'

export {
  createLearningAttempt, submitAnswer, stopAttempt, getPlayerProgress, getSessionLearningReport,
} from './learning/learning'
export type { CreateAttemptResult, SubmitAnswerResult } from './learning/learning'

export {
  getImplantationStats, getComparisonReport, listAnomalies, resolveAnomaly,
  sendAdminMessage, listAdminMessages,
} from './admin/supervision'
export type { ImplantationStats, AnomalyEvent } from './admin/supervision'

export {
  createTicket, replyToTicket, updateTicketStatus, listMyTickets, getTicketWithReplies,
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
  listMethodologySessions, getMethodologySession, createMethodologySession, updateMethodologySession, toggleMethodologySession,
  linkMethodologySessionTheme, unlinkMethodologySessionTheme, listMethodologySessionThemes,
  linkMethodologySessionSituation, unlinkMethodologySessionSituation, listMethodologySessionSituations,
} from './methodology'
export type {
  CreateMethodologyThemeParams,
  CreateMethodologySituationParams,
  CreateMethodologySessionParams,
} from './methodology'

// ── Résolution de profils (ARCH-1 : accès centralisé) ────────────────────────
export { getProfileDisplayName, resolveProfileDisplayNames } from './profiles'

// ── Admin — Dashboard KPI counts ─────────────────────────────────────────────
export { getDashboardKpiCounts } from './admin/dashboard'
export type { DashboardKpiCounts } from './admin/dashboard'

// ── Admin — Évaluations (vue admin) ──────────────────────────────────────────
export { listEvaluationsAdmin } from './admin/evaluations'
export type { AdminEvalRow } from './admin/evaluations'

// ── Admin — Coachs (liste paginée) ───────────────────────────────────────────
export { listCoaches } from './admin/coaches'
export type { CoachListRow } from './admin/coaches'

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

// ── Parent — Préférences et historique notifications ─────────────────────────
export { getNotificationPreferences, listNotificationLogs, saveNotificationPreferences } from './parent/notifications'
export type { NotificationPreferences, NotificationLog } from './parent/notifications'
