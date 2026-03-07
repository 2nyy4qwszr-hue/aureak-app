// Story 5.1 — Schéma SQLite local (miroir minimal offline-first)
import * as SQLite from 'expo-sqlite'

let _db: SQLite.SQLiteDatabase | null = null

export async function initLocalDB(): Promise<SQLite.SQLiteDatabase> {
  if (_db) return _db

  const db = await SQLite.openDatabaseAsync('aureak-local.db')

  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS local_sessions (
      id                      TEXT PRIMARY KEY,
      tenant_id               TEXT NOT NULL,
      group_id                TEXT NOT NULL,
      scheduled_at            TEXT NOT NULL,
      status                  TEXT NOT NULL DEFAULT 'planifiée',
      attendance_started_at   TEXT,
      attendance_completed_at TEXT,
      synced_at               TEXT
    );

    CREATE TABLE IF NOT EXISTS local_session_attendees (
      session_id TEXT NOT NULL,
      child_id   TEXT NOT NULL,
      child_name TEXT NOT NULL,
      PRIMARY KEY (session_id, child_id)
    );

    CREATE TABLE IF NOT EXISTS local_attendances (
      id           TEXT PRIMARY KEY,
      session_id   TEXT NOT NULL,
      child_id     TEXT NOT NULL,
      status       TEXT NOT NULL,
      recorded_by  TEXT NOT NULL,
      recorded_at  TEXT NOT NULL,
      operation_id TEXT NOT NULL UNIQUE,
      synced       INTEGER NOT NULL DEFAULT 0
    );

    CREATE INDEX IF NOT EXISTS la_session_idx ON local_attendances (session_id);
    CREATE INDEX IF NOT EXISTS la_synced_idx  ON local_attendances (synced, session_id);

    CREATE TABLE IF NOT EXISTS local_sync_queue (
      id           TEXT PRIMARY KEY,
      operation_id TEXT NOT NULL UNIQUE,
      entity_type  TEXT NOT NULL,
      payload      TEXT NOT NULL,
      status       TEXT NOT NULL DEFAULT 'pending',
      retry_count  INTEGER NOT NULL DEFAULT 0,
      last_error   TEXT,
      created_at   TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS lsq_status ON local_sync_queue (status, created_at);
  `)

  _db = db
  return db
}

export function getLocalDB(): SQLite.SQLiteDatabase {
  if (!_db) throw new Error('Local DB not initialized. Call initLocalDB() first.')
  return _db
}
