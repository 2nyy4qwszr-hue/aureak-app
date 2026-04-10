import { colors } from '@aureak/theme'

// Palette conforme design system AUREAK — or + émeraude + rouge + ambre + zinc + dark
// Aucun violet (#8B5CF6) ni bleu (#3B82F6) — couleurs hors charte AUREAK
const AVATAR_COLORS = [
  colors.accent.gold,      // or AUREAK   #C1AC5C
  colors.status.success,   // émeraude    #10B981
  colors.status.errorStrong,       // rouge CTA   #E05252
  colors.status.warning,   // ambre       #F59E0B
  colors.text.muted,       // zinc        #71717A
  colors.dark.surface,     // ardoise     #2A2827
  colors.dark.elevated,    // dark élévé  #332F2D
]

export function avatarBgColor(id: string): string {
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}
