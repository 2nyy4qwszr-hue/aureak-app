// Story 105.1 — Persistance localStorage des assignations Panini (par stage)
import type { CropState } from './types'

const STORAGE_PREFIX = 'aureak-panini-v1:'

export type PersistedAssignment = {
  enfantId       : string
  photoFileName  : string
  cropState      : CropState
  autoMatched    : boolean
}

export type PersistedState = {
  version    : 1
  stageId    : string | null
  assignments: PersistedAssignment[]
}

const DEFAULT_STATE: PersistedState = {
  version    : 1,
  stageId    : null,
  assignments: [],
}

function keyFor(stageId: string): string {
  return `${STORAGE_PREFIX}${stageId}`
}

export function loadState(stageId: string): PersistedState {
  try {
    const raw = localStorage.getItem(keyFor(stageId))
    if (!raw) return DEFAULT_STATE
    const parsed = JSON.parse(raw) as PersistedState
    if (parsed.version !== 1) return DEFAULT_STATE
    return parsed
  } catch {
    return DEFAULT_STATE
  }
}

export function saveState(stageId: string, state: PersistedState): void {
  try {
    localStorage.setItem(keyFor(stageId), JSON.stringify(state))
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') console.error('[panini/storage] saveState failed:', err)
  }
}

export function clearState(stageId: string): void {
  try {
    localStorage.removeItem(keyFor(stageId))
  } catch {
    // noop
  }
}
