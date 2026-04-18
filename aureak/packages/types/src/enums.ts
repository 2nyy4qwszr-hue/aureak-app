// @aureak/types — Enums TypeScript miroir des enums PostgreSQL
// RÈGLE ARCH-12 : tout enum PostgreSQL DOIT avoir son miroir ici.
// Les deux (DB + TS) sont mis à jour dans la même PR.
// Source DB : supabase/migrations/00002_create_enums.sql

/** Rôles utilisateur — miroir de l'enum PostgreSQL `user_role` (étendu en Story 2.5 avec 'club') */
export type UserRole = 'admin' | 'coach' | 'parent' | 'child' | 'club' | 'commercial'

/** Grades pédagogiques coach — miroir de l'enum PostgreSQL `coach_grade_level` (Story 11.1) */
export type CoachGradeLevel = 'bronze' | 'silver' | 'gold' | 'platinum'

/** Niveaux d'accès clubs partenaires — miroir de l'enum PostgreSQL `club_access_level` */
export type ClubAccessLevel = 'partner' | 'common'

/** Statuts de présence terrain — miroir de l'enum PostgreSQL `attendance_status` */
export type AttendanceStatus = 'present' | 'absent' | 'injured' | 'late' | 'trial' | 'unconfirmed'

/** Signaux d'évaluation coach — miroir de l'enum PostgreSQL `evaluation_signal` */
export type EvaluationSignal = 'positive' | 'attention' | 'none'

/** Statut de synchronisation offline — miroir de l'enum PostgreSQL `sync_status` */
export type SyncStatus = 'pending' | 'syncing' | 'synced' | 'failed'

/** Canaux de notification — miroir de l'enum PostgreSQL `notification_channel` */
export type NotificationChannel = 'push' | 'email' | 'sms'

/** Catégorie d'âge football — miroir de l'enum PostgreSQL `football_age_category` */
export type FootballAgeCategory =
  | 'U6'  | 'U7'  | 'U8'  | 'U9'  | 'U10'
  | 'U11' | 'U12' | 'U13' | 'U14' | 'U15'
  | 'U16' | 'U17' | 'U18' | 'U19' | 'U20' | 'U21'
  | 'Senior'

export const FOOTBALL_AGE_CATEGORIES: FootballAgeCategory[] = [
  'U6', 'U7', 'U8', 'U9', 'U10',
  'U11', 'U12', 'U13', 'U14', 'U15',
  'U16', 'U17', 'U18', 'U19', 'U20', 'U21',
  'Senior',
]

/** Niveau d'équipe football — miroir de l'enum PostgreSQL `football_team_level` */
export type FootballTeamLevel =
  | 'Provinciaux'
  | 'Interprovinciaux'
  | 'Régionaux'
  | 'Nationaux'
  | 'International'

export const FOOTBALL_TEAM_LEVELS: FootballTeamLevel[] = [
  'Provinciaux', 'Interprovinciaux', 'Régionaux', 'Nationaux', 'International',
]

/** 10 provinces belges — miroir de l'enum PostgreSQL `belgian_province` (migration 00033) */
export type BelgianProvince =
  | 'Anvers'
  | 'Brabant flamand'
  | 'Brabant wallon'
  | 'Flandre occidentale'
  | 'Flandre orientale'
  | 'Hainaut'
  | 'Liège'
  | 'Limbourg'
  | 'Luxembourg'
  | 'Namur'

export const BELGIAN_PROVINCES: BelgianProvince[] = [
  'Anvers',
  'Brabant flamand',
  'Brabant wallon',
  'Flandre occidentale',
  'Flandre orientale',
  'Hainaut',
  'Liège',
  'Limbourg',
  'Luxembourg',
  'Namur',
]

// ── Méthodologie pédagogique ──────────────────────────────────────────────────

/** Méthodes pédagogiques — utilisées dans methodology_sessions, methodology_themes, methodology_situations */
export type MethodologyMethod =
  | 'Goal and Player'
  | 'Technique'
  | 'Situationnel'
  | 'Performance'
  | 'Décisionnel'
  | 'Intégration'
  | 'Perfectionnement'

/** Contexte d'utilisation d'une séance pédagogique */
export type MethodologyContextType = 'academie' | 'stage'

/** Niveau de difficulté d'une séance pédagogique (conservé en DB, non affiché dans le formulaire) */
export type MethodologyLevel = 'debutant' | 'intermediaire' | 'avance'

export const METHODOLOGY_METHODS: MethodologyMethod[] = [
  'Goal and Player', 'Technique', 'Situationnel', 'Performance', 'Décisionnel', 'Intégration', 'Perfectionnement',
]

