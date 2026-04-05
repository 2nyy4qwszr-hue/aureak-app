// @aureak/ui — Composants UI partagés AUREAK
// RÈGLE : aucune valeur hardcodée — toujours via @aureak/theme/tokens

export { Button, AureakButton } from './components/Button'
export type { ButtonProps, ButtonVariant } from './components/Button'

export { Text, AureakText } from './components/Text'
export type { AureakTextProps, TextVariant } from './components/Text'

export { Card } from './components/Card'
export type { CardProps, CardVariant } from './components/Card'

export { Input } from './components/Input'
export type { InputProps, InputVariant } from './components/Input'

export { Badge } from './components/Badge'
export type { BadgeProps, BadgeVariant } from './components/Badge'

export { IndicatorToggle } from './components/IndicatorToggle'
export type { IndicatorToggleProps, IndicatorValue } from './components/IndicatorToggle'

export { StarToggle } from './components/StarToggle'
export type { StarToggleProps } from './components/StarToggle'

export { HierarchyBreadcrumb } from './components/HierarchyBreadcrumb'
export type { HierarchyBreadcrumbProps, BreadcrumbItem } from './components/HierarchyBreadcrumb'

export { SyncStatusBanner } from './components/SyncStatusBanner'

export { EmptyState } from './components/EmptyState'
export { ConfirmDialog } from './components/ConfirmDialog'
export { DetailSkeleton, ListRowSkeleton, CardSkeleton } from './components/Skeleton'

export { PlayerCard, avatarBgColor } from './PlayerCard'
export type { PlayerCardProps, PlayerTier } from './PlayerCard'

export { XPBar } from './XPBar'
export type { XPBarProps } from './XPBar'

export { BadgeGrid } from './BadgeGrid'
export type { BadgeGridProps, BadgeItem } from './BadgeGrid'

export { RadarChart } from './RadarChart'
export type { RadarChartProps } from './RadarChart'

// Story 54-2 — Toggle neumorphique présent/absent
export { AttendanceToggle } from './AttendanceToggle'
export type { AttendanceToggleProps } from './AttendanceToggle'

// Story 54-6 — Heatmap mensuelle présences joueur
export { AttendanceHeatmap } from './AttendanceHeatmap'
export type { AttendanceHeatmapProps } from './AttendanceHeatmap'

// Story 55-1 — Card FUT-style note centrale
export { EvaluationCard, evalTier, signalScore } from './EvaluationCard'
export type { EvaluationCardProps, EvaluationTier } from './EvaluationCard'

// Story 55-2 — Radar chart comparaison 2 joueurs
export { ComparisonRadarChart } from './ComparisonRadarChart'
export type { ComparisonRadarChartProps, RadarPlayer } from './ComparisonRadarChart'

// Story 55-3 — Timeline croissance joueur
export { GrowthChart } from './GrowthChart'
export type { GrowthChartProps } from './GrowthChart'

// Story 55-4 — Badge "Meilleure séance" avec animation spring
export { BestSessionBadge } from './BestSessionBadge'
export type { BestSessionBadgeProps } from './BestSessionBadge'

// Story 55-8 — Tile "Joueur de la semaine"
export { PlayerOfWeekTile } from './PlayerOfWeekTile'
export type { PlayerOfWeekTileProps } from './PlayerOfWeekTile'

// Story 56-1 — Card team sheet groupe avec mini-terrain SVG
export { GroupCard } from './GroupCard'
export type { GroupCardProps } from './GroupCard'

// Story 56-5 — Badge "Groupe du mois" avec animation shimmer
export { GroupOfMonthBadge } from './GroupOfMonthBadge'
export type { GroupOfMonthBadgeProps } from './GroupOfMonthBadge'

// Story 56-6 — Indicateur de capacité groupe
export { CapacityIndicator, getCapacityStatus, getCapacityColor, getCapacityTooltip } from './CapacityIndicator'
export type { CapacityIndicatorProps, CapacityStatus } from './CapacityIndicator'

// Story 56-3 — Grille d'avatars compacts pour card groupe
export { PlayerAvatarGrid } from './PlayerAvatarGrid'
export type { PlayerAvatarGridProps, AvatarMember } from './PlayerAvatarGrid'

// Story 56-2 — Tableau tactique terrain (positions + assignation joueurs)
export { TacticalBoard } from './TacticalBoard'
export type { TacticalBoardProps, FormationData } from './TacticalBoard'

// Story 58-1 — Card situation pédagogique style Hearthstone
export { SituationCard } from './SituationCard'
export type { SituationCardProps } from './SituationCard'

// Icônes SVG de navigation
export type { NavIconProps } from './icons'
export {
  HomeIcon,
  CalendarIcon,
  CheckSquareIcon,
  StarIcon,
  BookOpenIcon,
  TagIcon,
  LayersIcon,
  UsersIcon,
  UserCheckIcon,
  ShieldIcon,
  GridIcon,
  MapPinIcon,
  TargetIcon,
  BarChartIcon,
  PieChartIcon,
  UserIcon,
  KeyIcon,
  MessageSquareIcon,
  SearchIcon,
  CalendarDaysIcon,
  AlertTriangleIcon,
  ChatIcon,
  LockIcon,
  SunIcon,
  MoonIcon,
} from './icons'
