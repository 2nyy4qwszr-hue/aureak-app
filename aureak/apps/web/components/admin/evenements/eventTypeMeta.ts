// Métadonnées partagées des 5 types d'événements (label, picto, couleur, route).
import { colors } from '@aureak/theme'
import type { EventType } from '@aureak/types'

export type EventTypeMeta = {
  key   : EventType
  label : string
  picto : string
  color : string
  href  : string
}

export const EVENT_TYPE_META: Record<EventType, EventTypeMeta> = {
  stage     : { key: 'stage',      label: 'Stage',       picto: '🏕',  color: colors.accent.gold,    href: '/evenements/stages'      },
  tournoi   : { key: 'tournoi',    label: 'Tournoi',     picto: '🏆', color: colors.entity.club,    href: '/evenements/tournois'    },
  fun_day   : { key: 'fun_day',    label: 'Fun Day',     picto: '🎉', color: colors.status.success, href: '/evenements/fun-days'    },
  detect_day: { key: 'detect_day', label: 'Detect Day',  picto: '🔍', color: colors.accent.red,     href: '/evenements/detect-days' },
  seminaire : { key: 'seminaire',  label: 'Séminaire',   picto: '📚', color: colors.text.subtle,    href: '/evenements/seminaires'  },
}
