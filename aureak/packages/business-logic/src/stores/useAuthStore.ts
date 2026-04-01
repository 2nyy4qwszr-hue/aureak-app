// Zustand store — état d'authentification global
// RÈGLE : useAuthStore.role est pour l'UI uniquement — jamais source d'autorité de sécurité
// L'autorisation réelle est dans les policies RLS PostgreSQL
// Initialiser via _init() une seule fois dans le root _layout.tsx de chaque app

import { create } from 'zustand'
import { supabase } from '@aureak/api-client'
import type { Session, User } from '@aureak/api-client'
import type { UserRole } from '@aureak/types'

type AuthState = {
  session  : Session | null
  user     : User | null
  role     : UserRole | null
  tenantId : string | null
  isLoading: boolean
  signOut  : () => Promise<void>
  /** Appeler UNE SEULE FOIS dans le root _layout.tsx */
  _init    : () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  session  : null,
  user     : null,
  role     : null,
  tenantId : null,
  isLoading: true,

  signOut: async () => {
    await supabase.auth.signOut()
    set({ session: null, user: null, role: null, tenantId: null })
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

    // Initialisation depuis la session persistée
    supabase.auth.getSession()
      .then(async ({ data: { session } }) => {
        const { role, tenantId } = await resolveRole(session)
        set({
          session,
          user     : session?.user ?? null,
          role,
          tenantId,
          isLoading: false,
        })
      })
      .catch(() => {
        set({ session: null, user: null, role: null, tenantId: null, isLoading: false })
      })

    // Listener temps réel : connexion / déconnexion / token refresh
    supabase.auth.onAuthStateChange(async (_event, session) => {
      const { role, tenantId } = await resolveRole(session)

      // Déconnexion forcée si session active mais profil introuvable
      if (session && !role) {
        supabase.auth.signOut()
        set({ session: null, user: null, role: null, tenantId: null, isLoading: false })
        return
      }

      set({
        session,
        user: session?.user ?? null,
        role,
        tenantId,
        isLoading: false,
      })
    })
  },
}))
