// @aureak/types — Entités de base (fondation Story 1.2)
// Convention : camelCase en TypeScript, snake_case uniquement en DB
// Transformation snake_case → camelCase : uniquement dans @aureak/api-client/src/transforms.ts

import type { UserRole, AttendanceStatus, NotificationChannel, FootballAgeCategory, FootballTeamLevel, BelgianProvince, MethodologyMethod, MethodologyContextType, MethodologyLevel, SessionType, SituationalBlocCode, ClubRelationType, CoachGradeLevel } from './enums'

export type { MethodologyMethod, MethodologyContextType, MethodologyLevel }

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

/**
 * ClubChildLinkType — nature de la relation enfant ↔ club (migration 00051)
 * 'current'    : joueur actuellement actif dans ce club (lien opérationnel)
 * 'affiliated' : joueur officiellement affilié à ce club (fédération / matricule)
 *
 * Un même joueur peut avoir les deux types en même temps :
 *   - affiliated à Club A + current à Club B (situation de prêt)
 *   - affiliated ET current au même club (cas standard)
 */
export type ClubChildLinkType = 'current' | 'affiliated'

/** ClubChildLink — liaison enfant <-> club avec type de relation */
export type ClubChildLink = {
  clubId   : string
  childId  : string
  linkType : ClubChildLinkType
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
// Historique football par saison (Migration 00010)
// ============================================================

/** ChildClubHistory — affiliation football d'un enfant pour une saison donnée */
export type ChildClubHistory = {
  id           : string
  tenantId     : string
  childId      : string
  season       : string                      // ex : '2024-2025'
  clubId       : string | null              // club dans l'app (nullable)
  clubName     : string                      // nom explicite du club
  isAffiliated : boolean
  ageCategory  : FootballAgeCategory
  teamLevel    : FootballTeamLevel | null
  notes        : string | null
  createdAt    : string
  updatedAt    : string | null
}

export type { FootballAgeCategory, FootballTeamLevel }

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
  imageUrl       : string | null               // bannière visuelle (Story 20-2)
  orderIndex          : number                      // position drag&drop (Story 20-3)
  category            : string | null               // catégorie pédagogique (Story 20-3)
  positionIndex       : number | null               // slot fixe 1–25 dans la grille (Story 20-4)
  requiredGradeLevel  : CoachGradeLevel             // grade minimum requis (Story 11.2)
  deletedAt           : string | null
  createdAt           : string
}

/** ThemeMetaphor — métaphore pédagogique d'un thème, liée optionnellement à une séquence (Story 24.3) */
export type ThemeMetaphor = {
  id          : string
  tenantId    : string
  themeId     : string
  title       : string
  description : string | null
  sequenceId  : string | null
  sortOrder   : number
  createdAt   : string
  updatedAt   : string
}

/** ThemeSequence — séquence pédagogique d'un thème (liée à une version immuable) */
export type ThemeSequence = {
  id            : string
  themeId       : string
  tenantId      : string
  name          : string
  description   : string | null
  sortOrder     : number | null
  createdAt     : string
  // Champs terrain + critères ciblés (migration 00056)
  shortCues     : string[]
  coachVideoUrl : string | null
  criteriaIds?  : string[]
}

// ============================================================
// Story 3.2 — Référentiel Pédagogique : Criterion, Fault, Cue
// ============================================================

/** Criterion — critère de réussite d'une séquence pédagogique */
export type Criterion = {
  id                      : string
  sequenceId              : string | null   // nullable depuis migration 00080
  tenantId                : string
  themeId                 : string          // source de vérité depuis migration 00080
  metaphorId              : string | null   // liaison optionnelle à une métaphore (exclusif avec sequenceId)
  label                   : string
  description             : string | null
  sortOrder               : number | null
  createdAt               : string
  // Champs pédagogiques étendus (migration 00056)
  whyImportant            : string | null
  minLevel                : string | null
  logicalOrder            : number
  goodExecutionVideoUrl   : string | null
  goodExecutionImageUrl   : string | null
}

