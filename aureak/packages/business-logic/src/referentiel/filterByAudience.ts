// Story 3.6 — Filtrage dynamique par audience
import type { TargetAudience } from '@aureak/types'

export type UserProfile = {
  role     : string
  ageGroup : string | null
  programs : string[]
}

export function filterByAudience<T extends { targetAudience: TargetAudience | Record<string, unknown> }>(
  items      : T[],
  userProfile: UserProfile
): T[] {
  return items.filter(item => {
    const audience = item.targetAudience as TargetAudience
    // Aucune restriction = universel
    if (!audience || Object.keys(audience).length === 0) return true

    // Vérifier le rôle
    if (audience.roles?.length && !audience.roles.includes(userProfile.role)) {
      return false
    }
    // Vérifier la tranche d'âge
    if (audience.age_groups?.length && userProfile.ageGroup &&
        !audience.age_groups.includes(userProfile.ageGroup)) {
      return false
    }
    // Vérifier les programmes (intersection — l'utilisateur doit être dans au moins 1 programme requis)
    if (audience.programs?.length) {
      const hasProgram = audience.programs.some(p => userProfile.programs.includes(p))
      if (!hasProgram) return false
    }
    return true
  })
}
