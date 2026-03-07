// @aureak/types — Entités de base (fondation Story 1.2)
// Convention : camelCase en TypeScript, snake_case uniquement en DB
// Transformation snake_case → camelCase : uniquement dans @aureak/api-client/src/transforms.ts

import type { UserRole, AttendanceStatus, NotificationChannel } from './enums'

/** Tenant — unité d'isolation multi-tenant */
export type Tenant = {
  id: string
  name: string
  createdAt: string  // ISO 8601
}

/** AuditLog — entrée immuable de la table audit_logs (append-only) */
export type AuditLog = {
  id: string
  tenantId: string
  userId: string | null   // null si action système / cron
  entityType: string      // 'user', 'session', 'consent', etc.
  entityId: string | null // null si entité non identifiable
  action: string          // 'user_suspended', 'consent_revoked', etc.
  metadata: Record<string, unknown>
  createdAt: string       // ISO 8601
}

/** ProcessedOperation — idempotency de la sync offline */
export type ProcessedOperation = {
  operationId: string
  processedAt: string  // ISO 8601
  tenantId: string
}

/** Club — compte utilisateur d'un club partenaire (Story 2.5) */
export type Club = {
  userId          : string
  tenantId        : string
  name            : string
  clubAccessLevel : 'partner' | 'common'
  deletedAt       : string | null
  createdAt       : string
}

/** ClubChildLink — liaison enfant <-> club (pas de soft-delete — table de liaison pure) */
export type ClubChildLink = {
  clubId   : string
  childId  : string
  createdAt: string
}

/** CoachAccessGrant — accès temporaire cross-implantation (Story 2.3) */
export type CoachAccessGrant = {
  id            : string
  tenantId      : string
  coachId       : string
  implantationId: string
  grantedBy     : string
  expiresAt     : string       // ISO 8601
  revokedAt     : string | null // null = actif, non-null = révoqué
  createdAt     : string
}

// Re-export UserRole pour usage dans les entités suivantes (Stories 2.x+)
export type { UserRole }

// ============================================================
// Story 3.1 — Référentiel Pédagogique : ThemeGroup, Theme, ThemeSequence
// ============================================================

export type ThemeLevel = 'debutant' | 'intermediaire' | 'avance'
export type AgeGroup   = 'U5' | 'U8' | 'U11' | 'Senior'

/** ThemeGroup — catégorie de haut niveau du référentiel pédagogique */
export type ThemeGroup = {
  id        : string
  tenantId  : string
  name      : string
  sortOrder : number | null
  deletedAt : string | null
  createdAt : string
}

/** Theme — thème pédagogique versionné (slug invariant = theme_key) */
export type Theme = {
  id             : string
  tenantId       : string
  groupId        : string | null
  themeKey       : string                       // slug invariant ex: 'sortie-au-sol'
  name           : string
  description    : string | null
  level          : ThemeLevel | null
  ageGroup       : AgeGroup | null
  targetAudience : Record<string, unknown>      // enrichi en Story 3.6
  version        : number
  isCurrent      : boolean
  deletedAt      : string | null
  createdAt      : string
}

/** ThemeSequence — séquence pédagogique d'un thème (liée à une version immuable) */
export type ThemeSequence = {
  id          : string
  themeId     : string
  tenantId    : string
  name        : string
  description : string | null
  sortOrder   : number | null
  createdAt   : string
}

// ============================================================
// Story 3.2 — Référentiel Pédagogique : Criterion, Fault, Cue
// ============================================================

/** Criterion — critère de réussite d'une séquence pédagogique */
export type Criterion = {
  id          : string
  sequenceId  : string
  tenantId    : string
  label       : string
  description : string | null
  sortOrder   : number | null
  createdAt   : string
}

/** Fault — faute associée à un critère */
export type Fault = {
  id          : string
  criterionId : string
  tenantId    : string
  label       : string
  description : string | null
  sortOrder   : number | null
  createdAt   : string
}

/** Cue — cue de correction coaching associé à une faute */
export type Cue = {
  id          : string
  faultId     : string
  tenantId    : string
  label       : string
  description : string | null
  sortOrder   : number | null
  createdAt   : string
}

// ============================================================
// Story 3.3 — Référentiel Situationnel : SituationGroup, Situation, SituationCriterion, SituationThemeLink
// ============================================================

