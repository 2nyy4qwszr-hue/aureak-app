// Story 101.5 — barrel export <LoadingState /> / <EmptyState /> / <ErrorState />
//
// Usage :
//   import { LoadingState, EmptyState, ErrorState } from '@/components/admin/states'

export { LoadingState } from './LoadingState'
export type { LoadingStateProps, LoadingStateVariant } from './LoadingState'

export { EmptyState } from './EmptyState'
export type { EmptyStateProps, EmptyStateAction, EmptyStateIconProps } from './EmptyState'

export { ErrorState } from './ErrorState'
export type { ErrorStateProps } from './ErrorState'
