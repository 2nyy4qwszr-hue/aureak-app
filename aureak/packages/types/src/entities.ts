// @aureak/types — Entités de base (fondation Story 1.2)
// Convention : camelCase en TypeScript, snake_case uniquement en DB
// Transformation snake_case → camelCase : uniquement dans @aureak/api-client/src/transforms.ts

import type { UserRole, AttendanceStatus, NotificationChannel, FootballAgeCategory, FootballTeamLevel, BelgianProvince, MethodologyMethod, MethodologyContextType, MethodologyLevel, SessionType, SituationalBlocCode, ClubRelationType, CoachGradeLevel, EventType, SectionKey, PermissionAccess } from './enums'

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

/**
 * ProfileRoleEntry — Story 86-2
 * Rôle additionnel attribué à un profil (relation N-N profiles × user_role).
 * profiles.role reste la source de vérité pour les policies RLS ; profile_roles est additif.
 * Miroir de la table `profile_roles` (migration 00149).
 *
 * Nommé `Entry` pour éviter la collision avec `ProfileRole` exporté depuis
 * `@aureak/api-client/admin/profiles` (union `'child' | 'parent' | 'coach' | 'club'`
 * utilisée pour la création de profil).
 */
export type ProfileRoleEntry = {
  id        : string
  profileId : string
  role      : UserRole
  grantedAt : string        // ISO 8601
  grantedBy : string | null
  deletedAt : string | null
  tenantId  : string
}

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

/** GroupMemberWithDetails — membre enrichi avec birthDate + currentClub (Story 44.5) */
export type GroupMemberWithDetails = GroupMemberWithName & {
  birthDate  : string | null
  currentClub: string | null
}

/** Implantation — site physique où se déroulent les séances */
export type Implantation = {
  id         : string
  tenantId   : string
  name       : string
  address    : string | null
  gpsLat     : number | null
  gpsLon     : number | null
  gpsRadius  : number
  photoUrl   : string | null   // Story 49-6 — photo/logo du site (bucket implantation-photos)
  maxPlayers : number | null   // Story 57-2 — capacité maximale de joueurs simultanés
  deletedAt  : string | null
  createdAt  : string
}

/** Méthode pédagogique associée à un groupe */
export type GroupMethod = 'Goal and Player' | 'Technique' | 'Situationnel' | 'Performance' | 'Décisionnel'

/**
 * FormationData — formation tactique persistée en JSON dans groups.formation_data (migration 00121)
 * Format : { position_key → childId | null }
 * Positions : GK, LB, DC_L, DC_R, RB, CM_L, CM_R, LW, CAM, RW, ST
 */
export type FormationData = Record<string, string | null>

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
  /** Formation tactique persistée (migration 00121) */
  formationData   : FormationData | null
  /** Capacité maximale du groupe (migration 00122) */
  maxPlayers      : number | null
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

/**
 * AvatarMember — données minimales pour afficher un avatar joueur (Story 56-3)
 * avgScore : note moyenne des évaluations (optionnel — tier calculé côté client)
 */