export const METHODOLOGY_CONTEXT_TYPES: MethodologyContextType[] = ['academie', 'stage']
export const METHODOLOGY_LEVELS: MethodologyLevel[] = ['debutant', 'intermediaire', 'avance']

export const METHODOLOGY_LEVEL_LABELS: Record<MethodologyLevel, string> = {
  debutant     : 'Débutant',
  intermediaire: 'Intermédiaire',
  avance       : 'Avancé',
}

export const METHODOLOGY_CONTEXT_LABELS: Record<MethodologyContextType, string> = {
  academie: 'Académie',
  stage   : 'Stage',
}

// METHODOLOGY_METHOD_COLOR déplacé vers @aureak/theme/tokens.ts (ARCH-10)
// Importer depuis : import { methodologyMethodColors } from '@aureak/theme'

// ── Theme Dossier Pédagogique (migration 00056) ───────────────────────────────
// Note : BadgeStage et ThemeResourceType sont définis dans entities.ts.
// Les constantes ici n'importent pas ces types pour éviter les dépendances circulaires ;
// les types sont inlinés directement.

export const BADGE_STAGES: ('Bronze' | 'Argent' | 'Or' | 'Elite' | 'Master')[] = [
  'Bronze', 'Argent', 'Or', 'Elite', 'Master',
]

export const THEME_RESOURCE_TYPE_LABELS: Record<'pdf_coach' | 'video_global' | 'image_global' | 'audio' | 'reference_media', string> = {
  pdf_coach      : 'PDF Coach',
  video_global   : 'Vidéo globale',
  image_global   : 'Image globale',
  audio          : 'Audio',
  reference_media: 'Média de référence',
}

export const THEME_AGE_CATEGORIES = ['U6','U8','U10','U12','U14','U16','U21','Senior'] as const
export type ThemeAgeCategory = typeof THEME_AGE_CATEGORIES[number]

// ── Sessions v2 (migration 00058) ─────────────────────────────────────────────

/** Type pédagogique d'une séance — miroir de l'enum PostgreSQL `session_type_v2` */
export type SessionType =
  | 'goal_and_player'
  | 'technique'
  | 'situationnel'
  | 'performance'
  | 'decisionnel'
  | 'perfectionnement'
  | 'integration'
  | 'equipe'

export const SESSION_TYPES: SessionType[] = [
  'goal_and_player', 'technique', 'situationnel', 'performance', 'decisionnel',
  'perfectionnement', 'integration', 'equipe',
]

export const SESSION_TYPE_LABELS: Record<SessionType, string> = {
  goal_and_player : 'Goal & Player',
  technique       : 'Technique',
  situationnel    : 'Situationnel',
  performance     : 'Performance',
  decisionnel     : 'Décisionnel',
  perfectionnement: 'Perfectionnement',
  integration     : 'Intégration',
  equipe          : 'Équipe',
}

/** Codes des blocs situationnels — utilisés dans content_ref des séances situationnelles */
export type SituationalBlocCode =
  | 'TAB'      // Tir au but
  | '1V1'      // Un contre un
  | 'BAL_AER'  // Balles aériennes
  | 'BAL_PROF' // Balles en profondeur
  | 'REL'      // Relances
  | 'PHA_ARR'  // Phases arrêtées
  | 'COMM'     // Communication / Autre

export const SITUATIONAL_BLOC_CODES: SituationalBlocCode[] = [
  'TAB', '1V1', 'BAL_AER', 'BAL_PROF', 'REL', 'PHA_ARR', 'COMM',
]

export const SITUATIONAL_BLOC_LABELS: Record<SituationalBlocCode, string> = {
  TAB     : 'Tir au but',
  '1V1'   : 'Un contre un',
  BAL_AER : 'Balles aériennes',
  BAL_PROF: 'Balles en profondeur',
  REL     : 'Relances',
  PHA_ARR : 'Phases arrêtées',
  COMM    : 'Communication / Autre',
}

// ── Migration 00083 — Classification niveau équipe & étoiles (Story 25.0) ──────

/** Type de joueur — dérivé de age_category (colonne générée, jamais saisie) */
export type PlayerType = 'youth' | 'senior'

/**
 * Alias de FootballAgeCategory pour le domaine classification (child_directory.age_category).
 * Identique à FootballAgeCategory — utilise le même enum PostgreSQL `football_age_category`.
 */
export type AgeCategory = FootballAgeCategory

/** Toutes les catégories d'âge utilisables pour la classification niveau équipe */
export const AGE_CATEGORIES: AgeCategory[] = FOOTBALL_AGE_CATEGORIES

/**
 * Niveau compétitif joueur jeune (youth) — valeurs saisies dans child_directory.youth_level
 * Mapping étoiles : Régional=1, Provincial=2, Inter=3, Élite 2=4, Élite 1=5
 */
