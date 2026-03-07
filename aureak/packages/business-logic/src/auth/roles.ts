// Helpers de rôle — UI uniquement
// RÈGLE : ces fonctions lisent useAuthStore et servent uniquement à masquer/afficher des éléments UI
// JAMAIS utilisées comme source d'autorité de sécurité — la RLS PostgreSQL est la seule autorité

import { useAuthStore } from '../stores/useAuthStore'

export function isAdmin(): boolean {
  return useAuthStore.getState().role === 'admin'
}

export function isCoach(): boolean {
  return useAuthStore.getState().role === 'coach'
}

export function isParent(): boolean {
  return useAuthStore.getState().role === 'parent'
}

export function isChild(): boolean {
  return useAuthStore.getState().role === 'child'
}

export function hasRole(role: string): boolean {
  return useAuthStore.getState().role === role
}