/** Fault — faute associée à un critère */
export type Fault = {
  id                  : string
  criterionId         : string | null   // nullable depuis migration 00081
  themeId             : string          // source de vérité depuis migration 00081
  tenantId            : string
  label               : string
  description         : string | null
  sortOrder           : number | null
  createdAt           : string
  // Diagnostic complet + correction (migration 00056)
  visibleSign         : string | null
  probableCause       : string | null
  correctionWording   : string | null
  coachingPhrase      : string | null
  practicalAdjustment : string | null
  correctiveVideoUrl  : string | null
  correctiveImageUrl  : string | null
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
  id                 : string
  tenantId           : string
  groupId            : string | null           // legacy situation_groups (kept for compatibility)
  blocId             : string | null           // FK → theme_groups (= Blocs, migration 00057)
  situationKey       : string                  // slug invariant
  name               : string
  description        : string | null
  variables          : Record<string, unknown> | null
  targetAudience     : Record<string, unknown>
  version            : number
  isCurrent          : boolean
  requiredGradeLevel : CoachGradeLevel         // grade minimum requis (Story 11.2)
  deletedAt          : string | null
  createdAt          : string
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
// ============================================================
// Story 13.1 — Sessions v2 : content_ref types (migration 00058)
// ============================================================

/** Référence contenu Goal & Player : 3 modules × 15 ENT = 45 entraînements distincts (Story 21.1)
 *  Rétrocompatibilité : les anciennes séances portent `sequence`/`half`/`repeat` (ancien format).
 *  Nouveau format : `entNumber` (1-15 par module) + `globalNumber` = (module-1)*15 + entNumber.
 *  Pour distinguer : si `contentRef.entNumber` existe → nouveau format ; si `contentRef.sequence` existe → ancien format.
 */
export type GPContentRef = {
  method      : 'goal_and_player'
  module      : 1 | 2 | 3    // Module 1, 2 ou 3
  entNumber   : number        // 1-15 par module (nouveau champ — Story 21.1)
  globalNumber: number        // (module-1)*15 + entNumber, 1-45
  // Rétrocompatibilité — présents dans les anciennes séances uniquement
  sequence?   : number        // 1-5 (ancien format — ne pas utiliser en création)
  half?       : 'A' | 'B'    // ancien format
  repeat?     : 1 | 2        // ancien format
}

/** Référence contenu Technique — contexte académie : 8 modules × 4 séances = 32 */
export type TechniqueAcademieContentRef = {
  method      : 'technique'
  context     : 'academie'
  module      : number        // 1-8
  sequence    : number        // 1-4
  globalNumber: number        // (module-1)*4 + sequence, 1-32
}

/** Référence contenu Technique — contexte stage : concept libre × 8 séances */
export type TechniqueStageContentRef = {
  method  : 'technique'
  context : 'stage'
  concept : string            // ex: "Prise en main"
  sequence: number            // 1-8
}

/** Référence contenu Situationnel : bloc code + séquence numérotée */
export type SituationnelContentRef = {
  method  : 'situationnel'
  blocCode: SituationalBlocCode
  sequence: number            // 1..N
  label   : string            // ex: "TAB-01" = `${blocCode}-${seq.padStart(2,'0')}`
  subtitle?: string           // ex: "Saut d'allègement"
}

/** Référence contenu Décisionnel : blocs libres créés par le coach */
export type DecisionnelContentRef = {
  method : 'decisionnel'
  blocks : Array<{ title: string }>
}

/** Référence contenu vide — types sans contenu pré-construit */
export type EmptyContentRef = {
  method: 'perfectionnement' | 'integration' | 'equipe'
}

/** Union discriminée de toutes les variantes de content_ref */
export type SessionContentRef =
  | GPContentRef
  | TechniqueAcademieContentRef
  | TechniqueStageContentRef
  | SituationnelContentRef
  | DecisionnelContentRef
  | EmptyContentRef

// ============================================================
// Story 4.1 — Modèle de Données : Sessions, Blocs & Récurrence
// ============================================================

export type SessionStatus  = 'planifiée' | 'en_cours' | 'terminée' | 'annulée' | 'reportée' | 'réalisée'
export type CoachRole      = 'lead' | 'assistant'
export type GroupStaffRole = 'principal' | 'assistant' | 'remplacant'

/** GroupStaff — coach assigné à un groupe avec un rôle fixe (prefill pour les séances) */
export type GroupStaff = {
  id       : string
  tenantId : string
  groupId  : string
  coachId  : string
  role     : GroupStaffRole
  createdAt: string
}

/** GroupWithMeta — groupe enrichi avec nom implantation + compteur membres */
export type GroupWithMeta = Group & {
  implantationName: string
  memberCount     : number
}

/** GroupStaffWithName — GroupStaff avec le nom du coach pour affichage */
export type GroupStaffWithName = GroupStaff & {
  coachName: string
}

/** GroupMemberWithName — membre de groupe avec le nom de l'enfant pour affichage */
export type GroupMemberWithName = {
  groupId    : string
  childId    : string
  displayName: string
  joinedAt   : string
}

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

/** Méthode pédagogique associée à un groupe */
export type GroupMethod = 'Goal and Player' | 'Technique' | 'Situationnel' | 'Décisionnel'

/** Group — groupe d'enfants dans une implantation (nom généré automatiquement) */
export type Group = {
  id              : string
  tenantId        : string
  implantationId  : string
  name            : string
  ageGroup        : AgeGroup | null   // conservé pour rétrocompat — préférer method
  // Champs structurés (migration 00040)
  dayOfWeek       : string | null     // Lundi … Dimanche
  startHour       : number | null     // 0-23
  startMinute     : number | null     // 0, 15, 30, 45
  durationMinutes : number | null     // ex : 60, 75, 90
  method          : GroupMethod | null
  /** true = groupe technique auto-créé pour une séance ponctuelle (migration 00061) */
  isTransient     : boolean
  deletedAt       : string | null
  createdAt       : string
}

/** GroupMember — appartenance d'un enfant à un groupe */
export type GroupMember = {
  groupId  : string
  childId  : string
  tenantId : string
  joinedAt : string
}

// ============================================================
// Migration 00041 — Système de statut académie
// ============================================================

/** Statut calculé automatiquement à partir de l'historique académie + stages */
export type AcademyStatus =
  | 'ACADÉMICIEN'
  | 'NOUVEAU_ACADÉMICIEN'
  | 'ANCIEN'
  | 'STAGE_UNIQUEMENT'
  | 'PROSPECT'

/** Saison académie (ex : 2025-2026) */
export type AcademySeason = {
  id        : string
  tenantId  : string
  label     : string       // '2025-2026'
  startDate : string       // ISO date
  endDate   : string       // ISO date
  isCurrent : boolean
  createdAt : string
}

/** Inscription d'un enfant (child_directory) à une saison académie */
export type ChildAcademyMembership = {
  id        : string
  tenantId  : string
  childId   : string
  seasonId  : string
  season?   : AcademySeason
  joinedAt  : string
  leftAt    : string | null
  notes     : string | null
  createdAt : string
}

export type StageStatus      = 'planifié' | 'en_cours' | 'terminé' | 'annulé'
export type StageType        = 'été' | 'toussaint' | 'hiver' | 'pâques' | 'custom'
export type StageSessionType = 'entrainement' | 'match' | 'théorie' | 'autre'

/** Stage / camp d'entraînement (Migration 00041 + 00048) */
export type Stage = {
  id              : string
  tenantId        : string
  name            : string           // 'Stage Été 2024'
  seasonLabel     : string | null    // '2024-2025'
  startDate       : string           // ISO date
  endDate         : string           // ISO date
  location        : string | null
  type            : StageType | null
  // Colonnes ajoutées par migration 00048
  implantationId  : string | null
  status          : StageStatus
  maxParticipants : number | null
  notes           : string | null
  createdAt       : string
}

/** StageDay — journée d'un stage */
export type StageDay = {
  id        : string
  tenantId  : string
  stageId   : string
  date      : string   // ISO date
  notes     : string | null
  sortOrder : number
  createdAt : string
}

/** StageBlock — bloc d'entraînement dans une journée de stage */
export type StageBlock = {
  id                  : string
  tenantId            : string
  stageDayId          : string
  startHour           : number
  startMinute         : number
  durationMinutes     : number
  method              : GroupMethod | null
  sessionType         : StageSessionType
  terrain             : string | null
  theme               : string | null
  coachPrincipalId    : string | null
  coachAssistantId    : string | null
  coachReplacementId  : string | null
  notes               : string | null
  sortOrder           : number
  createdAt           : string
}

/** StageBlockParticipant — affectation optionnelle d'un enfant à un bloc */
export type StageBlockParticipant = {
  id           : string
  tenantId     : string
  stageBlockId : string
  childId      : string
  createdAt    : string
}

/** StageWithMeta — stage enrichi pour liste admin */
export type StageWithMeta = Stage & {
  implantationName : string | null
  dayCount         : number
  participantCount : number
}

/** Participation d'un enfant (child_directory) à un stage */
export type ChildStageParticipation = {
  id                  : string
  tenantId            : string
  childId             : string
  stageId             : string
  stage?              : Stage
  participationStatus : string   // 'registered' | 'confirmed' | 'absent' | 'cancelled'
  registeredAt        : string
  createdAt           : string
}

/**
 * Données agrégées renvoyées par la vue v_child_academy_status.
 * Utilisé pour calculer le statut affiché et générer les badges.
 */
export type ChildAcademyStatusData = {
  childId             : string
  tenantId            : string
  displayName         : string
  computedStatus      : AcademyStatus
  totalAcademySeasons : number
  inCurrentSeason     : boolean
  firstSeasonLabel    : string | null
  lastSeasonLabel     : string | null
  currentSeasonLabel  : string | null
  totalStages         : number
  firstStageName      : string | null
  lastStageName       : string | null
  firstStageDate      : string | null
  lastStageDate       : string | null
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
  // Story 13.1 — Sessions v2 (migration 00058)
  sessionType           : SessionType | null    // null pour séances antérieures à la migration
  contentRef            : SessionContentRef      // '{}' par défaut si non défini
  // Story 13.3 — Clôture coach (migration 00062)
  closedAt              : string | null          // null = non clôturée via close_session_coach
  // Story 13.3 — Lien séance pédagogique (migration 00050)
  methodologySessionId  : string | null
  // Story 19.5 — Notes admin libres (migration 00066)
  notes                 : string | null
  // Story 21.1 — Training Builder : contexte global + titre auto-généré (migration 00071)
  contextType           : 'academie' | 'stage' | null   // contexte pédagogique global
  label                 : string | null                  // titre lisible, ex: "Goal & Player – Module 2 – ENT 7"
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

/**
 * SessionThemeBlock — bloc thème/séquence/ressource lié à une séance opérationnelle (Story 21.2)
 * Distinct de SessionTheme (migration 00050) et de methodology_session_themes.
 * Stocké dans la table `session_theme_blocks` (migration 00072).
 */
export type SessionThemeBlock = {
  id            : string
  tenantId      : string
  sessionId     : string
  themeId       : string
  sequenceId    : string | null
  resourceId    : string | null
  sortOrder     : number
  createdAt     : string
  // Données jointes pour l'affichage (optionnelles — absentes si pas de JOIN)
  themeName?    : string
  sequenceName? : string
  resourceLabel?: string
  resourceUrl?  : string
}

/**
 * SessionWorkshop — atelier pratique lié à une séance opérationnelle (Story 21.3)
 * Stocké dans la table `session_workshops` (migration 00076).
 */
export type SessionWorkshop = {
  id        : string
  tenantId  : string
  sessionId : string
  title     : string
  sortOrder : number
  pdfUrl    : string | null
  cardLabel : string | null
  cardUrl   : string | null
  notes     : string | null
  createdAt : string
  updatedAt : string
}

/**
 * SessionWorkshopDraft — état local d'un atelier dans les formulaires création/édition.
 * `id` est présent uniquement en mode édition (atelier existant en DB).
 */
export type SessionWorkshopDraft = {
  id?          : string   // présent si atelier existant (mode édition)
  title        : string
  pdfUrl       : string | null
  pdfFile      : File | null  // fichier local en attente d'upload (mode création sans sessionId)
  pdfUploading : boolean
  cardLabel    : string | null
  cardUrl      : string | null
  cardFile     : File | null  // fichier local en attente d'upload (mode création sans sessionId)
  cardUploading: boolean
  notes        : string
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
  sessionId       : string
  childId         : string
  tenantId        : string
  isGuest         : boolean   // Story 13.1 — true si joueur invité ponctuel (non-membre du groupe)
  // Story 13.3 — champs clôture coach (migration 00062)
  coachNotes      : string | null  // note rapide 140 chars, visible admin/coach uniquement
  contactDeclined : boolean        // true = parent a refusé de donner ses coordonnées
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

// ============================================================
// Migration 00033 — Annuaire des clubs belges (ClubDirectory)
// Entité organisationnelle distincte de la table `clubs` (portail)
// ============================================================

// ============================================================
// Migration 00040-00042 — Annuaire joueurs (ChildDirectory)
// Import Notion sans dépendance auth.users
// ============================================================

/**
 * ChildDirectoryEntry — fiche joueur/enfant dans l'annuaire import Notion
 * Distinct du profil auth (profiles table) : pas de compte app requis
 */
export type ChildDirectoryEntry = {
  id              : string
  tenantId        : string

  // Identité
  displayName     : string
  nom             : string | null    // Nom de famille (distinct de displayName — migration 00073)
  prenom          : string | null    // Prénom (distinct de displayName — migration 00073)
  birthDate       : string | null    // ISO date
  email           : string | null    // Contact direct du joueur (migration 00075)
  tel             : string | null    // Téléphone du joueur (migration 00075)
  statut          : string | null    // 'Académicien' | 'Ancien' | 'Nouveau' | 'Stagiaire'

  // Club actuel (texte import + FK annuaire)
  currentClub     : string | null
  niveauClub      : string | null    // 'Provinciaux' | 'Interprovinciaux' | 'Elite 1' | ...
  clubDirectoryId : string | null    // FK vers club_directory (auto-matché si trouvé)

  // Adresse
  adresseRue      : string | null
  codePostal      : string | null
  localite        : string | null

  // Parent 1
  parent1Nom      : string | null
  parent1Tel      : string | null
  parent1Email    : string | null

  // Parent 2
  parent2Nom      : string | null
  parent2Tel      : string | null
  parent2Email    : string | null

  // Classification niveau équipe (Story 25.0 — migration 00083)
  ageCategory     : FootballAgeCategory | null  // football_age_category enum PostgreSQL
  playerType      : 'youth' | 'senior' | null   // colonne générée, jamais saisie
  youthLevel      : string | null               // 'Régional' | 'Provincial' | 'Inter' | 'Élite 2' | 'Élite 1'
  seniorDivision  : string | null               // 'P4'..'D1A'
  teamLevelStars  : number | null               // 1-5, calculé en DB (GENERATED ALWAYS AS)

  // Statuts
  actif           : boolean
  notesInternes   : string | null
  contactDeclined : boolean          // Story 13.3 — parent a refusé de donner ses coordonnées

  // Notion sync
  notionPageId    : string | null
  notionSyncedAt  : string | null

  // Timestamps
  deletedAt       : string | null
  createdAt       : string
  updatedAt       : string
}

/** ChildDirectoryHistory — parcours football d'un joueur pour une saison */
export type ChildDirectoryHistory = {
  id              : string
  tenantId        : string
  childId         : string
  saison          : string           // '2024-2025'
  clubDirectoryId : string | null
  clubNom         : string
  categorie       : string | null    // U6..U21 | Senior
  niveau          : string | null    // Provinciaux | Interprovinciaux | ...
  affilie         : boolean
  notes           : string | null
  notionPageId    : string | null
  notionSyncedAt  : string | null
  createdAt       : string
  updatedAt       : string
}

/** ChildDirectoryInjury — blessure enregistrée pour un joueur (migration 00060) */
export type ChildDirectoryInjury = {
  id         : string
  tenantId   : string
  childId    : string
  /** 'blessure' = légère, 'grosse_blessure' = longue durée */
  type       : 'blessure' | 'grosse_blessure'
  zone       : string | null   // ex: 'cheville gauche', 'genou'
  dateDebut  : string | null   // ISO date
  dateFin    : string | null   // null = en cours
  commentaire: string | null
  createdAt  : string
  updatedAt  : string
}

/** ChildDirectoryPhoto — photo d'un joueur, stockée dans Supabase Storage (migration 00065)
 * Bucket: child-photos (privé) — accès via Signed URLs uniquement, expiration 1h
 * Un joueur peut avoir plusieurs photos ; une seule photo is_current par joueur
 * (unicité garantie par trigger DB fn_ensure_single_current_photo)
 */
export type ChildDirectoryPhoto = {
  id         : string
  tenantId   : string
  childId    : string
  photoPath  : string          // chemin relatif dans bucket child-photos
  photoUrl   : string | null   // Signed URL générée à la volée, jamais persistée en DB
  takenAt    : string | null   // ISO date (saisie manuelle, approximative)
  season     : string | null   // ex: '2024-2025' (saison académie)
  caption    : string | null   // légende optionnelle
  uploadedBy : string | null   // UUID auth.users (admin qui a uploadé)
  isCurrent  : boolean
  deletedAt  : string | null
  createdAt  : string
  updatedAt  : string
}

/** ClubDirectoryEntry — fiche club dans l'annuaire belge */
export type ClubDirectoryEntry = {
  id                          : string
  tenantId                    : string

  // Identité
  nom                         : string
  matricule                   : string | null
  label                       : string | null
  province                    : BelgianProvince | null

  // Adresse
  adresseRue                  : string | null
  codePostal                  : string | null
  ville                       : string | null

  // Web
  siteInternet                : string | null

  // Contact général
  correspondant               : string | null
  emailPrincipal              : string | null
  telephonePrincipal          : string | null

  // Responsable sportif
  responsableSportif          : string | null
  emailResponsableSportif     : string | null
  telephoneResponsableSportif : string | null

  // Statuts
  clubRelationType            : ClubRelationType
  actif                       : boolean

  /** Nombre de gardiens réels liés au club (hors prospects, avec participation). 0 si aucun. */
  gardienCount                : number

  // Logo (Storage path + signed URL générée à la volée par l'api-client)
  logoPath                    : string | null
  /** Signed URL valide 1h — null si pas de logo ou bucket indisponible */
  logoUrl                     : string | null

  // Notes admin
  notesInternes               : string | null

  // Notion sync
  notionPageId                : string | null
  notionSyncedAt              : string | null

  // RBFA enrichissement (migration 00081)
  /** Identifiant interne RBFA extrait de l'URL fiche club */
  rbfaId                      : string | null
  /** URL de la fiche club sur rbfa.be */
  rbfaUrl                     : string | null
  /** URL source du logo sur les serveurs RBFA */
  rbfaLogoUrl                 : string | null
  /** Score de matching 0–100 calculé par l'algorithme club-matching */
  rbfaConfidence              : number | null
  /** Statut du matching RBFA */
  rbfaStatus                  : RbfaStatus
  /** Date du dernier passage du job syncMissingClubLogos */
  lastVerifiedAt              : string | null

  // Timestamps
  deletedAt                   : string | null
  createdAt                   : string
  updatedAt                   : string
}

// ============================================================
// Migration 00050 — Méthodologie pédagogique
// ============================================================

/** Thème pédagogique — bloc de savoir coach (ex: prise de balle, relance) */
export type MethodologyTheme = {
  id            : string
  tenantId      : string
  title         : string
  bloc          : string | null             // bloc pédagogique parent (ex: 'Tir au but', '1vs1')
  method        : MethodologyMethod | null  // null = toutes méthodes
  description   : string | null
  corrections   : string | null             // points de correction clés
  coachingPoints: string | null             // points d'attention coach
  isActive      : boolean
  deletedAt     : string | null
  createdAt     : string
  updatedAt     : string
}

/** Situation pédagogique — situation de jeu/entraînement concrète (ex: 1c1, centre) */
export type MethodologySituation = {
  id            : string
  tenantId      : string
  title         : string
  method        : MethodologyMethod | null
  description   : string | null
  corrections   : string | null
  commonMistakes: string | null
  themeId       : string | null             // lien optionnel vers un thème
  isActive      : boolean
  deletedAt     : string | null
  createdAt     : string
  updatedAt     : string
}

/** Séance pédagogique — contenu réutilisable de la bibliothèque (PDF / vidéo / audio) */
export type MethodologySession = {
  id          : string
  tenantId    : string
  title       : string                        // auto-généré : Méthode - Contexte - Ref
  method      : MethodologyMethod | null
  contextType : MethodologyContextType | null // 'academie' | 'stage'
  moduleName  : string | null                 // module pédagogique (ex: 'Module Relance')
  trainingRef : string | null                 // référence/numéro de séance (ex: '22', '08')
  description : string | null
  pdfUrl      : string | null
  plateauUrl  : string | null                   // Story 13.3 — image/PDF plateau (migration 00062)
  videoUrl    : string | null
  audioUrl    : string | null
  // Champs conservés en DB mais non exposés dans le nouveau formulaire
  objective   : string | null
  level       : MethodologyLevel | null
  notes       : string | null
  isActive    : boolean
  deletedAt   : string | null
  createdAt   : string
  updatedAt   : string
}

// ── Theme Dossier Pédagogique (Migration 00056) ───────────────────────────

export type ThemeVision = {
  id                    : string
  tenantId              : string
  themeId               : string
  pourquoi              : string | null
  quandEnMatch          : string | null
  ceQueComprend         : string | null
  ideeMaitresse         : string | null
  criteresPrioritaires  : string | null
  createdAt             : string
  updatedAt             : string
}

export type ThemePageTerrain = {
  id              : string
  tenantId        : string
  themeId         : string
  sequencesCourt  : string | null
  metaphorsCourt  : string | null
  cues            : string[]
  criteriaSummary : string | null
  createdAt       : string
  updatedAt       : string
}

export type ThemeMiniExercise = {
  id          : string
  tenantId    : string
  themeId     : string
  criterionId : string | null
  sequenceId  : string | null   // liaison optionnelle à une séquence (migration 00082)
  title       : string
  purpose     : string | null
  situation   : string | null
  cue         : string | null
  videoUrl    : string | null
  imageUrl    : string | null
  sortOrder   : number
  createdAt   : string
  updatedAt   : string
}

export type ThemeHomeExercise = {
  id                       : string
  tenantId                 : string
  themeId                  : string
  title                    : string
  objective                : string | null
  material                 : string | null
  installation             : string | null
  parentChildInstructions  : string | null
  distanceMeters           : number | null
  intensity                : string | null
  repetitions              : number | null
  demoVideoUrl             : string | null
  requiredLevel            : string | null
  sortOrder                : number
  createdAt                : string
  updatedAt                : string
  criteriaIds?             : string[]
}

export type ThemeVideoEvalTemplate = {
  id           : string
  tenantId     : string
  themeId      : string
  exerciseId   : string | null
  title        : string
  instructions : string | null
  sortOrder    : number
  createdAt    : string
  updatedAt    : string
  criteriaIds? : string[]
}

export type CriterionEvalResult = 'acquis' | 'en_cours' | 'a_corriger'

export type ThemeVideoEvaluation = {
  id              : string
  tenantId        : string
  templateId      : string
  childId         : string
  coachId         : string | null
  videoUrl        : string | null
  globalComment   : string | null
  nextStep        : string | null
  evaluatedAt     : string | null
  createdAt       : string
  updatedAt       : string
  criterionResults?: { criterionId: string; result: CriterionEvalResult; comment: string | null }[]
}

export type BadgeStage = 'Bronze' | 'Argent' | 'Or' | 'Elite' | 'Master'

export type ThemeBadgeLevel = {
  id                    : string
  tenantId              : string
  themeId               : string
  levelNumber           : number
  stage                 : BadgeStage
  badgeImageUrl         : string | null
  progressionRule       : string | null
  requiredCriteriaCount : number | null
  sortOrder             : number
  createdAt             : string
}

export type ThemeResourceType = 'pdf_coach' | 'video_global' | 'image_global' | 'audio' | 'reference_media'

export type ThemeResource = {
  id           : string
  tenantId     : string
  themeId      : string
  resourceType : ThemeResourceType
  label        : string | null
  url          : string
  sortOrder    : number
  createdAt    : string
}

export type ThemeAgeDifferentiation = {
  id                  : string
  tenantId            : string
  themeId             : string
  ageCategory         : string
  simplificationNotes : string | null
  vocabularyAdapted   : string | null
  createdAt           : string
  updatedAt           : string
}

// ============================================================
// Story 13.2 — Calendrier scolaire & Auto-génération (migration 00059)
// ============================================================

/** Exception de calendrier scolaire — jours sans séance pour un tenant */
export type SchoolCalendarException = {
  id          : string
  tenantId    : string
  date        : string          // format ISO 'YYYY-MM-DD'
  label       : string          // ex: 'Vacances Noël'
  isNoSession : boolean         // true = pas de séance ce jour
  createdAt   : string
}

// ============================================================
// Migration 00081-00082 — Enrichissement RBFA
// Story 28-1
// ============================================================

/** Statut du matching RBFA pour un club de l'annuaire */
export type RbfaStatus = 'pending' | 'matched' | 'rejected' | 'skipped'

/** Résultat brut d'une recherche sur rbfa.be */
export type RbfaClubResult = {
  rbfaId   : string
  nom      : string
  matricule: string | null
  ville    : string | null
  province : string | null
  logoUrl  : string | null
  rbfaUrl  : string
}

/** Score détaillé du matching club Aureak ↔ candidat RBFA */
export type RbfaMatchScore = {
  total          : number   // 0–100 (cappé)
  matricule      : number   // 0 ou 60
  nomExact       : number   // 0 ou 20
  nomSimilarite  : number   // 0–12
  ville          : number   // 0 ou 5
  province       : number   // 0 ou 3
  confidence     : 'high' | 'medium' | 'low'
}

/** Résultat du job batch syncMissingClubLogos */
export type SyncResult = {
  processed     : number
  matched       : number   // import auto HIGH confidence
  pendingReview : number   // créés en MEDIUM confidence
  rejected      : number   // score LOW
  skipped       : number   // aucun résultat RBFA
  errors        : number
}

/** Fiche de révision manuelle d'un candidat RBFA ambigu */
export type ClubMatchReview = {
  id              : string
  tenantId        : string
  clubDirectoryId : string
  rbfaCandidate   : RbfaClubResult
  matchScore      : number
  scoreDetail     : RbfaMatchScore
  status          : 'pending' | 'confirmed' | 'rejected'
  reviewedBy      : string | null
  reviewedAt      : string | null
  createdAt       : string
  updatedAt       : string
  clubNom         : string | null   // joint depuis club_directory pour affichage
}

// =============================================================================
// Story 33.1 — Dashboard Admin Présences
// =============================================================================

export type AttendanceType = 'member' | 'trial'

export type CoachPresenceType = 'full' | 'partial' | 'absent'

export type AttendanceCorrection = {
  id           : string
  tenantId     : string
  sessionId    : string
  childId      : string
  correctedBy  : string
  oldStatus    : string | null
  newStatus    : string
  correctedAt  : string
}

export type SessionPresenceSummary = {
  sessionId       : string
  tenantId        : string
  groupId         : string
  implantationId  : string
  scheduledAt     : string
  sessionStatus   : string
  sessionType     : string | null
  closedAt        : string | null
  label           : string | null
  totalRoster     : number
  memberPresent   : number
  trialPresent    : number
  absentCount     : number
  unconfirmedCount: number
}

// =============================================================================
// Story 32.3 — Signaux Techniques Coach
// =============================================================================

export type CoachLevel = 'apprentice' | 'experienced'

export type SignalStatus = 'active' | 'resolved' | 'archived'

export type TechnicalSignal = {
  id               : string
  tenantId         : string
  childId          : string
  coachId          : string
  sessionId        : string
  errorObserved    : string
  successCriterion : string
  status           : SignalStatus
  notifyParent     : boolean
  createdAt        : string
  updatedAt        : string
}

export type TrainingUsageLog = {
  id         : string
  tenantId   : string
  trainingId : string
  groupId    : string
  sessionId  : string
  usedAt     : string
}

// =============================================================================
// Story 32.2 — Dashboard Opérationnel Séances
// =============================================================================

export type AlertType =
  | 'consecutive_absences'
  | 'debrief_missing'
  | 'coach_absent_unresolved'

export type AlertEntityType = 'child' | 'session' | 'coach'

export type AdminAlert = {
  id          : string
  tenantId    : string
  type        : AlertType
  entityId    : string
  entityType  : AlertEntityType
  metadata    : Record<string, unknown>
  status      : 'active' | 'resolved'
  resolvedAt  : string | null
  resolvedBy  : string | null
  createdAt   : string
}

export type SessionCardDensity = 'compact' | 'standard' | 'detaille'

export type CoachQualityMetrics = {
  coachId               : string
  tenantId              : string
  totalSessions         : number
  sessionsDone          : number
  debriefsFilled        : number
  debriefsMissing       : number
  debriefFillRate       : number | null   // %
  presenceRate          : number | null   // %
  avgDebriefDelayHours  : number | null
}

/** Ligne de la vue v_session_attendance_stats */
export type SessionAttendanceStats = {
  sessionId          : string
  tenantId           : string
  groupId            : string
  implantationId     : string
  scheduledAt        : string
  status             : string
  sessionType        : string | null
  closedAt           : string | null
  label              : string | null
  durationMinutes    : number
  cancellationReason : string | null
  totalAttendees     : number
  presentCount       : number
  absentCount        : number
  lateCount          : number
}

/** Ligne de la vue v_child_consecutive_absences */
export type ChildConsecutiveAbsence = {
  childId              : string
  groupId              : string
  tenantId             : string
  consecutiveAbsences  : number
  childName            : string
}

// =============================================================================
// Story 33.2 — Workflow Coach Présences & Badges
// =============================================================================

export type BadgeCategory = 'comportemental' | 'thematique'
export type LateType = 'under_15' | 'over_15'

export type BehavioralBadge = {
  id        : string
  tenantId  : string | null
  name      : string
  emoji     : string
  category  : BadgeCategory
  isActive  : boolean
}

export type SessionBadgeAward = {
  id        : string
  tenantId  : string
  sessionId : string
  childId   : string
  badgeId   : string
  awardedBy : string
  awardedAt : string
}

export type SessionPhoto = {
  id          : string
  tenantId    : string
  sessionId   : string
  storagePath : string
  takenBy     : string
  takenAt     : string
}

