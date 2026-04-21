// @aureak/ui — Composants UI partagés AUREAK
// RÈGLE : aucune valeur hardcodée — toujours via @aureak/theme/tokens

export { ROLE_LABELS } from './labels/roles'

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

// Story 59-7 — Célébration milestone académie (confetti CSS pur)
export { MilestoneCelebration } from './MilestoneCelebration'

// Story 59-9 — Toast notification achievement badge temps réel
export { AchievementToast } from './AchievementToast'
export type { AchievementToastProps } from './AchievementToast'

// Story 59-10 — Trophée de saison SVG paramétrique + export PNG
export { SeasonTrophy } from './SeasonTrophy'
export type { SeasonTrophyProps } from './SeasonTrophy'
export { exportTrophyAsPng } from './utils/exportSvgToPng'

// Story 59-2 — Level-up animation spring + flash doré
export { LevelUpAnimation } from './LevelUpAnimation'
export type { LevelUpAnimationProps, LevelTier } from './LevelUpAnimation'
export { useLevelUp } from './hooks/useLevelUp'

// Story 56-3 — Grille d'avatars compacts pour card groupe
export { PlayerAvatarGrid } from './PlayerAvatarGrid'
export type { PlayerAvatarGridProps, AvatarMember } from './PlayerAvatarGrid'

// Story 56-2 — Tableau tactique terrain (positions + assignation joueurs)
export { TacticalBoard } from './TacticalBoard'
export type { TacticalBoardProps, FormationData } from './TacticalBoard'

// Story 58-1 — Card situation pédagogique style Hearthstone
export { SituationCard } from './SituationCard'
export type { SituationCardProps } from './SituationCard'

// Story 58-6 — Notation par étoiles 1–5 (interactif ou read-only)
export { StarRating } from './StarRating'

// Story 60-2 — Line chart SVG pur présences 12 mois
export { LineChart, SERIES_COLORS } from './LineChart'
export type { LineChartProps } from './LineChart'

// Story 60-3 — Heatmap jours/heures séances
export { HeatmapGrid } from './HeatmapGrid'
export type { HeatmapGridProps } from './HeatmapGrid'

// Story 60-4 — Bar chart horizontal classement implantations
export { BarChart } from './BarChart'
export type { BarChartProps } from './BarChart'

// Story 60-8 — Live counter séances en cours
export { LiveCounter } from './LiveCounter'
export type { LiveCounterProps } from './LiveCounter'

// Story 61.2 — HUD séance active mobile
export { ActiveSessionHUD } from './ActiveSessionHUD'
export type { ActiveSessionHUDProps } from './ActiveSessionHUD'

// Story 61.3 — PWA install prompt banner mobile
export { PWAInstallBanner } from './PWAInstallBanner'

// Story 61.4 — Swipe gestures présences
export { SwipeableRow } from './SwipeableRow'
export type { SwipeableRowProps } from './SwipeableRow'
export { useSwipeGesture } from './hooks/useSwipeGesture'
export type { UseSwipeGestureResult, SwipeGestureBindings } from './hooks/useSwipeGesture'

// Story 61.5 — Offline mode banner
export { OfflineBanner } from './OfflineBanner'
export type { OfflineBannerProps } from './OfflineBanner'

// Story 62.1 — Micro-interactions hook
export { useMicroInteraction } from './hooks/useMicroInteraction'
export type { UseMicroInteractionResult } from './hooks/useMicroInteraction'

// Story 62.2 — EmptyState illustré SVG gold/blanc
export { EmptyStateIllustrated } from './EmptyStateIllustrated'
export type { EmptyStateIllustratedProps, EmptyStateVariant } from './EmptyStateIllustrated'

// Story 62.3 — Skeleton unifié avec shimmer
export { SkeletonNew as SkeletonBase } from './SkeletonNew'

// Story 62.4 — HelpTooltip éducatif contextuel
export { HelpTooltip } from './HelpTooltip'
export type { HelpTooltipProps } from './HelpTooltip'
export { HELP_TEXTS } from './helpTexts'

// Story 86-2 — RoleSwitcher : sélecteur "Changer de casquette" multi-rôle
export { RoleSwitcher } from './RoleSwitcher'
export type { RoleSwitcherProps } from './RoleSwitcher'

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