export type YouthLevel = 'Régional' | 'Provincial' | 'Inter' | 'Élite 2' | 'Élite 1'

/**
 * Division compétitive joueur senior — valeurs saisies dans child_directory.senior_division
 * Mapping étoiles : P4/P3=1, P2/P1=2, D3/D2/D1 amateurs=3, D1B=4, D1A=5
 */
export type SeniorDivision =
  | 'P4' | 'P3'
  | 'P2' | 'P1'
  | 'D3 amateurs' | 'D2 amateurs' | 'D1 amateurs'
  | 'D1B' | 'D1A'

export const YOUTH_LEVELS: YouthLevel[] = [
  'Régional', 'Provincial', 'Inter', 'Élite 2', 'Élite 1',
]

export const SENIOR_DIVISIONS: SeniorDivision[] = [
  'P4', 'P3', 'P2', 'P1',
  'D3 amateurs', 'D2 amateurs', 'D1 amateurs',
  'D1B', 'D1A',
]

// ── Migration 00078 — Type de relation club ────────────────────────────────────

/** Type de relation d'un club avec l'académie Aureak — miroir de l'enum PostgreSQL `club_relation_type` */
export type ClubRelationType = 'partenaire' | 'associe' | 'normal'

export const CLUB_RELATION_TYPES: ClubRelationType[] = ['partenaire', 'associe', 'normal']

export const CLUB_RELATION_TYPE_LABELS: Record<ClubRelationType, string> = {
  partenaire: 'Partenaire',
  associe   : 'Club associé',
  normal    : 'Club normal',
}

// ── Epic 52 — Player Cards FUT-style (Story 52-1) ────────────────────────────

/**
 * PlayerTier — tier visuel FUT-style d'un joueur
 * 'Elite' est réservé pour story 52-2 (calcul automatique via stats)
 */
export type PlayerTier = 'Prospect' | 'Académicien' | 'Confirmé' | 'Elite'

/**
 * PLAYER_TIER_LABELS — mapping AcademyStatus → PlayerTier
 * Utilisé pour dériver le tier visuel FUT depuis le statut académie calculé.
 * Note : 'Elite' non assigné ici — story 52-2 le calculera via les stats.
 */
export const PLAYER_TIER_LABELS: Record<string, PlayerTier> = {
  NOUVEAU_ACADÉMICIEN: 'Prospect',
  ACADÉMICIEN        : 'Académicien',
  ANCIEN             : 'Confirmé',
  STAGE_UNIQUEMENT   : 'Prospect',
  PROSPECT           : 'Prospect',
}

// ── Story 58-6 — Niveau de difficulté des situations pédagogiques ─────────────

/** Labels de difficulté 1–5 pour les situations pédagogiques */
export const DIFFICULTY_LABELS: Record<number, string> = {
  1: 'Débutant',
  2: 'Facile',
  3: 'Intermédiaire',
  4: 'Avancé',
  5: 'Expert',
}

// ── Story 63.2 — Type d'évènement unifié ─────────────────────────────────────

/** Type d'évènement — miroir de l'enum PostgreSQL `event_type_enum` (migration 00135) */
export type EventType = 'stage' | 'tournoi' | 'fun_day' | 'detect_day' | 'seminaire'

export const EVENT_TYPES: EventType[] = [
  'stage', 'tournoi', 'fun_day', 'detect_day', 'seminaire',
]

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  stage      : 'Stage',
  tournoi    : 'Tournoi Goal à Goal',
  fun_day    : 'Fun Day',
  detect_day : 'Detect Day',
  seminaire  : 'Séminaire',
}

// ── Story 58-8 — Phases de séance pédagogique ────────────────────────────────

import type { MethodologyModuleType } from './entities'

/** Labels des phases pédagogiques */
export const MODULE_LABELS: Record<MethodologyModuleType, string> = {
  activation : 'Activation',
  development: 'Développement',
  conclusion : 'Conclusion',
}

/** Ordre canonique des phases */
export const MODULE_TYPES: MethodologyModuleType[] = ['activation', 'development', 'conclusion']

// ── Epic 85 — Registre Commercial Clubs ────────────────────────────────────

/** Statut d'un contact commercial — miroir de l'enum PostgreSQL `commercial_contact_status` */
export type CommercialContactStatus = 'premier_contact' | 'en_cours' | 'en_attente' | 'pas_de_suite'

/** Labels affichage UI des statuts commerciaux */
export const COMMERCIAL_CONTACT_STATUS_LABELS: Record<CommercialContactStatus, string> = {
  premier_contact: 'Premier contact',
  en_cours       : 'En cours',
  en_attente     : 'En attente',
  pas_de_suite   : 'Pas de suite',
}

