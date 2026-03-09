// @aureak/api-client — Point d'accès unique à Supabase
// RÈGLE : Ce package est le SEUL autorisé à importer @supabase/supabase-js

export { supabase } from './supabase'
export { signIn, signOut, getSession, inviteUser, disableUser } from './auth'

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
  createThemeGroup, listThemeGroups, updateThemeGroupOrder,
  createTheme, listThemes, getThemeByKey, createNewThemeVersion,
  createThemeSequence, listSequencesByTheme,
} from './referentiel/themes'
export type {
  CreateThemeGroupParams, CreateThemeParams, NewThemeVersionParams, CreateThemeSequenceParams,
} from './referentiel/themes'

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
  addOption, listOptionsByQuestion, deleteOption,
} from './referentiel/quiz'
export type { CreateQuestionParams, AddOptionParams } from './referentiel/quiz'

export {
  createSession,
  getSession as getSessionById,
  listSessionsByCoach, listUpcomingSessions,
  updateSession, cancelSession,
  assignCoach, listSessionCoaches,
  addSessionTheme, addSessionSituation, listSessionThemes, listSessionSituations,
} from './sessions/sessions'
export type { CreateSessionParams, UpdateSessionParams } from './sessions/sessions'

export {
  createImplantation, listImplantations, updateImplantation, deleteImplantation,
  createGroup, updateGroup, deleteGroup, listGroupsByImplantation,
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
  listSessionAttendees, prefillSessionAttendees,
  recordAttendance, listAttendancesBySession,
  confirmCoachPresence as confirmCoachPresenceDb, checkinBlock,
  listSessionsWithAttendance,
} from './sessions/attendances'
export type { RecordAttendanceParams, SessionAttendanceSummary } from './sessions/attendances'

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
  updateChildDirectoryEntry, softDeleteChildDirectoryEntry,
  listChildDirectoryHistory, addChildHistoryEntry, updateChildHistoryEntry, deleteChildHistoryEntry,
  listJoueurs,
} from './admin/child-directory'
export type {
  ListChildDirectoryOpts, UpdateChildDirectoryParams,
  AddChildHistoryParams, UpdateChildHistoryParams,
  JoueurListItem, ListJoueursOpts,
} from './admin/child-directory'

export {
  listClubDirectory, getClubDirectoryEntry,
  createClubDirectoryEntry, updateClubDirectoryEntry, softDeleteClubDirectoryEntry,
  listChildrenOfClub, listCurrentPlayersOfClub, listAffiliatedPlayersOfClub,
  linkChildToClubDirectory, unlinkChildFromClubDirectory,
  listCoachesOfClub, linkCoachToClubDirectory, unlinkCoachFromClubDirectory,
} from './admin/club-directory'
export type {
  ClubDirectoryFields, CreateClubDirectoryParams, UpdateClubDirectoryParams,
  ListClubDirectoryOpts, ClubChildLinkRow,
} from './admin/club-directory'

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
