// Story 105.1 — Types locaux pour la feature cartes Panini (web only)

export type CropArea = {
  x     : number
  y     : number
  width : number
  height: number
}

export type CropState = {
  crop: { x: number; y: number }
  zoom: number
  area: CropArea | null
}

export type PhotoSlot = {
  x     : number
  y     : number
  width : number
  height: number
}

export type PhotoAssignment = {
  enfantId    : string
  photoId     : string
  cropState   : CropState
  autoMatched : boolean
}
