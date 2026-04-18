// @aureak/types — Sponsor entity (Story 92-2)

import type { SponsorshipType, CapsuleStatus } from './enums'

/** Sponsor — miroir de la table `sponsors` */
export type Sponsor = {
  id             : string
  tenantId       : string
  name           : string
  logoUrl        : string | null
  contactName    : string
  contactEmail   : string
  contactPhone   : string
  sponsorshipType: SponsorshipType
  amount         : number | null
  currency       : string
  startDate      : string
  endDate        : string | null
  linkedChildId  : string | null
  capsuleStatus  : CapsuleStatus | null
  notes          : string | null
  createdAt      : string
  updatedAt      : string
  deletedAt      : string | null
}

/** Params création sponsor */
export type CreateSponsorParams = {
  name           : string
  logoUrl?       : string | null
  contactName    : string
  contactEmail   : string
  contactPhone?  : string
  sponsorshipType: SponsorshipType
  amount?        : number | null
  currency?      : string
  startDate      : string
  endDate?       : string | null
  linkedChildId? : string | null
  capsuleStatus? : CapsuleStatus | null
  notes?         : string | null
}

/** Params update sponsor (partiel) */
export type UpdateSponsorParams = Partial<CreateSponsorParams>
