// Zustand store — état d'authentification global
// RÈGLE : useAuthStore.role est pour l'UI uniquement — jamais source d'autorité de sécurité
// L'autorisation réelle est dans les policies RLS PostgreSQL
// Initialiser via _init() une seule fois dans le root _layout.tsx de chaque app

import { create } from 'zustand'
import { supabase, listUserRoles, setActiveRole as setActiveRoleApi } from '@aureak/api-client'
import type { Session, User } from '@aureak/api-client'
import type { UserRole, UserRoleAssignment } from '@aureak/types'

// ── localStorage key for persisted active role ─────────────────────────────
const ACTIVE_ROLE_KEY = 'aureak-active-role'

function getPersistedRole(): UserRole | null {
  try {
    return (localStorage.getItem(ACTIVE_ROLE_KEY) as UserRole) ?? null
  } catch {
    return null
  }
}

function persistRole(role: UserRole): void {
  try {
    localStorage.setItem(ACTIVE_ROLE_KEY, role)
  } catch { /* noop — SSR ou private mode */ }
}

type AuthState = {
  session       : Session | null
  user          : User | null
  role          : UserRole | null
  /** Tous les rôles assignés à l'utilisateur (Story 86.2) */
  availableRoles: UserRoleAssignment[]
  tenantId      : string | null
  isLoading     : boolean
  signOut       : () => Promise<void>
  /** Changer le rôle actif sans re-auth (Story 86.2 — AC3) */
  switchRole    : (role: UserRole) => Promise<void>
  /** Appeler UNE SEULE FOIS dans le root _layout.tsx */
  _init         : () => void
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session       : null,
  user          : null,
  role          : null,
  availableRoles: [],
  tenantId      : null,
  isLoading     : true,

  signOut: async () => {
    await supabase.auth.signOut()
    try { localStorage.removeItem(ACTIVE_ROLE_KEY) } catch { /* noop */ }
    set({ session: null, user: null, role: null, availableRoles: [], tenantId: null })
  },

  switchRole: async (newRole: UserRole) => {
    const { user, availableRoles } = get()
    if (!user) return

    // Vérifier que le rôle est dans la liste des rôles assignés
    const hasRole = availableRoles.some(r => r.role === newRole)
    if (!hasRole) {
      if (process.env.NODE_ENV !== 'production') console.error('[useAuthStore] switchRole: role not in availableRoles:', newRole)
      return
    }

    // Optimistic update — changer immédiatement côté UI (AC3)
    set({ role: newRole })
    persistRole(newRole)

    // Persister côté DB (best-effort, non-bloquant)
    setActiveRoleApi(user.id, newRole).catch((err) => {
      if (process.env.NODE_ENV !== 'production') console.error('[useAuthStore] switchRole DB sync error:', err)
    })
  },

  _init: () => {
    // Résoudre role + tenantId depuis la session (JWT ou profil en fallback)
    const resolveRole = async (session: import('@supabase/supabase-js').Session | null) => {
      let role     = (session?.user?.app_metadata?.role     as UserRole) ?? null
      let tenantId = (session?.user?.app_metadata?.tenant_id as string)  ?? null

      // Fallback : Custom Access Token Hook pas encore configuré → lire profiles
      if (session && (!role || !tenantId)) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('user_role, tenant_id')
          .eq('user_id', session.user.id)
          .single()
        if (profile) {
          role     = role     ?? (profile.user_role as UserRole)
          tenantId = tenantId ?? profile.tenant_id
        }
      }
      return { role, tenantId }
    }

    // Charger les rôles multi-role + appliquer le rôle persisté
    const resolveMultiRoles = async (session: import('@supabase/supabase-js').Session | null, fallbackRole: UserRole | null) => {
      if (!session) return { availableRoles: [] as UserRoleAssignment[], activeRole: fallbackRole }

      const roles = await listUserRoles(session.user.id)

      if (roles.length === 0) {
        // Pas encore de rôles dans user_roles — utiliser le rôle profile comme seul rôle
        return { availableRoles: [] as UserRoleAssignment[], activeRole: fallbackRole }
      }

      // Déterminer le rôle actif : localStorage > is_primary > premier rôle
      const persistedRole = getPersistedRole()
      const persistedMatch = persistedRole ? roles.find(r => r.role === persistedRole) : null
      const primaryRole = roles.find(r => r.isPrimary)

      let activeRole: UserRole
      if (persistedMatch) {
        activeRole = persistedMatch.role
      } else if (primaryRole) {
        activeRole = primaryRole.role
      } else {
        activeRole = roles[0].role
      }

      return { availableRoles: roles, activeRole }
    }

    // Initialisation depuis la session persistée
    supabase.auth.getSession()
      .then(async ({ data: { session } }) => {
        const { role, tenantId } = await resolveRole(session)
        const { availableRoles, activeRole } = await resolveMultiRoles(session, role)

        const finalRole = activeRole ?? role
        if (finalRole) persistRole(finalRole)

        set({
          session,
          user          : session?.user ?? null,
          role          : finalRole,
          availableRoles,
          tenantId,
          isLoading     : false,
        })
      })
      .catch((err) => {
        if (process.env.NODE_ENV !== 'production') console.error('[useAuthStore] getSession error:', err)
        set({ session: null, user: null, role: null, availableRoles: [], tenantId: null, isLoading: false })
      })

    // Listener temps réel : connexion / déconnexion / token refresh
    supabase.auth.onAuthStateChange(async (_event, session) => {
      const { role, tenantId } = await resolveRole(session)

      // Déconnexion forcée si session active mais profil introuvable
      if (session && !role) {
        supabase.auth.signOut()
        set({ session: null, user: null, role: null, availableRoles: [], tenantId: null, isLoading: false })
        return
      }

      const { availableRoles, activeRole } = await resolveMultiRoles(session, role)
      const finalRole = activeRole ?? role
      if (finalRole) persistRole(finalRole)

      set({
        session,
        user          : session?.user ?? null,
        role          : finalRole,
        availableRoles,
        tenantId,
        isLoading     : false,
      })
    })
  },
}))