/** SituationGroup — catégorie de haut niveau du référentiel situationnel */
export type SituationGroup = {
  id        : string
  tenantId  : string
  name      : string
  sortOrder : number | null
  deletedAt : string | null
  createdAt : string
}

/** Situation — situation de match versionnée (slug invariant = situation_key) */
export type Situation = {
  id             : string
  tenantId       : string
  groupId        : string | null
  situationKey   : string                       // slug invariant
  name           : string
  description    : string | null
  variables      : Record<string, unknown> | null
  targetAudience : Record<string, unknown>
  version        : number
  isCurrent      : boolean
  deletedAt      : string | null
  createdAt      : string
}

/** SituationCriterion — critère d'analyse d'une situation */
export type SituationCriterion = {
  id          : string
  situationId : string
  tenantId    : string
  label       : string
  sortOrder   : number | null
  createdAt   : string
}

/** SituationThemeLink — lien N:M situation ↔ thème */
export type SituationThemeLink = {
  situationId : string
  themeId     : string
  tenantId    : string
}

// ============================================================
// Story 3.4 — Système de Taxonomies Génériques
// ============================================================

export type UnitType = 'theme' | 'situation'

/** Taxonomy — axe de classification pédagogique (ex: Méthode GK, Situationnel) */
export type Taxonomy = {
  id        : string
  tenantId  : string
  name      : string
  slug      : string
  deletedAt : string | null
  createdAt : string
}

/** TaxonomyNode — nœud dans l'arbre d'une taxonomie (auto-référentiel) */
export type TaxonomyNode = {
  id         : string
  taxonomyId : string
  tenantId   : string
  parentId   : string | null
  name       : string
  slug       : string
  sortOrder  : number | null
}

/** UnitClassification — classification d'un thème ou situation dans un nœud de taxonomie */
export type UnitClassification = {
  id             : string
  taxonomyNodeId : string
  tenantId       : string
  unitType       : UnitType
  unitId         : string
}

// ============================================================
// Story 3.5 — Questions de Quiz (Workflow Draft/Published)
// ============================================================

export type QuizStatus = 'draft' | 'published'

/** QuizQuestion — question de quiz associée à un thème */
export type QuizQuestion = {
  id           : string
  themeId      : string
  tenantId     : string
  questionText : string
  explanation  : string | null
  status       : QuizStatus
  sortOrder    : number | null
  deletedAt    : string | null
  createdAt    : string
}

/** QuizOption — option de réponse pour une question de quiz */
export type QuizOption = {
  id         : string
  questionId : string
  optionText : string
  isCorrect  : boolean
  sortOrder  : number | null
}

// ============================================================
// Story 3.6 — Ciblage d'Audience & Filtrage Dynamique
// ============================================================

/** TargetAudience — audience cible structurée pour thèmes et situations */
export type TargetAudience = {
  roles?     : string[]
  age_groups?: string[]
  programs?  : string[]
}

// ============================================================
// Story 4.1 — Modèle de Données : Sessions, Blocs & Récurrence
// ============================================================

export type SessionStatus = 'planifiée' | 'en_cours' | 'terminée' | 'annulée'
export type CoachRole     = 'lead' | 'assistant'

/** Implantation — site physique où se déroulent les séances */
export type Implantation = {
  id        : string
  tenantId  : string
  name      : string
  address   : string | null
  gpsLat    : number | null
  gpsLon    : number | null
  gpsRadius : number
  deletedAt : string | null
  createdAt : string
}

/** Group — groupe d'enfants dans une implantation */
export type Group = {
  id             : string
  tenantId       : string
  implantationId : string
  name           : string
  ageGroup       : AgeGroup | null
  deletedAt      : string | null
  createdAt      : string
}

/** GroupMember — appartenance d'un enfant à un groupe */
export type GroupMember = {
  groupId  : string
  childId  : string
  tenantId : string
  joinedAt : string
}

/** SessionBlock — bloc de séances d'une journée */
export type SessionBlock = {
  id             : string
  tenantId       : string
  implantationId : string
  date           : string
  label          : string | null
  createdAt      : string
}

