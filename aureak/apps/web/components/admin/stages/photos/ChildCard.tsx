// Story 105.1 — Card enfant (preview Panini + interactions drag/drop, assign, ajuster)
import { useMemo, useState } from 'react'
import type { CropState } from '../../../../lib/panini/types'
import type { ParsedCalque } from '../../../../lib/panini/svg'
import type { PoolPhoto } from './PhotoPool'
import { PaniniPreview } from './PaniniPreview'
import { paniniStyles } from './styles'

export type ChildCardEnfant = { id: string; prenom: string; nom: string }
export type ChildCardStage  = {
  titre       : string
  titreCourt  : string
  dates       : string
  categorie   : string
}

type Props = {
  enfant             : ChildCardEnfant
  stage              : ChildCardStage
  calque             : ParsedCalque
  photo              : PoolPhoto | null
  cropState          : CropState | null
  autoMatched        : boolean
  hasPendingSelection: boolean
  onDropPhoto        : (photoId: string) => void
  onTap              : () => void
  onUnassign         : () => void
  onAdjust           : () => void
}

export function ChildCard({
  enfant, stage, calque, photo, cropState, autoMatched,
  hasPendingSelection, onDropPhoto, onTap, onUnassign, onAdjust,
}: Props) {
  const [dragOver, setDragOver] = useState(false)

  const tokens = useMemo(() => ({
    prenom     : enfant.prenom,
    nom        : enfant.nom,
    nom_prenom : `${enfant.nom.toUpperCase()} ${enfant.prenom}`,
    prenom_nom : `${enfant.prenom} ${enfant.nom}`,
    titre      : stage.titre,
    stage      : stage.titre,
    stage_court: stage.titreCourt,
    date       : stage.dates,
    categorie  : stage.categorie,
  }), [enfant, stage])

  const canAssign = hasPendingSelection
  const hasPhoto  = photo !== null

  return (
    <div
      style={paniniStyles.childCard({ dragOver, hasPhoto, canAssign })}
      role="button"
      tabIndex={0}
      aria-label={`Carte ${enfant.prenom} ${enfant.nom}`}
      onClick={onTap}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onTap()
        }
      }}
      onDragOver={(e) => {
        e.preventDefault()
        setDragOver(true)
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDragOver(false)
        const photoId = e.dataTransfer.getData('text/photo-id')
        if (photoId) onDropPhoto(photoId)
      }}
    >
      <div style={paniniStyles.childCardPhoto}>
        {photo ? (
          <>
            <PaniniPreview
              calque={calque}
              photoUrl={photo.previewUrl}
              cropArea={cropState?.area ?? null}
              tokens={tokens}
              fitParent
            />
            {autoMatched && <div style={paniniStyles.childCardAutoBadge}>auto</div>}
            {canAssign && <div style={paniniStyles.childCardAssignHint}>Remplacer ici</div>}
            <div style={paniniStyles.childCardActions}>
              <button
                style={paniniStyles.childCardActionBtn}
                onClick={(e) => { e.stopPropagation(); onAdjust() }}
                title="Ajuster"
                aria-label="Ajuster la photo"
              >↔</button>
              <button
                style={paniniStyles.childCardActionBtn}
                onClick={(e) => { e.stopPropagation(); onUnassign() }}
                title="Retirer"
                aria-label="Retirer la photo"
              >×</button>
            </div>
          </>
        ) : (
          <>
            <div style={paniniStyles.childCardPlaceholder}>📷</div>
            <div style={paniniStyles.childCardNameOverlay}>
              <div style={paniniStyles.childCardPrenom}>{enfant.prenom}</div>
              <div style={paniniStyles.childCardNom}>{enfant.nom}</div>
            </div>
            {canAssign && <div style={paniniStyles.childCardAssignHint}>Assigner ici</div>}
          </>
        )}
      </div>
    </div>
  )
}
