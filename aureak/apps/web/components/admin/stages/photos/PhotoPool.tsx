// Story 105.1 — Pool de photos uploadées (drag & drop + clic pour sélection)
import { useCallback } from 'react'
import { paniniStyles } from './styles'

export type PoolPhoto = {
  id         : string
  file       : File
  previewUrl : string
  assignedTo : string | null
}

type Props = {
  photos           : PoolPhoto[]
  autoMatchedCount : number
  selectedPhotoId  : string | null
  isDesktop        : boolean
  onFilesDrop      : (files: FileList) => void
  onSelectPhoto    : (photoId: string) => void
  onRemovePhoto    : (photoId: string) => void
}

export function PhotoPool({
  photos, autoMatchedCount, selectedPhotoId, isDesktop,
  onFilesDrop, onSelectPhoto, onRemovePhoto,
}: Props) {
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    if (e.dataTransfer.files.length > 0) {
      onFilesDrop(e.dataTransfer.files)
    }
  }, [onFilesDrop])

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesDrop(e.target.files)
      e.target.value = ''
    }
  }, [onFilesDrop])

  const unassigned = photos.filter((p) => !p.assignedTo)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: isDesktop ? '100%' : undefined }}>
      <div style={paniniStyles.poolHeader}>
        <div>
          <h3 style={paniniStyles.poolHeaderTitle}>Photos à assigner ({unassigned.length})</h3>
          {autoMatchedCount > 0 && (
            <p style={paniniStyles.poolHeaderSubmeta}>
              +{autoMatchedCount} auto-assignée{autoMatchedCount > 1 ? 's' : ''}
            </p>
          )}
        </div>
        <label style={paniniStyles.btnUpload}>
          + Ajouter
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileInput}
            style={{ display: 'none' }}
          />
        </label>
      </div>
      <div
        style={{ ...paniniStyles.poolDropzone, flex: isDesktop ? 1 : undefined }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
      >
        {unassigned.length === 0 ? (
          <p style={paniniStyles.dropzoneHint}>Ajoute des photos via "+ Ajouter"</p>
        ) : (
          <div style={isDesktop ? paniniStyles.poolGridDesktop : paniniStyles.poolGridMobile}>
            {unassigned.map((p) => {
              const isSelected = selectedPhotoId === p.id
              const itemStyle = {
                ...paniniStyles.poolItem(isSelected),
                ...(isDesktop ? paniniStyles.poolItemSquare : {}),
              }
              return (
                <div
                  key={p.id}
                  style={itemStyle}
                  role="button"
                  tabIndex={0}
                  aria-pressed={isSelected}
                  draggable
                  onClick={() => onSelectPhoto(p.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      onSelectPhoto(p.id)
                    }
                  }}
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/photo-id', p.id)
                  }}
                >
                  <img src={p.previewUrl} alt="" style={paniniStyles.poolItemImg} />
                  <button
                    style={paniniStyles.photoRemoveBtn}
                    onClick={(e) => {
                      e.stopPropagation()
                      onRemovePhoto(p.id)
                    }}
                    title="Retirer"
                    aria-label="Retirer la photo"
                  >
                    ×
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