export type AvatarMember = {
  childId    : string
  displayName: string
  avgScore?  : number
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

/** Stage / camp d'entraînement (Migration 00041 + 00048 + 00135) */
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
  // Colonne ajoutée par migration 00135 (Story 63.2) — type d'évènement unifié
  eventType       : EventType
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

/**
 * BadgeItem — badge gamifié affiché dans la collection joueur (Story 52-9)
 * Débloqué/verrouillé selon les conditions calculées par computePlayerBadges().
 */
export type BadgeItem = {
  id         : string
  label      : string
  description: string
  icon       : string   // emoji
  unlocked   : boolean
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
  // Story 53-3 — Indicateur d'intensité (migration 00119)
  intensityLevel        : number | null                  // 1–5 ou null si non défini
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

/**
 * EvaluationWithChild — évaluation enrichie avec infos joueur et séance
 * Utilisé par EvaluationCard (Story 55-1) et la page évaluations admin
 */
export type EvaluationWithChild = Evaluation & {
  childName    : string | null
  sessionDate  : string | null    // ISO date de la séance
  sessionName  : string | null    // libellé ou nom de la séance
  coachName    : string | null
  photoUrl     : string | null    // URL Storage photo du joueur
  isPersonalBest?: boolean        // Story 55-4 — record historique joueur
}

/**
 * EvaluationPoint — point de données pour le graphique de croissance (Story 55-3)
 * date     : ISO date de la séance
 * score    : note calculée (0–10)
 * sessionName : libellé ou nom de la séance (optionnel)
 */
export type EvaluationPoint = {
  date       : string
  score      : number
  sessionName?: string
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

/** GroupQuizResult — résultat quiz d'un joueur pour une séance donnée (vue coach) — Story 8.6 */
export type GroupQuizResult = {
  childId           : string
  displayName       : string
  themeId           : string
  themeName         : string
  masteryPercent    : number | null
  masteryStatus     : 'acquired' | 'not_acquired' | null
  correctCount      : number
  questionsAnswered : number
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

  // Prospection (Story 89.4 + 89.6)
  prospectStatus  : ProspectStatus | null  // null = non-prospect, sinon cycle prospect → contacte → invite → candidat

  // Séance gratuite usage unique (Story 89.6)
  trialUsed       : boolean                // true = essai gratuit déjà consommé (un seul par prospect)
  trialDate       : string | null          // horodatage confirmation de la séance d'essai
  trialOutcome    : TrialOutcome | null    // résultat de la séance une fois passée

  // Notion sync
  notionPageId    : string | null
  notionSyncedAt  : string | null

  // Story 89.3 — auteur de création (pour auto-grant RGPD 'creator')
  createdBy       : string | null

  // Timestamps
  deletedAt       : string | null
  createdAt       : string
  updatedAt       : string
}

/** ProspectStatus — statut dans le cycle de prospection (Story 89.4 + 89.6) */
export type ProspectStatus = 'prospect' | 'contacte' | 'invite' | 'candidat'

/** TrialOutcome — résultat de la séance gratuite consommée (Story 89.6) */
export type TrialOutcome = 'present' | 'absent' | 'cancelled'

/** ProspectInvitation — trace d'envoi d'invitation séance gratuite (Story 89.4) */
export type ProspectInvitation = {
  id             : string
  tenantId       : string
  childId        : string
  invitedBy      : string
  parentEmail    : string
  parentName     : string | null
  implantationId : string | null
  message        : string | null
  sentAt         : string
  status         : 'sent' | 'failed' | 'delivered'
  resendId       : string | null
  createdAt      : string
  updatedAt      : string
  deletedAt      : string | null
}

/** WaitlistStatus — cycle de vie d'une entrée waitlist (Story 89.5) */
export type WaitlistStatus = 'waiting' | 'notified' | 'confirmed' | 'expired'

/** TrialWaitlistEntry — prospect en attente d'une place dans un groupe (Story 89.5) */
export type TrialWaitlistEntry = {
  id                : string
  tenantId          : string
  childId           : string
  groupId           : string
  implantationId    : string
  parentEmail       : string
  parentPhone       : string | null
  status            : WaitlistStatus
  requestedAt       : string
  notifiedAt        : string | null
  confirmedAt       : string | null
  expiredAt         : string | null
  notifiedSessionId : string | null
  confirmToken      : string
  createdBy         : string | null
  createdAt         : string
  updatedAt         : string
  deletedAt         : string | null
}

// ============================================================
// Epic 89 — Story 89.2 — Évaluations scout sur prospects gardiens
// ============================================================

/** ScoutObservationContext — contexte d'observation d'un scout sur un prospect */
export type ScoutObservationContext = 'match' | 'tournoi' | 'entrainement_club' | 'autre'

/** ProspectScoutEvaluation — observation scout horodatée (1-5 étoiles + commentaire) */
export type ProspectScoutEvaluation = {
  id                 : string
  tenantId           : string
  childId            : string
  evaluatorId        : string
  ratingStars        : number                       // 1..5 CHECK DB
  comment            : string | null
  observationContext : ScoutObservationContext | null
  observationDate    : string | null                // ISO date (nullable)
  deletedAt          : string | null
  createdAt          : string
  updatedAt          : string
}

/** Avec infos auteur pour affichage liste historique */
export type ProspectScoutEvaluationWithAuthor = ProspectScoutEvaluation & {
  authorName  : string | null   // profiles.display_name
  authorEmail : string | null   // profiles.email (fallback si pas de display_name)
}

/** Stats agrégées affichées en tête de section fiche joueur */
export type ProspectScoutEvaluationStats = {
  count         : number          // nombre d'évals non-deleted
  averageRating : number | null   // arrondi 1 décimale, null si count=0
  lastRating    : number | null   // rating de la dernière éval (null si count=0)
  lastDate      : string | null   // observation_date ?? created_at de la plus récente
  lastAuthorName: string | null
}

// ============================================================
// Epic 89 — Story 89.3 — Visibilité conditionnelle RGPD des coordonnées parent
// ============================================================

/** Motif d'octroi d'un grant RGPD (enum rgpd_grant_reason, migration 00158) */
export type RgpdGrantReason =
  | 'creator'           // auteur de la création de la fiche prospect
  | 'invitation'        // a envoyé une invitation séance gratuite
  | 'evaluation'        // a saisi une évaluation scout
  | 'explicit_grant'    // grant manuel accordé par un admin
  | 'admin'             // rôle admin (bypass du grant)
  | 'request_approved'  // demande d'accès approuvée par un admin

/** Statut d'une demande d'accès RGPD (enum rgpd_request_status, migration 00158) */
export type RgpdRequestStatus = 'pending' | 'approved' | 'rejected'

/** ProspectAccessGrant — grant effectif d'accès aux coordonnées RGPD d'un prospect */
export type ProspectAccessGrant = {
  id         : string
  tenantId   : string
  childId    : string
  grantedTo  : string             // auth.uid()
  grantedBy  : string | null      // NULL = trigger système
  reason     : RgpdGrantReason
  grantedAt  : string
  deletedAt  : string | null
  createdAt  : string
  updatedAt  : string
}

/** ProspectAccessGrant enrichi avec métadonnées d'affichage (UI admin) */
export type ProspectAccessGrantWithMeta = ProspectAccessGrant & {
  grantedToName  : string | null    // profiles.display_name du bénéficiaire
  grantedToEmail : string | null
  childName      : string           // child_directory.display_name
}

/** ProspectAccessRequest — demande d'accès RGPD formulée par un utilisateur */
export type ProspectAccessRequest = {
  id             : string
  tenantId       : string
  childId        : string
  requesterId    : string
  reason         : string           // justification saisie (1-500 chars)
  status         : RgpdRequestStatus
  requestedAt    : string
  resolvedAt     : string | null
  resolvedBy     : string | null
  resolvedNote   : string | null
  deletedAt      : string | null
  createdAt      : string
  updatedAt      : string
}

/** ProspectAccessRequest enrichi avec noms requester + prospect (UI admin) */
export type ProspectAccessRequestWithMeta = ProspectAccessRequest & {
  requesterName  : string | null
  requesterEmail : string | null
  childName      : string
}

/** ProspectRgpdAccessLog — log immuable des accès démasqués (preuve RGPD) */
export type ProspectRgpdAccessLog = {
  id          : string
  tenantId    : string
  childId     : string
  accessorId  : string
  grantedVia  : RgpdGrantReason
  accessedAt  : string
}

/** ProspectRgpdAccessLog enrichi (UI audit admin) */
export type ProspectRgpdAccessLogWithMeta = ProspectRgpdAccessLog & {
  accessorName  : string | null
  accessorEmail : string | null
  childName     : string
}

/** ChildDirectoryEntryRgpd — fiche joueur retournée par la vue v_child_directory_rgpd.
 *  Identique à ChildDirectoryEntry + flags RGPD. Les champs parent1Email/Tel/parent2Email/Tel,
 *  email/tel, adresseRue/codePostal/localite sont masqués si rgpdMasked=true. */
export type ChildDirectoryEntryRgpd = ChildDirectoryEntry & {
  rgpdMasked    : boolean
  rgpdAccessVia : RgpdGrantReason | null
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

// ── Story 58-2 — Éditeur terrain schématique SVG ─────────────────────────────

/** Joueur sur le schéma tactique — coordonnées en % du terrain */
export type DiagramPlayer = {
  id   : string      // UUID
  team : 'A' | 'B'
  x    : number      // 0–100 (% largeur terrain)
  y    : number      // 0–100 (% hauteur terrain)
}

/** Flèche de déplacement sur le schéma tactique */
export type DiagramArrow = {
  id : string
  x1 : number; y1: number
  x2 : number; y2: number
}

/** Données du schéma tactique — sérialisées dans methodology_situations.diagram_json */
export type DiagramData = {
  players : DiagramPlayer[]
  arrows  : DiagramArrow[]
}

/** Situation pédagogique — situation de jeu/entraînement concrète (ex: 1c1, centre) */
export type MethodologySituation = {
  id             : string
  tenantId       : string
  title          : string
  method         : MethodologyMethod | null
  description    : string | null
  corrections    : string | null
  commonMistakes : string | null
  themeId        : string | null             // lien optionnel vers un thème
  diagramJson    : DiagramData | null        // Story 58-2 — schéma tactique SVG
  difficultyLevel: number                    // Story 58-6 — 1=Débutant … 5=Expert (défaut 3)
  isActive       : boolean
  deletedAt      : string | null
  createdAt      : string
  updatedAt      : string
}

// ── Story 58-8 — Modules 3 phases de séance pédagogique ──────────────────────

/** Type de phase pédagogique */
export type MethodologyModuleType = 'activation' | 'development' | 'conclusion'

/** Module de phase d'une séance pédagogique (activation / développement / conclusion) */
export type MethodologySessionModule = {
  id              : string
  sessionId       : string  // methodology_session_id
  moduleType      : MethodologyModuleType
  durationMinutes : number
  situations      : MethodologySituation[]
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
  modules     : Array<{ num: number; titre: string; range: string }> | null  // Story 43.3 — Goal & Player
  isActive    : boolean
  deletedAt   : string | null
  createdAt   : string
  updatedAt   : string
  sessionsCount?: number  // nombre de séances terrain liées (protection suppression AC6)
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

// =============================================================================
// Story 33.3 — Vue Parent : Présences, Badges & Heatmap
// =============================================================================

export type AbsenceReason = 'injury' | 'match' | 'school' | 'school_trip' | 'vacation' | 'other'

export type AbsenceJustification = {
  id          : string
  tenantId    : string
  childId     : string
  sessionId   : string
  reason      : AbsenceReason
  note        : string | null
  submittedBy : string
  submittedAt : string
}

/** Statut pour la heatmap (calculé côté vue SQL) */
export type HeatmapStatus = 'present' | 'absent' | 'justified' | 'injured' | 'unconfirmed'

export type AttendanceHeatmapEntry = {
  childId              : string
  tenantId             : string
  sessionDate          : string   // ISO date YYYY-MM-DD
  sessionId            : string
  groupId              : string
  rawStatus            : string
  justificationReason  : AbsenceReason | null
  heatmapStatus        : HeatmapStatus
}

export type ChildBadgeHistory = {
  childId       : string
  tenantId      : string
  badgeId       : string
  badgeName     : string
  emoji         : string
  sessionId     : string
  sessionDate   : string   // ISO date
  awardedBy     : string
  awardedByName : string
}

// ─── Stories 12.1 + 12.2 — Gamification : badges, points, avatar, skill cards ─

export type BadgeDefinition = {
  id          : string
  tenantId    : string
  code        : string
  label       : string
  description : string | null
  iconUrl     : string | null
  points      : number
  season      : number | null
  isActive    : boolean
  createdAt   : string
}

export type PlayerBadgeSource = 'quiz' | 'attendance' | 'skill_mastered' | 'coach_award' | 'special_event'

export type PlayerBadge = {
  id        : string
  tenantId  : string
  childId   : string
  badgeId   : string
  awardedAt : string
  source    : PlayerBadgeSource
  refId     : string | null
}

export type PlayerPointsLedger = {
  id          : string
  tenantId    : string
  childId     : string
  eventType   : 'BADGE_AWARDED'
  refId       : string
  pointsDelta : number
  createdAt   : string
}

export type AvatarItemCategory = 'frame' | 'background' | 'accessory' | 'effect' | 'title'

export type AvatarItem = {
  id              : string
  tenantId        : string
  slug            : string
  name            : string
  category        : AvatarItemCategory
  unlockCondition : Record<string, unknown>
  assetUrl        : string | null
  isActive        : boolean
  sortOrder       : number | null
}

export type PlayerAvatar = {
  childId            : string
  tenantId           : string
  equippedFrame      : string | null
  equippedBackground : string | null
  equippedAccessory  : string | null
  equippedEffect     : string | null
  equippedTitle      : string | null
  updatedAt          : string
}

export type UnlockTrigger = 'badge_earned' | 'total_points' | 'themes_acquired'

export type PlayerUnlockedItem = {
  childId       : string
  itemId        : string
  unlockedAt    : string
  unlockTrigger : UnlockTrigger
}

export type ThemeMasteryStatus = 'not_started' | 'in_progress' | 'acquired' | 'revalidated'

export type PlayerThemeMastery = {
  childId         : string
  themeId         : string
  tenantId        : string
  masteryStatus   : ThemeMasteryStatus
  firstAcquiredAt : string | null
  lastAttemptAt   : string | null
  totalAttempts   : number
  reviewCount     : number
  updatedAt       : string
}

export type CardRarity = 'common' | 'rare' | 'epic' | 'legendary'
export type CardUnlockCondition = 'theme_acquired' | 'revalidated' | 'first_acquired' | 'streak_active'

export type SkillCard = {
  id               : string
  tenantId         : string
  themeId          : string
  slug             : string
  name             : string
  description      : string | null
  rarity           : CardRarity
  illustrationUrl  : string | null
  unlockCondition  : CardUnlockCondition
}

export type PlayerSkillCard = {
  childId     : string
  skillCardId : string
  tenantId    : string
  collectedAt : string
}

// ─── Story 12.4 — Quêtes hebdomadaires ───────────────────────────────────────

export type QuestRecurrence = 'weekly' | 'monthly' | 'once'
export type QuestType = 'attend_sessions' | 'acquire_themes' | 'complete_reviews'
export type QuestStatus = 'active' | 'completed' | 'expired'

export type QuestDefinition = {
  id            : string
  tenantId      : string
  code          : string
  name          : string
  description   : string | null
  iconUrl       : string | null
  recurrence    : QuestRecurrence
  questType     : QuestType
  targetValue   : number
  rewardBadgeId : string | null
  xpReward      : number
  isActive      : boolean
}

export type PlayerQuest = {
  id           : string
  tenantId     : string
  childId      : string
  questId      : string
  status       : QuestStatus
  currentValue : number
  targetValue  : number
  periodStart  : string
  periodEnd    : string
  completedAt  : string | null
  createdAt    : string
}

// ─── Story 49-7 — Club calculé automatiquement depuis l'historique football ───

/**
 * Résultat de la vue v_child_current_club.
 * Retourne le club de la saison académique courante (is_current = true)
 * pour un joueur donné, déduit de child_directory_history.
 * Lecture seule — ne jamais écrire dans current_club depuis ce type.
 */
export type ChildCurrentClubFromHistory = {
  childId          : string
  saison           : string        // ex: '2025-2026'
  clubNom          : string        // depuis child_directory_history.club_nom
  clubDirectoryId  : string | null // FK vers club_directory (nullable)
  clubNomAnnuaire  : string | null // nom officiel depuis club_directory.nom (nullable)
}

// ─── Story 51.3 — Command Palette ⌘K ─────────────────────────────────────────

/**
 * Type de résultat dans la command palette.
 * 'navigation' : action/page statique
 * 'player'     : joueur depuis child_directory
 * 'club'       : club depuis club_directory
 * 'session'    : séance terrain
 */
export type CommandResultType = 'navigation' | 'player' | 'club' | 'session'

/**
 * Résultat affiché dans la command palette ⌘K.
 * Peut porter soit un `href` (navigation router), soit une `action` (callback impératif).
 */
export interface CommandResult {
  id      : string
  type    : CommandResultType
  label   : string
  sublabel?: string
  href?   : string
  action? : () => void
  icon?   : string   // emoji ou caractère court affiché à gauche du label
}

// ─── Story 51.2 — Topbar séance active permanente ────────────────────────────

/**
 * Informations d'une séance actuellement active (dans la fenêtre temporelle).
 * Retourné par getActiveSession() dans @aureak/api-client.
 * La fenêtre active = [scheduled_at - 30min .. scheduled_at + duration + 15min]
 */
export interface ActiveSessionInfo {
  sessionId       : string
  groupName       : string
  presentCount    : number
  totalCount      : number
  scheduledAt     : string
  durationMinutes : number
}

/**
 * Compteurs pour les pastilles de notification de la sidebar (Story 51.4).
 * Retourné par getNavBadgeCounts() dans @aureak/api-client.
 */
export interface NavBadgeCounts {
  presencesUnvalidated : number   // séances réalisées sans présences complètes
  sessionsUpcoming24h  : boolean  // true si au moins 1 séance planifiée dans 24h
}

// ─── Story 55-5 — Comparaison biais coach-à-coach ────────────────────────────

/**
 * Rapport de biais de notation pour un coach.
 * Le delta est calculé par rapport à la médiane de tous les scores de la période.
 * Seuils : < 0.5 = neutre (vert), 0.5–1.5 = modéré (orange), > 1.5 = fort (rouge).
 */
export interface CoachBiasReport {
  coachId        : string
  coachName      : string
  evalCount      : number
  avgScore       : number | null   // null si evalCount < MIN_EVAL_THRESHOLD
  deltaVsMedian  : number | null   // null si données insuffisantes
  biasLevel      : 'neutral' | 'moderate' | 'strong' | 'insufficient'
}

// ─── Story 55-6 — Filtre joueurs en danger ────────────────────────────────────

/**
 * Joueur avec 3+ évaluations consécutives sous le seuil de danger (< 5.0).
 * Utilisé dans la section "Alertes" de evaluations/index.tsx et le filtre de children/index.tsx.
 */
export interface DangerousPlayer {
  childId     : string
  displayName : string
  lastScore   : number   // score de la dernière évaluation (0–10)
  streakCount : number   // nombre de séances consécutives sous le seuil
}

// ─── Story 55-8 — Joueur de la semaine ───────────────────────────────────────

/**
 * Joueur ayant obtenu la meilleure note lors d'une séance dans les 7 derniers jours.
 * Retourné par getPlayerOfWeek() dans @aureak/api-client/src/admin/dashboard.ts.
 */
export interface PlayerOfWeek {
  childId     : string
  displayName : string
  photoUrl    : string | null
  score       : number       // note sur 10
  sessionName : string | null
  sessionDate : string       // ISO 8601
}

// ─── Story 56-5 — Badge groupe du mois ───────────────────────────────────────

/**
 * Groupe avec le meilleur taux de présence sur une période donnée.
 * Retourné par getTopGroupByAttendance() dans @aureak/api-client/src/sessions/dashboard.ts.
 * null si aucune donnée de présence dans la période.
 */
export type TopGroupResult = {
  groupId       : string
  groupName     : string
  attendanceRate: number  // entre 0 et 1 (ex : 0.9 = 90%)
} | null

// ─── Story 56-7 — Générateur auto groupes par âge ────────────────────────────

/**
 * Proposition d'un groupe généré automatiquement par catégorie d'âge.
 * Retourné par generateGroupsBySeason() — côté client, pas d'écriture en DB.
 */
export interface GroupProposalMember {
  childId    : string
  displayName: string
  birthYear  : number
}

export interface GroupProposal {
  name        : string
  ageCategory : string
  members     : GroupProposalMember[]
  /** true = un groupe avec ce nom existe déjà dans l'implantation */
  hasConflict?: boolean
}

// ============================================================
// Story 57-5 — Stats hover implantation
// ============================================================

export type ImplantationHoverStats = {
  attendanceRatePct    : number   // 0–100
  masteryRatePct       : number   // 0–100 (ajouté story 57-6)
  sessionCountThisMonth: number
  activeGroupCount     : number
}

// ============================================================
// Story 57-7 — Score de santé implantation
// ============================================================

export type HealthLevel = 'green' | 'gold' | 'red'

export type HealthScore = {
  score : number       // 0–100
  level : HealthLevel
  label : string       // 'Excellent' | 'Correct' | 'À surveiller'
}

// ============================================================
// Story 57-8 — Mini-timeline prochaines séances
// ============================================================

export type UpcomingSession = {
  id          : string
  date        : string       // ISO date
  startHour   : number | null
  startMinute : number | null
  groupId     : string
  groupName   : string
  groupMethod : string | null
}

// ============================================================
// Story 59-1 — Gamification XP étendu (xp_ledger + player_xp_progression)
// ============================================================

/** XpEventType — 5 types d'événements créditant des XP */
export type XpEventType =
  | 'ATTENDANCE'
  | 'NOTE_HIGH'
  | 'BADGE_EARNED'
  | 'STAGE_PARTICIPATION'
  | 'SESSION_STREAK_5'

/** XpLedgerEntry — ligne dans xp_ledger (ledger append-only) */
export type XpLedgerEntry = {
  id        : string
  tenantId  : string
  childId   : string
  eventType : XpEventType
  refId     : string | null
  xpDelta   : number
  createdAt : string   // ISO 8601
}

/** PlayerXpSnapshot — snapshot mensuel XP par joueur */
export type PlayerXpSnapshot = {
  id            : string
  tenantId      : string
  childId       : string
  seasonId      : string | null
  snapshotMonth : string   // ISO date — 1er du mois
  xpTotal       : number
  xpDeltaMonth  : number
  levelTier     : string   // 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond' | 'legend'
  computedAt    : string   // ISO 8601
}

/** XpEvent — payload envoyé à la Edge Function award-xp */
export type XpEvent = {
  childId     : string
  eventType   : XpEventType
  refId?      : string
  xpOverride? : number
  operationId?: string
}

// ============================================================
// Story 59-6 — Score académie global KPI
// ============================================================

/** AcademyScoreResult — score composite 0–100 de l'académie */
export type AcademyScoreResult = {
  score      : number   // 0–100, entier
  level      : 'Débutante' | 'En développement' | 'Confirmée' | 'Excellence' | 'Élite'
  components : {
    presenceRate    : number  // 0–100
    progressionScore: number  // 0–100
    activityScore   : number  // 0–100
  }
  trend      : number   // delta vs semaine précédente (peut être négatif)
  computedAt : string   // ISO 8601
}

// ============================================================
// Story 59-10 — Trophée de saison SVG paramétrique
// ============================================================

/** SeasonTrophyData — données pour le rendu du trophée de saison */
export type SeasonTrophyData = {
  season: {
    id        : string
    label     : string
    startDate : string  // ISO date
    endDate   : string  // ISO date
  }
  badgeCount: number
}

// ============================================================
// Story 59-8 — Profil admin avec XP + stats activité
// ============================================================

/** AdminProfile — profil d'un administrateur avec XP gamification */
export type AdminProfile = {
  id          : string
  tenantId    : string
  displayName : string
  avatarUrl   : string | null
  role        : 'admin'
  memberSince : string   // ISO 8601
  totalXp     : number
}

/** AdminActivityStats — KPI d'activité de l'administrateur */
export type AdminActivityStats = {
  sessionsCreated     : number
  playersManaged      : number
  badgesAwarded       : number
  evaluationsValidated: number
}

// ============================================================
// Story 59-7 — Milestones académie collectifs
// ============================================================

/** AcademyMilestone — jalons collectifs de l'académie (SESSION_100, PLAYER_500, etc.) */
export type AcademyMilestone = {
  id             : string
  tenantId       : string
  milestoneCode  : string   // ex: 'SESSION_100'
  milestoneLabel : string   // ex: '100 séances validées'
  thresholdValue : number
  currentValue   : number
  reachedAt      : string | null  // null = pas encore atteint
  celebrated     : boolean        // false = pas encore célébré
  createdAt      : string
}

// ============================================================
// Story 59-3 — Leaderboard académie top 10
// ============================================================

/** LeaderboardEntry — entrée dans le classement XP de l'académie */
export type LeaderboardEntry = {
  rank        : number
  childId     : string
  displayName : string
  avatarUrl   : string | null
  totalXp     : number
  xpThisWeek  : number
  levelTier   : string
  evolution   : 'up' | 'down' | 'stable'
}

// ============================================================
// Story 59-5 — Quêtes hebdomadaires coaches
// ============================================================

/** CoachQuestStatus — statut d'une quête coach */
export type CoachQuestStatus = 'active' | 'completed' | 'expired'

/** CoachQuest — instance de quête hebdomadaire pour un coach */
export type CoachQuest = {
  id                 : string
  tenantId           : string
  coachId            : string
  questDefinitionId  : string
  status             : CoachQuestStatus
  currentValue       : number
  targetValue        : number
  periodStart        : string   // ISO date
  periodEnd          : string   // ISO date
  completedAt        : string | null
  createdAt          : string
}

/** CoachQuestWithDefinition — quête avec sa définition jointe */
export type CoachQuestWithDefinition = CoachQuest & {
  questDefinition: {
    code        : string
    name        : string
    description : string | null
    iconUrl     : string | null
    questType   : string
    xpReward    : number
  } | null
}

// ============================================================
// Migration 00141 — Exercices méthodologie (Story 34.3)
// ============================================================

/** MethodologyExercise — exercice pédagogique individuel (bibliothèque réutilisable) */
export type MethodologyExercise = {
  id          : string
  tenantId    : string
  method      : MethodologyMethod
  contextType : MethodologyContextType  // 'academie' | 'stage'
  title       : string
  trainingRef : number | null           // référence numérique (ex: 22)
  description : string | null
  pdfUrl      : string | null
  isActive    : boolean
  createdAt   : string
  updatedAt   : string
  deletedAt   : string | null
}

// ============================================================
// Migration 00142 — Programmes méthodologie (Story 34.4)
// ============================================================

/** MethodologyProgramme — programme pédagogique (regroupement d'entraînements sur une saison) */
export type MethodologyProgramme = {
  id            : string
  tenantId      : string
  method        : MethodologyMethod
  contextType   : MethodologyContextType  // 'academie' | 'stage'
  title         : string
  seasonId      : string | null
  seasonLabel   : string | null           // join depuis academy_seasons.label (ex: '2025-2026')
  totalSessions : number
  description   : string | null
  isActive      : boolean
  accomplishment: { done: number; total: number }  // done = sessions avec scheduled_date
  createdAt     : string
  updatedAt     : string
  deletedAt     : string | null
}

/** MethodologyProgrammeSession — lien entre un programme et un entraînement pédagogique */
export type MethodologyProgrammeSession = {
  id            : string
  programmeId   : string
  sessionId     : string
  scheduledDate : string | null  // DATE ISO
  position      : number
  createdAt     : string
}

/** MethodologyProgrammeSessionWithEntrainement — session join avec l'entraînement lié (Story 34.5) */
export type MethodologyProgrammeSessionWithEntrainement = {
  id            : string
  programmeId   : string
  sessionId     : string
  scheduledDate : string | null
  position      : number
  createdAt     : string
  entrainement  : {
    id    : string
    title : string
    method: MethodologyMethod
  }
}

/** MethodologyProgrammeWithSessions — programme + sessions détail (Story 34.5) */
export type MethodologyProgrammeWithSessions = MethodologyProgramme & {
  sessions: MethodologyProgrammeSessionWithEntrainement[]
}

// ============================================================
// Epic 85 — Registre Commercial Clubs (migration 00147)
// ============================================================

/** Contact commercial logué par un commercial pour un club de l'annuaire */
export type CommercialContact = {
  id             : string
  tenantId       : string
  clubDirectoryId: string
  commercialId   : string
  contactName    : string
  contactRole    : string | null
  status         : import('./enums').CommercialContactStatus
  note           : string | null
  contactedAt    : string
  createdAt      : string
  updatedAt      : string
  deletedAt      : string | null
}

/** CommercialContact enrichi du nom d'affichage du commercial */
export type CommercialContactWithCommercial = CommercialContact & {
  commercialDisplayName: string
}

/** Params création d'un contact commercial */
export type CreateCommercialContactParams = {
  clubDirectoryId: string
  contactName    : string
  contactRole?   : string
  status?        : import('./enums').CommercialContactStatus
  note?          : string
  contactedAt?   : string
}

/** Params mise à jour d'un contact commercial */
export type UpdateCommercialContactParams = {
  id      : string
  status? : import('./enums').CommercialContactStatus
  note?   : string
}

// ============================================================
// Epic 88 — Pipeline CRM Clubs Prospects (Story 88-2, migration 00161)
// ============================================================

/** ClubProspect — entrée pipeline CRM. Séparé de club_directory (annuaire).
 *  Epic 96 : clubDirectoryId = lien optionnel vers l'annuaire (NULL autorisé). */
export type ClubProspect = {
  id                    : string
  tenantId              : string
  clubName              : string
  city                  : string | null
  targetImplantationId  : string | null
  /** FK nullable vers club_directory(id). NULL = club hors annuaire (story 96.1). */
  clubDirectoryId       : string | null
  status                : import('./enums').ClubProspectStatus
  assignedCommercialId  : string
  source                : string | null
  notes                 : string | null
  createdAt             : string
  updatedAt             : string
  deletedAt             : string | null
}

/** Sous-set de club_directory utilisé pour enrichir les prospects (join léger). */
export type ClubProspectDirectorySummary = {
  id        : string
  nom       : string
  matricule : string | null
  ville     : string | null
  province  : import('./enums').BelgianProvince | null
  logoPath  : string | null
}

/** ProspectContact — contact rattaché à un club_prospects (multi-contacts par club) */
export type ProspectContact = {
  id              : string
  clubProspectId  : string
  firstName       : string
  lastName        : string
  role            : import('./enums').ClubContactRole
  email           : string | null
  phone           : string | null
  isDecisionnaire : boolean
  notes           : string | null
  createdAt       : string
  updatedAt       : string
  deletedAt       : string | null
}

/** ClubProspect enrichi des contacts + nom commercial assigné (vue liste/détail) */
export type ClubProspectWithContacts = ClubProspect & {
  contacts             : ProspectContact[]
  assignedDisplayName  : string | null
  /** Epic 96 : infos du club depuis club_directory si clubDirectoryId présent. */
  directory?           : ClubProspectDirectorySummary | null
}

/** Row agrégé pour la vue liste : nb contacts + décisionnaire (évite les contacts complets) */
export type ClubProspectListRow = ClubProspect & {
  contactsCount        : number
  decisionnaireName    : string | null
  assignedDisplayName  : string | null
  /** Epic 96 : infos du club depuis club_directory si clubDirectoryId présent. */
  directory?           : ClubProspectDirectorySummary | null
}

export type CreateClubProspectParams = {
  clubName              : string
  city?                 : string
  targetImplantationId? : string
  status?               : import('./enums').ClubProspectStatus
  source?               : string
  notes?                : string
  /** Admin seulement — commercial assigne à lui-même par défaut */
  assignedCommercialId? : string
  /** Epic 96 : lien vers club_directory (optionnel, NULL autorisé). */
  clubDirectoryId?      : string
}

export type UpdateClubProspectParams = {
  id                    : string
  clubName?             : string
  city?                 : string | null
  targetImplantationId? : string | null
  status?               : import('./enums').ClubProspectStatus
  source?               : string | null
  notes?                : string | null
  assignedCommercialId? : string
  clubDirectoryId?      : string | null
}

export type CreateProspectContactParams = {
  clubProspectId   : string
  firstName        : string
  lastName         : string
  role             : import('./enums').ClubContactRole
  email?           : string
  phone?           : string
  isDecisionnaire? : boolean
  notes?           : string
}

export type UpdateProspectContactParams = {
  id               : string
  firstName?       : string
  lastName?        : string
  role?            : import('./enums').ClubContactRole
  email?           : string | null
  phone?           : string | null
  isDecisionnaire? : boolean
  notes?           : string | null
}

// ============================================================
// Epic 88 — Story 88.3 : Historique actions commerciales (append-only)
// ============================================================

/** ProspectAction — entrée audit trail d'une action commerciale sur un prospect.
 *  Table append-only : jamais d'UPDATE ni DELETE. */
export type ProspectAction = {
  id                  : string
  clubProspectId      : string
  performedBy         : string
  actionType          : import('./enums').ProspectActionType
  description         : string | null
  createdAt           : string
  /** Enrichissement optionnel : display_name du performer (join profiles). */
  performerDisplayName: string | null
}

export type CreateProspectActionParams = {
  clubProspectId : string
  actionType     : import('./enums').ProspectActionType
  description?   : string
}

// ============================================================
// Epic 88 — Story 88.4 : Règles d'attribution commerciale
// ============================================================

/** Pourcentages d'attribution — clés libres, total attendu = 100 */
export type AttributionPercentages = {
  qualifier? : number
  closer?    : number
  [role: string]: number | undefined
}

/** Règle d'attribution — miroir de la table `attribution_rules` (migration 00164) */
export type AttributionRule = {
  id          : string
  tenantId    : string
  ruleName    : string
  description : string | null
  conditions  : Record<string, unknown>
  percentages : AttributionPercentages
  isDefault   : boolean
  createdAt   : string
  updatedAt   : string
  deletedAt   : string | null
}

/** Suggestion d'attribution à la conversion d'un prospect — basée sur les actions + règle par défaut */
export type AttributionSuggestion = {
  ruleApplied : AttributionRule
  commercials : Array<{
    commercialId        : string
    displayName         : string
    actionCount         : number
    suggestedPercentage : number
  }>
}

/** Résultat final stocké dans `club_prospects.attribution_result` à la conversion */
export type AttributionResult = {
  ruleId      : string
  commercials : Array<{
    id          : string
    displayName : string
    percentage  : number
  }>
}

export type CreateAttributionRuleParams = {
  ruleName     : string
  description? : string
  percentages  : AttributionPercentages
  isDefault?   : boolean
  conditions?  : Record<string, unknown>
}

export type UpdateAttributionRuleParams = {
  id           : string
  ruleName?    : string
  description? : string | null
  percentages? : AttributionPercentages
  isDefault?   : boolean
  conditions?  : Record<string, unknown>
}

// ============================================================
// Epic 88 — Story 88.5 : Ressources commerciales
// ============================================================

/** CommercialResource — miroir de la table `commercial_resources` (migration 00165) */
export type CommercialResource = {
  id           : string
  tenantId     : string
  resourceType : import('./enums').CommercialResourceType
  title        : string
  description  : string | null
  /** Chemin dans le bucket Storage `commercial-resources` (null si webpage ou pas encore uploadé) */
  filePath     : string | null
  /** URL externe pour le type `webpage` */
  externalUrl  : string | null
  fileSize     : number | null
  mimeType     : string | null
  uploadedBy   : string | null
  createdAt    : string
  updatedAt    : string
}

export type UpdateCommercialResourceParams = {
  id           : string
  title?       : string
  description? : string | null
  externalUrl? : string | null
}

// ============================================================
// Epic 86 — Permissions granulaires (Story 86-3, migrations 00150/00151)
// ============================================================

/**
 * SectionPermissionRow — défaut de permission par rôle × section (config globale).
 * Miroir de la table `section_permissions`. Pas de tenant_id (config plateforme).
 * Nommé `Row` pour éviter toute collision avec noms internes de hooks/API.
 */
export type SectionPermissionRow = {
  role       : UserRole
  sectionKey : SectionKey
  granted    : boolean
  updatedAt  : string         // ISO 8601
  updatedBy  : string | null
}

/**
 * UserSectionOverrideRow — override individuel rôle/section pour un utilisateur.
 * Miroir de la table `user_section_overrides`. Tenant-scoped via tenant_id (RLS).
 * Soft-delete via deletedAt — supprimer un override = réactiver le défaut de rôle.
 */
export type UserSectionOverrideRow = {
  profileId  : string
  sectionKey : SectionKey
  tenantId   : string
  granted    : boolean
  grantedAt  : string          // ISO 8601
  grantedBy  : string | null
  deletedAt  : string | null
}

/**
 * EffectivePermissions — résultat composé (rôle actif + overrides) pour un profil.
 * Clé = SectionKey, valeur = boolean granted. Consommé par la sidebar dynamique (86-4).
 */
export type EffectivePermissions = Record<SectionKey, boolean>

// Re-export des enums Permission pour les consommateurs de ces types
export type { SectionKey, PermissionAccess }

// ============================================================
// Epic 91 — Story 91.2 : Médiathèque
// ============================================================

/** MediaItem — miroir de la table `media_items` (migration 00168) */
export type MediaItem = {
  id              : string
  tenantId        : string
  uploadedBy      : string
  filePath        : string
  fileType        : import('./enums').MediaFileType
  title           : string
  description     : string | null
  status          : import('./enums').MediaItemStatus
  approvedBy      : string | null
  approvedAt      : string | null
  rejectionReason : string | null
  fileSize        : number | null
  mimeType        : string | null
  createdAt       : string
  updatedAt       : string
  deletedAt       : string | null
  /** Nom affiché de l'uploader (hydraté côté API via join profiles) */
  uploaderDisplayName? : string | null
}

export type CreateMediaItemParams = {
  title       : string
  description?: string | null
  fileType    : import('./enums').MediaFileType
  filePath    : string
  fileSize?   : number | null
  mimeType?   : string | null
}

