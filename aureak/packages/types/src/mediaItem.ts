// @aureak/types — MediaItem entity (Story 91-2)

import type { MediaItemStatus } from './enums'

/** Média de la médiathèque — miroir de la table `media_items` */
export type MediaItem = {
  id         : string
  tenantId   : string
  uploadedBy : string
  filePath   : string
  fileType   : 'image' | 'video'
  title      : string
  description: string
  status     : MediaItemStatus
  approvedBy : string | null
  approvedAt : string | null
  createdAt  : string
  updatedAt  : string
  deletedAt  : string | null
}
