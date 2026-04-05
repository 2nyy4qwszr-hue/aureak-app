// @aureak/api-client — Méthodologie pédagogique
// Migration 00050 — methodology_themes, methodology_situations, methodology_sessions

import { supabase } from './supabase'
import type {
  MethodologyTheme, MethodologySituation, MethodologySession,
  MethodologyMethod, MethodologyContextType, MethodologyLevel,
  DiagramData,
} from '@aureak/types'

// ── Row mappers ───────────────────────────────────────────────────────────────

function str(v: unknown): string | null { return (v as string | null) ?? null }

function mapTheme(row: Record<string, unknown>): MethodologyTheme {
  return {
    id            : row.id        as string,
    tenantId      : row.tenant_id as string,
    title         : row.title     as string,
    bloc          : str(row.bloc),
    method        : str(row.method)          as MethodologyMethod | null,
    description   : str(row.description),
    corrections   : str(row.corrections),
    coachingPoints: str(row.coaching_points),
    isActive      : row.is_active as boolean,
    deletedAt     : str(row.deleted_at),
    createdAt     : row.created_at as string,
    updatedAt     : row.updated_at as string,
  }
}

function mapSituation(row: Record<string, unknown>): MethodologySituation {
  return {
    id            : row.id        as string,
    tenantId      : row.tenant_id as string,
    title         : row.title     as string,
    method        : str(row.method)  as MethodologyMethod | null,
    description   : str(row.description),
    corrections   : str(row.corrections),
    commonMistakes: str(row.common_mistakes),
    themeId       : str(row.theme_id),
    diagramJson   : (row.diagram_json as DiagramData | null) ?? null,   // Story 58-2
    isActive      : row.is_active as boolean,
    deletedAt     : str(row.deleted_at),
    createdAt     : row.created_at as string,
    updatedAt     : row.updated_at as string,
  }
}

function mapSession(row: Record<string, unknown>): MethodologySession {
  return {
    id           : row.id         as string,
    tenantId     : row.tenant_id  as string,
    title        : row.title      as string,
    method       : str(row.method)       as MethodologyMethod      | null,
    contextType  : str(row.context_type) as MethodologyContextType | null,
    moduleName   : str(row.module_name),
    trainingRef  : str(row.training_ref),
    description  : str(row.description),
    pdfUrl       : str(row.pdf_url),
    plateauUrl   : str(row.plateau_url),
    videoUrl     : str(row.video_url),
    audioUrl     : str(row.audio_url),
    objective    : str(row.objective),
    level        : str(row.level)        as MethodologyLevel       | null,
    notes        : str(row.notes),
    modules      : (row.modules as Array<{ num: number; titre: string; range: string }> | null) ?? null,
    isActive     : row.is_active  as boolean,
    deletedAt    : str(row.deleted_at),
    createdAt    : row.created_at as string,
    updatedAt    : row.updated_at as string,
    sessionsCount: typeof row.sessions_count === 'number' ? row.sessions_count : undefined,
  }
}

// ── Thèmes ────────────────────────────────────────────────────────────────────

export type CreateMethodologyThemeParams = {
  tenantId       : string
  title          : string
  bloc?          : string | null
  method?        : string | null
  description?   : string | null
  corrections?   : string | null
  coachingPoints?: string | null
}

export async function listMethodologyThemes(
  opts: { method?: string; activeOnly?: boolean } = {},
): Promise<MethodologyTheme[]> {
  let q = supabase
    .from('methodology_themes')
    .select('*')
    .is('deleted_at', null)
    .order('title', { ascending: true })

  if (opts.method)              q = q.eq('method', opts.method)
  if (opts.activeOnly !== false) q = q.eq('is_active', true)

  const { data, error } = await q
  if (error) return []
  return (data ?? []).map(r => mapTheme(r as Record<string, unknown>))
}

export async function getMethodologyTheme(id: string): Promise<MethodologyTheme | null> {
  const { data, error } = await supabase
    .from('methodology_themes')
    .select('*')
    .eq('id', id)
    .single()
  if (error && (error as { code?: string }).code !== 'PGRST116') throw error
  if (!data) return null
  return mapTheme(data as Record<string, unknown>)
}

