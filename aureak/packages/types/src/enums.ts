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