/** RecurrenceSeries — série récurrente de séances */
export type RecurrenceSeries = {
  id        : string
  tenantId  : string
  rule      : Record<string, unknown>
  createdAt : string
}

/** Session — séance planifiée */
export type Session = {
  id                    : string
  tenantId              : string
  implantationId        : string
  groupId               : string
  sessionBlockId        : string | null
  recurrenceId          : string | null
  isException           : boolean
  originalSessionId     : string | null
  scheduledAt           : string
  durationMinutes       : number
  location              : string | null
  status                : SessionStatus
  attendanceStartedAt   : string | null
  attendanceCompletedAt : string | null
  cancelledAt           : string | null
  cancellationReason    : string | null
  deletedAt             : string | null
  createdAt             : string
}

/** SessionCoach — coach assigné à une séance */
export type SessionCoach = {
  sessionId : string
  coachId   : string
  tenantId  : string
  role      : CoachRole
  createdAt : string
}

/** SessionTheme — thème pédagogique associé à une séance (snapshot) */
export type SessionTheme = {
  sessionId : string
  themeId   : string
  tenantId  : string
  sortOrder : number | null
}

/** SessionSituation — situation associée à une séance */
export type SessionSituation = {
  sessionId   : string
  situationId : string
  tenantId    : string
  sortOrder   : number | null
}

// ============================================================
// Story 4.2 — Roster Attendu & Présences Terrain
// ============================================================

// AttendanceStatus already defined in enums.ts

/** SessionAttendee — roster attendu de la séance */
export type SessionAttendee = {
  sessionId : string
  childId   : string
  tenantId  : string
}

/** Attendance — présence réelle enregistrée terrain */
export type Attendance = {
  id         : string
  sessionId  : string
  childId    : string
  tenantId   : string
  status     : AttendanceStatus
  recordedBy : string
  recordedAt : string
  syncedAt   : string | null
}

/** CoachPresenceConfirmation — confirmation de présence coach */
export type CoachPresenceConfirmation = {
  sessionId   : string
  coachId     : string
  tenantId    : string
  confirmedAt : string
  deviceId    : string | null
}

/** BlockCheckin — check-in coach sur un bloc de séances */
export type BlockCheckin = {
  sessionBlockId : string
  coachId        : string
  tenantId       : string
  checkedInAt    : string
}

// ============================================================
// Story 4.3 — Notifications Infrastructure
// ============================================================

export type NotificationPlatform = 'ios' | 'android' | 'web'
// NotificationChannel already defined in enums.ts
export type NotificationStatus   = 'sent' | 'failed' | 'skipped'

/** PushToken — token push d'un appareil utilisateur */
export type PushToken = {
  id        : string
  userId    : string
  tenantId  : string
  token     : string
  platform  : NotificationPlatform
  createdAt : string
}

/** NotificationPreferences — préférences de notification d'un utilisateur */
export type NotificationPreferences = {
  userId       : string
  tenantId     : string
  pushEnabled  : boolean
  emailEnabled : boolean
  smsEnabled   : boolean
  updatedAt    : string
}

/** NotificationSendLog — journal d'envoi de notification */
export type NotificationSendLog = {
  id               : string
  tenantId         : string
  recipientId      : string
  channel          : NotificationChannel
  eventType        : string
  referenceId      : string | null
  status           : NotificationStatus
  urgency          : 'routine' | 'urgent'
  providerResponse : Record<string, unknown> | null
  errorText        : string | null
  sentAt           : string
}

// ============================================================
// Story 4.7 — Vue Coach : Notes de séance & Feedback contenu
// ============================================================

export type FeedbackStatus  = 'submitted' | 'accepted' | 'rejected' | 'testing'
export type FeedbackUnitType = 'theme' | 'situation' | 'sequence'

/** CoachSessionNote — note personnelle d'un coach sur une séance */
export type CoachSessionNote = {
  id             : string
  sessionId      : string
  coachId        : string
  tenantId       : string
  note           : string
  visibleToAdmin : boolean
  createdAt      : string
  updatedAt      : string | null
}

/** CoachContentFeedback — feedback d'un coach sur du contenu du référentiel */
export type CoachContentFeedback = {
  id        : string
  coachId   : string
  tenantId  : string
  unitType  : FeedbackUnitType
  unitId    : string
  content   : string
  status    : FeedbackStatus
  createdAt : string
}