// ── Story 88.2 — Pipeline CRM Clubs (migration 00148) ──────────────────────

/** Statut pipeline prospect — miroir de l'enum PostgreSQL `prospect_status` */
export type ProspectStatus =
  | 'premier_contact'
  | 'mapping_orga'
  | 'decisionnaire_identifie'
  | 'rdv_qualifie'
  | 'closing'
  | 'converti'
  | 'perdu'

export const PROSPECT_STATUSES: ProspectStatus[] = [
  'premier_contact', 'mapping_orga', 'decisionnaire_identifie',
  'rdv_qualifie', 'closing', 'converti', 'perdu',
]

export const PROSPECT_STATUS_LABELS: Record<ProspectStatus, string> = {
  premier_contact        : 'Premier contact',
  mapping_orga           : 'Mapping orga',
  decisionnaire_identifie: 'Décisionnaire identifié',
  rdv_qualifie           : 'RDV qualifié',
  closing                : 'Closing',
  converti               : 'Converti',
  perdu                  : 'Perdu',
}

/** Rôle d'un contact prospect — miroir de l'enum PostgreSQL `club_contact_role` */
export type ClubContactRole = 'entraineur' | 'directeur_sportif' | 'president' | 'secretaire' | 'autre'

export const CLUB_CONTACT_ROLES: ClubContactRole[] = [
  'entraineur', 'directeur_sportif', 'president', 'secretaire', 'autre',
]

export const CLUB_CONTACT_ROLE_LABELS: Record<ClubContactRole, string> = {
  entraineur       : 'Entraîneur',
  directeur_sportif: 'Directeur sportif',
  president        : 'Président',
  secretaire       : 'Secrétaire',
  autre            : 'Autre',
}

// ── Story 88.3 — Actions commerciales (migration 00149) ─────────────────────

/** Type d'action commerciale — miroir de l'enum PostgreSQL `prospect_action_type` */
export type ProspectActionType =
  | 'premier_contact'
  | 'relance'
  | 'identification_contact'
  | 'obtention_rdv'
  | 'presentation'
  | 'closing'
  | 'note'
  | 'changement_statut'

export const PROSPECT_ACTION_TYPES: ProspectActionType[] = [
  'premier_contact', 'relance', 'identification_contact', 'obtention_rdv',
  'presentation', 'closing', 'note', 'changement_statut',
]

export const PROSPECT_ACTION_TYPE_LABELS: Record<ProspectActionType, string> = {
  premier_contact       : 'Premier contact',
  relance               : 'Relance',
  identification_contact: 'Identification contact',
  obtention_rdv         : 'Obtention RDV',
  presentation          : 'Présentation',
  closing               : 'Closing',
  note                  : 'Note',
  changement_statut     : 'Changement de statut',
}

/** Icônes par type d'action (emoji pour le rendu timeline) */
export const PROSPECT_ACTION_TYPE_ICONS: Record<ProspectActionType, string> = {
  premier_contact       : '📞',
  relance               : '🔄',
  identification_contact: '🔍',
  obtention_rdv         : '📅',
  presentation          : '📊',
  closing               : '🤝',
  note                  : '📝',
  changement_statut     : '🔀',
}

// ── Story 89.1 — Statut prospect gardien (child_directory) ─────────────────

/** Statut prospect gardien — miroir de l'enum PostgreSQL `child_prospect_status` */
export type ChildProspectStatus =
  | 'identified'
  | 'contacted'
  | 'trial_scheduled'
  | 'trial_done'
  | 'converted'
  | 'lost'

export const CHILD_PROSPECT_STATUSES: ChildProspectStatus[] = [
  'identified', 'contacted', 'trial_scheduled', 'trial_done', 'converted', 'lost',
]

export const CHILD_PROSPECT_STATUS_LABELS: Record<ChildProspectStatus, string> = {
  identified     : 'Identifié',
  contacted      : 'Contacté',
  trial_scheduled: 'Test planifié',
  trial_done     : 'Test effectué',
  converted      : 'Converti',
  lost           : 'Perdu',
}

// ── Story 90.1 — Pipeline Entraîneurs (migration 00149) ────────────────────

/** Statut pipeline coach prospect — miroir de l'enum PostgreSQL `coach_prospect_status` */
export type CoachProspectStatus = 'identified' | 'contacted' | 'interview' | 'recruited'

export const COACH_PROSPECT_STATUSES: CoachProspectStatus[] = [
  'identified', 'contacted', 'interview', 'recruited',
]

export const COACH_PROSPECT_STATUS_LABELS: Record<CoachProspectStatus, string> = {
  identified: 'Identifié',
  contacted : 'Contacté',
  interview : 'Entretien',
  recruited : 'Recruté',
}