export async function createMethodologyTheme(
  params: CreateMethodologyThemeParams,
): Promise<{ data: MethodologyTheme | null; error: unknown }> {
  const { data, error } = await supabase
    .from('methodology_themes')
    .insert({
      tenant_id      : params.tenantId,
      title          : params.title,
      bloc           : params.bloc           ?? null,
      method         : params.method         ?? null,
      description    : params.description    ?? null,
      corrections    : params.corrections    ?? null,
      coaching_points: params.coachingPoints ?? null,
    })
    .select()
    .single()

  if (error || !data) return { data: null, error }
  return { data: mapTheme(data as Record<string, unknown>), error: null }
}

export async function updateMethodologyTheme(
  id: string,
  patch: Partial<Omit<CreateMethodologyThemeParams, 'tenantId'>>,
): Promise<{ error: unknown }> {
  const u: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (patch.title          !== undefined) u.title           = patch.title
  if (patch.bloc           !== undefined) u.bloc            = patch.bloc
  if (patch.method         !== undefined) u.method          = patch.method
  if (patch.description    !== undefined) u.description     = patch.description
  if (patch.corrections    !== undefined) u.corrections     = patch.corrections
  if (patch.coachingPoints !== undefined) u.coaching_points = patch.coachingPoints

  const { error } = await supabase.from('methodology_themes').update(u).eq('id', id)
  return { error: error ?? null }
}

export async function toggleMethodologyTheme(
  id: string,
  isActive: boolean,
): Promise<{ error: unknown }> {
  const { error } = await supabase
    .from('methodology_themes')
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq('id', id)
  return { error: error ?? null }
}

// ── Situations ────────────────────────────────────────────────────────────────

export type CreateMethodologySituationParams = {
  tenantId       : string
  title          : string
  method?        : string | null
  description?   : string | null
  corrections?   : string | null
  commonMistakes?: string | null
  themeId?       : string | null
  diagramJson?   : DiagramData | null   // Story 58-2
}

export async function listMethodologySituations(
  opts: { method?: string; themeId?: string; activeOnly?: boolean } = {},
): Promise<MethodologySituation[]> {
  let q = supabase
    .from('methodology_situations')
    .select('*')
    .is('deleted_at', null)
    .order('title', { ascending: true })

  if (opts.method)              q = q.eq('method', opts.method)
  if (opts.themeId)             q = q.eq('theme_id', opts.themeId)
  if (opts.activeOnly !== false) q = q.eq('is_active', true)

  const { data, error } = await q
  if (error) return []
  return (data ?? []).map(r => mapSituation(r as Record<string, unknown>))
}

export async function getMethodologySituation(id: string): Promise<MethodologySituation | null> {
  const { data, error } = await supabase
    .from('methodology_situations')
    .select('*')
    .eq('id', id)
    .single()
  if (error && (error as { code?: string }).code !== 'PGRST116') throw error
  if (!data) return null
  return mapSituation(data as Record<string, unknown>)
}

export async function createMethodologySituation(
  params: CreateMethodologySituationParams,
): Promise<{ data: MethodologySituation | null; error: unknown }> {
  const { data, error } = await supabase
    .from('methodology_situations')
    .insert({
      tenant_id      : params.tenantId,
      title          : params.title,
      method         : params.method         ?? null,
      description    : params.description    ?? null,
      corrections    : params.corrections    ?? null,
      common_mistakes: params.commonMistakes ?? null,
      theme_id       : params.themeId        ?? null,
    })
    .select()
    .single()

  if (error || !data) return { data: null, error }
  return { data: mapSituation(data as Record<string, unknown>), error: null }
}

export async function updateMethodologySituation(
  id: string,
  patch: Partial<Omit<CreateMethodologySituationParams, 'tenantId'>>,
): Promise<{ error: unknown }> {
  const u: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (patch.title          !== undefined) u.title           = patch.title
  if (patch.method         !== undefined) u.method          = patch.method
  if (patch.description    !== undefined) u.description     = patch.description
  if (patch.corrections    !== undefined) u.corrections     = patch.corrections
  if (patch.commonMistakes !== undefined) u.common_mistakes = patch.commonMistakes
  if (patch.themeId        !== undefined) u.theme_id        = patch.themeId
  if (patch.diagramJson    !== undefined) u.diagram_json    = patch.diagramJson   // Story 58-2

  const { error } = await supabase.from('methodology_situations').update(u).eq('id', id)
  return { error: error ?? null }
}

export async function toggleMethodologySituation(
  id: string,
  isActive: boolean,
): Promise<{ error: unknown }> {
  const { error } = await supabase
    .from('methodology_situations')
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq('id', id)
  return { error: error ?? null }
}