// ============================================================
// Epic 5 — Présences Terrain (Offline-First)
// ============================================================

/** SyncQueueEntry — opération en attente de synchronisation serveur */
export type SyncQueueEntry = {
  id            : string
  operationId   : string
  tenantId      : string
  deviceId      : string | null
  actorId       : string
  entityType    : 'attendance' | 'evaluation' | 'coach_presence'
  entityId      : string | null
  payload       : Record<string, unknown>
  status        : 'pending' | 'syncing' | 'failed' | 'done'
  retryCount    : number
  lastError     : string | null
  lastAttemptAt : string | null
  syncedAt      : string | null
  createdAt     : string
}

/** EventLogEntry — événement immuable dans le log d'audit event sourcing */
export type EventLogEntry = {
  id          : string
  tenantId    : string
  entityType  : string
  entityId    : string
  eventType   : string
  payload     : Record<string, unknown>
  actorId     : string
  occurredAt  : string
  operationId : string
  source      : 'field' | 'admin' | 'sync' | 'import'
  deviceId    : string | null
}

// ============================================================
// Epic 6 — Évaluation Coach & Clôture de Séance
// ============================================================

export type TopSeance          = 'star' | 'none'
export type ValidationStatus   = 'pending' | 'validated_lead' | 'validated_both'

/** Evaluation — évaluation d'un enfant par un coach lors d'une séance */
export type Evaluation = {
  id          : string
  sessionId   : string
  childId     : string
  coachId     : string
  tenantId    : string
  receptivite : 'positive' | 'attention' | 'none'
  goutEffort  : 'positive' | 'attention' | 'none'
  attitude    : 'positive' | 'attention' | 'none'
  topSeance   : TopSeance
  note        : string | null
  lastEventId : string | null
  updatedBy   : string | null
  updatedAt   : string | null
  createdAt   : string
}

/** EvaluationMerged — vue fusionnée par session+enfant (règle attention > positive > none) */
export type EvaluationMerged = {
  sessionId  : string
  childId    : string
  tenantId   : string
  receptivite: 'positive' | 'attention' | 'none'
  goutEffort : 'positive' | 'attention' | 'none'
  attitude   : 'positive' | 'attention' | 'none'
  topSeance  : TopSeance
}

// ============================================================
// Epic 8 — Quiz, Boucle d'Apprentissage & Progression Joueur
// ============================================================

export type AttemptType  = 'post_session' | 'revalidation'
export type MasteryStatus = 'acquired' | 'not_acquired'
export type StopReason   = 'mastered' | 'child_stopped' | 'time_limit'
export type ScopeType    = 'global' | 'theme' | 'age_group' | 'theme_age_group'
export type ReviewResult = 'maintained' | 'lost'

/** MasteryThreshold — seuil de maîtrise configurable par admin */
export type MasteryThreshold = {
  id        : string
  tenantId  : string
  scopeType : ScopeType
  themeId   : string | null
  ageGroup  : AgeGroup | null
  threshold : number
  createdAt : string
}

/** LearningAttempt — tentative d'apprentissage adaptatif par un enfant */
export type LearningAttempt = {
  id                : string
  tenantId          : string
  sessionId         : string | null
  childId           : string
  themeId           : string
  attemptType       : AttemptType
  startedAt         : string
  endedAt           : string | null
  masteryPercent    : number | null
  masteryStatus     : MasteryStatus | null
  questionsAnswered : number
  correctCount      : number
  stopReason        : StopReason | null
  reviewDueAt       : string | null
  reviewedAt        : string | null
  reviewResult      : ReviewResult | null
  modelName         : string | null
  createdAt         : string
}

/** LearningAnswer — réponse individuelle à une question de quiz */
export type LearningAnswer = {
  id               : string
  attemptId        : string
  questionId       : string
  selectedOptionId : string
  isCorrect        : boolean
  answeredAt       : string
}

/** PlayerProgress — snapshot dénormalisé de la progression d'un joueur */
export type PlayerProgress = {
  childId             : string
  tenantId            : string
  totalPoints         : number
  currentStreak       : number
  maxStreak           : number
  themesAcquiredCount : number
  lastActivityAt      : string | null
  updatedAt           : string
}
