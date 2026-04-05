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