// ── Séances pédagogiques ──────────────────────────────────────────────────────

export type MethodologyModule = { num: number; titre: string; range: string }

export type CreateMethodologySessionParams = {
  tenantId    : string
  title       : string
  method?     : string | null
  contextType?: string | null
  moduleName? : string | null
  trainingRef?: string | null
  objective?  : string | null
  level?      : string | null
  pdfUrl?     : string | null
  videoUrl?   : string | null
  audioUrl?   : string | null
  description?: string | null
  notes?      : string | null
  modules?    : MethodologyModule[] | null
}

export async function listMethodologySessions(
  opts: { method?: string; contextType?: string; activeOnly?: boolean } = {},
): Promise<MethodologySession[]> {
  let q = supabase
    .from('methodology_sessions')
    .select('*, sessions(count)')
    .is('deleted_at', null)
    .order('title', { ascending: true })

  if (opts.method)               q = q.eq('method', opts.method)
  if (opts.contextType)          q = q.eq('context_type', opts.contextType)
  if (opts.activeOnly !== false)  q = q.eq('is_active', true)

  const { data, error } = await q
  if (error) return []
  return (data ?? []).map(r => {
    const row = r as Record<string, unknown>
    // sessions est un tableau [{count: N}] retourné par Supabase avec aggregate
    const sessionsArr = row.sessions as Array<{ count: number }> | null | undefined
    const sessionsCount = Array.isArray(sessionsArr) && sessionsArr.length > 0
      ? sessionsArr[0].count
      : 0
    return mapSession({ ...row, sessions_count: sessionsCount })
  })
}

export async function getMethodologySession(id: string): Promise<MethodologySession | null> {
  const { data, error } = await supabase
    .from('methodology_sessions')
    .select('*')
    .eq('id', id)
    .single()
  if (error && (error as { code?: string }).code !== 'PGRST116') throw error
  if (!data) return null
  return mapSession(data as Record<string, unknown>)
}

export async function createMethodologySession(
  params: CreateMethodologySessionParams,
): Promise<{ data: MethodologySession | null; error: unknown }> {
  const { data, error } = await supabase
    .from('methodology_sessions')
    .insert({
      tenant_id   : params.tenantId,
      title       : params.title,
      method      : params.method      ?? null,
      context_type: params.contextType ?? null,
      module_name : params.moduleName  ?? null,
      training_ref: params.trainingRef ?? null,
      objective   : params.objective   ?? null,
      level       : params.level       ?? null,
      pdf_url     : params.pdfUrl      ?? null,
      video_url   : params.videoUrl    ?? null,
      audio_url   : params.audioUrl    ?? null,
      description : params.description ?? null,
      notes       : params.notes       ?? null,
      modules     : params.modules     ?? null,
    })
    .select()
    .single()

  if (error || !data) return { data: null, error }
  return { data: mapSession(data as Record<string, unknown>), error: null }
}

export async function updateMethodologySession(
  id: string,
  patch: Partial<Omit<CreateMethodologySessionParams, 'tenantId'>>,
): Promise<{ error: unknown }> {
  const u: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (patch.title       !== undefined) u.title        = patch.title
  if (patch.method      !== undefined) u.method       = patch.method
  if (patch.contextType !== undefined) u.context_type = patch.contextType
  if (patch.moduleName  !== undefined) u.module_name  = patch.moduleName
  if (patch.trainingRef !== undefined) u.training_ref = patch.trainingRef
  if (patch.objective   !== undefined) u.objective    = patch.objective
  if (patch.level       !== undefined) u.level        = patch.level
  if (patch.pdfUrl      !== undefined) u.pdf_url      = patch.pdfUrl
  if (patch.videoUrl    !== undefined) u.video_url    = patch.videoUrl
  if (patch.audioUrl    !== undefined) u.audio_url    = patch.audioUrl
  if (patch.description !== undefined) u.description  = patch.description
  if (patch.notes       !== undefined) u.notes        = patch.notes
  if (patch.modules     !== undefined) u.modules      = patch.modules

  const { error } = await supabase.from('methodology_sessions').update(u).eq('id', id)
  return { error: error ?? null }
}

export async function toggleMethodologySession(
  id: string,
  isActive: boolean,
): Promise<{ error: unknown }> {
  const { error } = await supabase
    .from('methodology_sessions')
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq('id', id)
  return { error: error ?? null }
}

