// @aureak/types — Enums TypeScript miroir des enums PostgreSQL
// RÈGLE ARCH-12 : tout enum PostgreSQL DOIT avoir son miroir ici.
// Les deux (DB + TS) sont mis à jour dans la même PR.
// Source DB : supabase/migrations/00002_create_enums.sql

/** Rôles utilisateur — miroir de l'enum PostgreSQL `user_role` (étendu en Story 2.5 avec 'club') */
export type UserRole = 'admin' | 'coach' | 'parent' | 'child' | 'club'

/** Niveaux d'accès clubs partenaires — miroir de l'enum PostgreSQL `club_access_level` */
export type ClubAccessLevel = 'partner' | 'common'

/** Statuts de présence terrain — miroir de l'enum PostgreSQL `attendance_status` */
export type AttendanceStatus = 'present' | 'absent' | 'injured' | 'late' | 'trial'

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
  | 'Décisionnel'
  | 'Intégration'
  | 'Perfectionnement'

/** Contexte d'utilisation d'une séance pédagogique */
export type MethodologyContextType = 'academie' | 'stage'

/** Niveau de difficulté d'une séance pédagogique (conservé en DB, non affiché dans le formulaire) */
export type MethodologyLevel = 'debutant' | 'intermediaire' | 'avance'

export const METHODOLOGY_METHODS: MethodologyMethod[] = [
  'Goal and Player', 'Technique', 'Situationnel', 'Décisionnel', 'Intégration', 'Perfectionnement',
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

export const METHODOLOGY_METHOD_COLOR: Record<MethodologyMethod, string> = {
  'Goal and Player' : '#FFB800',
  'Technique'       : '#4FC3F7',
  'Situationnel'    : '#66BB6A',
  'Décisionnel'     : '#CE93D8',
  'Intégration'     : '#F97316',
  'Perfectionnement': '#EC4899',
}
