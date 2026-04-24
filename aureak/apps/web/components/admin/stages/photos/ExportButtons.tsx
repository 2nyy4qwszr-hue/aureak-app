// Story 105.1 — Boutons d'export (JPEG individuels + ZIP)
import { useState } from 'react'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import type { ParsedCalque } from '../../../../lib/panini/svg'
import type { PhotoAssignment } from '../../../../lib/panini/types'
import type { PoolPhoto } from './PhotoPool'
import type { ChildCardEnfant, ChildCardStage } from './ChildCard'
import { renderCard, safeFilename } from '../../../../lib/panini/render'
import { paniniStyles } from './styles'

type Props = {
  stage       : ChildCardStage
  enfants     : ChildCardEnfant[]
  calque      : ParsedCalque
  photos      : PoolPhoto[]
  assignments : PhotoAssignment[]
}

export function ExportButtons({ stage, enfants, calque, photos, assignments }: Props) {
  const [busy, setBusy] = useState<'none' | 'all' | 'zip'>('none')
  const [progress, setProgress] = useState({ done: 0, total: 0 })

  const assignedEntries = assignments
    .map((a) => {
      const enfant = enfants.find((e) => e.id === a.enfantId)
      const photo  = photos.find((p) => p.id === a.photoId)
      if (!enfant || !photo) return null
      return { assignment: a, enfant, photo }
    })
    .filter((e): e is NonNullable<typeof e> => e !== null)

  const buildTokens = (enfant: ChildCardEnfant) => ({
    prenom     : enfant.prenom,
    nom        : enfant.nom,
    nom_prenom : `${enfant.nom.toUpperCase()} ${enfant.prenom}`,
    prenom_nom : `${enfant.prenom} ${enfant.nom}`,
    titre      : stage.titre,
    stage      : stage.titre,
    stage_court: stage.titreCourt,
    date       : stage.dates,
    categorie  : stage.categorie,
  })

  const buildFilename = (enfant: ChildCardEnfant) =>
    `${safeFilename(stage.titreCourt || stage.titre)}_${safeFilename(enfant.nom)}_${safeFilename(enfant.prenom)}.jpg`

  const exportAll = async () => {
    if (assignedEntries.length === 0) return
    setBusy('all')
    setProgress({ done: 0, total: assignedEntries.length })
    try {
      for (const { assignment, enfant, photo } of assignedEntries) {
        const blob = await renderCard({
          calque,
          photoUrl: photo.previewUrl,
          cropArea: assignment.cropState.area,
          tokens  : buildTokens(enfant),
        })
        saveAs(blob, buildFilename(enfant))
        setProgress((p) => ({ ...p, done: p.done + 1 }))
      }
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[ExportButtons] exportAll error:', err)
    } finally {
      setBusy('none')
    }
  }

  const exportZip = async () => {
    if (assignedEntries.length === 0) return
    setBusy('zip')
    setProgress({ done: 0, total: assignedEntries.length })
    try {
      const zip    = new JSZip()
      const folder = zip.folder(safeFilename(stage.titreCourt || stage.titre)) || zip
      for (const { assignment, enfant, photo } of assignedEntries) {
        const blob = await renderCard({
          calque,
          photoUrl: photo.previewUrl,
          cropArea: assignment.cropState.area,
          tokens  : buildTokens(enfant),
        })
        folder.file(buildFilename(enfant), blob)
        setProgress((p) => ({ ...p, done: p.done + 1 }))
      }
      const zipBlob = await zip.generateAsync({ type: 'blob' })
      saveAs(zipBlob, `${safeFilename(stage.titreCourt || stage.titre)}.zip`)
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[ExportButtons] exportZip error:', err)
    } finally {
      setBusy('none')
    }
  }

  const count    = assignedEntries.length
  const disabled = busy !== 'none' || count === 0

  return (
    <div style={paniniStyles.exportContainer}>
      <div style={paniniStyles.exportStatus}>
        <strong>{count}</strong> / {enfants.length} enfants avec photo
        {busy !== 'none' && (
          <span style={paniniStyles.exportProgress}>
            {' · '}Génération {progress.done}/{progress.total}
          </span>
        )}
      </div>
      <button onClick={exportAll} disabled={disabled} style={paniniStyles.btnPrimary(disabled)}>
        {busy === 'all' ? 'Export en cours…' : 'JPEG individuels'}
      </button>
      <button onClick={exportZip} disabled={disabled} style={paniniStyles.btnPrimary(disabled)}>
        {busy === 'zip' ? 'ZIP en cours…' : 'Télécharger en ZIP'}
      </button>
    </div>
  )
}