export async function softDeleteMethodologySession(id: string): Promise<void> {
  const { error } = await supabase
    .from('methodology_sessions')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}

// ── Liaisons séance pédagogique ↔ thèmes ─────────────────────────────────────

export async function linkMethodologySessionTheme(
  sessionId: string,
  themeId: string,
  sortOrder = 0,
): Promise<{ error: unknown }> {
  const { error } = await supabase
    .from('methodology_session_themes')
    .insert({ session_id: sessionId, theme_id: themeId, sort_order: sortOrder })
  return { error: error ?? null }
}

export async function unlinkMethodologySessionTheme(
  sessionId: string,
  themeId: string,
): Promise<{ error: unknown }> {
  const { error } = await supabase
    .from('methodology_session_themes')
    .delete()
    .eq('session_id', sessionId)
    .eq('theme_id', themeId)
  return { error: error ?? null }
}

export async function listMethodologySessionThemes(
  sessionId: string,
): Promise<MethodologyTheme[]> {
  const { data } = await supabase
    .from('methodology_session_themes')
    .select('theme_id, methodology_themes(*)')
    .eq('session_id', sessionId)
    .order('sort_order', { ascending: true })

  return (data ?? []).flatMap(row => {
    const r = row as Record<string, unknown>
    const t = r.methodology_themes
    if (!t) return []
    return [mapTheme(t as Record<string, unknown>)]
  })
}

// ── Liaisons séance pédagogique ↔ situations ─────────────────────────────────

export async function linkMethodologySessionSituation(
  sessionId: string,
  situationId: string,
  sortOrder = 0,
): Promise<{ error: unknown }> {
  const { error } = await supabase
    .from('methodology_session_situations')
    .insert({ session_id: sessionId, situation_id: situationId, sort_order: sortOrder })
  return { error: error ?? null }
}

export async function unlinkMethodologySessionSituation(
  sessionId: string,
  situationId: string,
): Promise<{ error: unknown }> {
  const { error } = await supabase
    .from('methodology_session_situations')
    .delete()
    .eq('session_id', sessionId)
    .eq('situation_id', situationId)
  return { error: error ?? null }
}

export async function listMethodologySessionSituations(
  sessionId: string,
): Promise<MethodologySituation[]> {
  const { data } = await supabase
    .from('methodology_session_situations')
    .select('situation_id, methodology_situations(*)')
    .eq('session_id', sessionId)
    .order('sort_order', { ascending: true })

  return (data ?? []).flatMap(row => {
    const r = row as Record<string, unknown>
    const s = r.methodology_situations
    if (!s) return []
    return [mapSituation(s as Record<string, unknown>)]
  })
}

// ── Story 58-4 — Thème de la semaine (rotation cyclique ISO week) ─────────────

/**
 * Calcule le numéro de semaine ISO pour une date donnée.
 * Semaine 1 = semaine contenant le premier jeudi de l'année.
 */
function getISOWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
}

/**
 * Retourne le thème pédagogique recommandé pour la semaine ISO courante.
 * Rotation cyclique sur la liste des thèmes actifs triés par titre.
 */
export async function getThemeOfWeek(): Promise<{
  data      : MethodologyTheme | null
  weekNumber: number
  error     : unknown
}> {
  try {
    const themes = await listMethodologyThemes({ activeOnly: true })
    if (!themes || themes.length === 0) return { data: null, weekNumber: 0, error: null }
    const weekNumber = getISOWeekNumber(new Date())
    const themeIndex = (weekNumber - 1) % themes.length
    return { data: themes[themeIndex], weekNumber, error: null }
  } catch (err) {
    if (process.env.NODE_ENV !== 'production')
      console.error('[getThemeOfWeek] error:', err)
    return { data: null, weekNumber: 0, error: err }
  }
}

// ── Story 58-3 — Drag situation vers séance pédagogique ───────────────────────

/**
 * Associe une situation à une séance pédagogique (idempotent via upsert).
 * Utilisé par le drag & drop depuis la bibliothèque.
 */
export async function addSituationToSession(
  sessionId  : string,
  situationId: string,
): Promise<{ error: unknown }> {
  const { error } = await supabase
    .from('methodology_session_situations')
    .upsert(
      { session_id: sessionId, situation_id: situationId },
      { onConflict: 'session_id,situation_id' },
    )
  if (error && process.env.NODE_ENV !== 'production')
    console.error('[addSituationToSession] error:', error)
  return { error: error ?? null }
}
