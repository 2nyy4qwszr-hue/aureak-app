// Story 105.1 — Modal d'ajustement (cropper + preview live)
import { useCallback, useMemo, useState } from 'react'
import Cropper, { type Area } from 'react-easy-crop'
import type { CropState, PhotoSlot } from '../../../../lib/panini/types'
import type { ParsedCalque } from '../../../../lib/panini/svg'
import { useDebouncedValue } from '../../../../hooks/useDebouncedValue'
import { PaniniPreview } from './PaniniPreview'
import { paniniStyles } from './styles'

type Props = {
  photoUrl    : string
  initialCrop : CropState
  photoSlot   : PhotoSlot
  enfantLabel : string
  calque      : ParsedCalque
  tokens      : Record<string, string>
  isDesktop   : boolean
  onCancel    : () => void
  onValidate  : (crop: CropState) => void
}

export function PhotoAdjuster({
  photoUrl, initialCrop, photoSlot, enfantLabel, calque, tokens, isDesktop,
  onCancel, onValidate,
}: Props) {
  const [crop, setCrop] = useState(initialCrop.crop)
  const [zoom, setZoom] = useState(initialCrop.zoom)
  const [area, setArea] = useState<Area | null>(initialCrop.area)

  const aspect        = photoSlot.width / photoSlot.height
  const debouncedArea = useDebouncedValue(area, 200)
  const stableTokens  = useMemo(() => tokens, [JSON.stringify(tokens)])

  const onCropComplete = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
    setArea(croppedAreaPixels)
  }, [])

  const handleValidate = () => {
    onValidate({ crop, zoom, area })
  }

  const overlayStyle = { ...paniniStyles.modalOverlay, ...(isDesktop ? paniniStyles.modalOverlayDesktop : {}) }
  const modalStyle   = { ...paniniStyles.modal, ...(isDesktop ? paniniStyles.modalDesktop : {}) }
  const bodyStyle    = { ...paniniStyles.modalBodyMobile, ...(isDesktop ? paniniStyles.modalBodyDesktop : {}) }
  const cropStyle    = { ...paniniStyles.cropperContainerMobile, ...(isDesktop ? paniniStyles.cropperContainerDesktop : {}) }

  return (
    <div style={overlayStyle} onClick={onCancel}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <div style={paniniStyles.modalHeader}>
          <h3 style={paniniStyles.modalHeaderTitle}>Ajuster — {enfantLabel}</h3>
          <button style={paniniStyles.modalClose} onClick={onCancel} aria-label="Fermer">×</button>
        </div>
        <div style={bodyStyle}>
          <div style={cropStyle}>
            <Cropper
              image={photoUrl}
              crop={crop}
              zoom={zoom}
              aspect={aspect}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
              objectFit="contain"
            />
          </div>
          <div style={paniniStyles.previewPane}>
            <div style={paniniStyles.previewPaneLabel}>Rendu final</div>
            <PaniniPreview
              calque={calque}
              photoUrl={photoUrl}
              cropArea={debouncedArea}
              tokens={stableTokens}
              maxHeight={isDesktop ? 420 : 280}
            />
          </div>
        </div>
        <div style={paniniStyles.modalControls}>
          <label style={paniniStyles.modalControlsLabel}>
            Zoom
            <input
              type="range"
              min={1}
              max={4}
              step={0.01}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              style={paniniStyles.modalControlsRange}
              aria-label="Zoom photo"
            />
            <span>{zoom.toFixed(2)}×</span>
          </label>
        </div>
        <div style={paniniStyles.modalFooter}>
          <button style={paniniStyles.btnSecondary} onClick={onCancel}>Annuler</button>
          <button style={paniniStyles.btnPrimary(false)} onClick={handleValidate}>Valider</button>
        </div>
      </div>
    </div>
  )
}
