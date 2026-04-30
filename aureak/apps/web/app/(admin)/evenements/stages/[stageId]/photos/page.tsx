'use client'
// Story 105.1 — Générateur de cartes Panini pour un stage (admin, web only)
// Inspiré du proto autonome /Photos stage/. Tout le code vit dans apps/web
// (lib/panini, components/admin/stages/photos) avec styles @aureak/theme tokens.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocalSearchParams, useRouter, Link } from 'expo-router'
import { getStage, listStageChildren } from '@aureak/api-client'
import type { StageChild } from '@aureak/api-client'
import type { StageWithMeta } from '@aureak/types'
import { colors } from '@aureak/theme'
import { loadCalque, type ParsedCalque } from '../../../../../../lib/panini/svg'
import { autoMatch } from '../../../../../../lib/panini/match'
import {
  loadState, saveState, clearState, type PersistedAssignment,
} from '../../../../../../lib/panini/storage'
import type { CropState, PhotoAssignment } from '../../../../../../lib/panini/types'
import { PhotoPool, type PoolPhoto } from '../../../../../../components/admin/stages/photos/PhotoPool'
import {
  ChildCard, type ChildCardEnfant, type ChildCardStage,
} from '../../../../../../components/admin/stages/photos/ChildCard'
import { PhotoAdjuster } from '../../../../../../components/admin/stages/photos/PhotoAdjuster'
import { ExportButtons } from '../../../../../../components/admin/stages/photos/ExportButtons'
import { paniniStyles } from '../../../../../../components/admin/stages/photos/styles'
import { formatNom, formatPrenom } from '../../../../../../lib/format-names'

const DEFAULT_CROP: CropState = {
  crop: { x: 0, y: 0 },
  zoom: 1,
  area: null,
}

// `public/assets/` est un dossier spécial réservé par Metro / Expo Web pour les
// assets bundlés — il n'est pas servi statiquement. On sert donc le calque
// depuis `public/panini/calque.svg` directement à la racine.
const CALQUE_URL = '/panini/calque.svg'

function useIsDesktop(): boolean {
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 768 : true,
  )
  useEffect(() => {
    if (typeof window === 'undefined') return
    const onResize = () => setIsDesktop(window.innerWidth >= 768)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  return isDesktop
}

function formatStageDates(startDate: string, endDate: string): string {
  const s = new Date(startDate)
  const e = new Date(endDate)
  const opts: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short' }
  if (s.toDateString() === e.toDateString()) {
    return s.toLocaleDateString('fr-BE', opts)
  }
  return `${s.toLocaleDateString('fr-BE', opts)} → ${e.toLocaleDateString('fr-BE', opts)}`
}

export default function StagePaniniPhotosPage() {
  const router    = useRouter()
  const { stageId } = useLocalSearchParams<{ stageId: string }>()
  const isDesktop = useIsDesktop()

  const [stage, setStage]     = useState<StageWithMeta | null>(null)
  const [enfants, setEnfants] = useState<StageChild[]>([])
  const [calque, setCalque]   = useState<ParsedCalque | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [loading, setLoading]     = useState(true)

  const [photos, setPhotos]           = useState<PoolPhoto[]>([])
  const [assignments, setAssignments] = useState<PhotoAssignment[]>([])
  const [adjustingEnfantId, setAdjustingEnfantId] = useState<string | null>(null)
  const [selectedPhotoId, setSelectedPhotoId]     = useState<string | null>(null)
  const [customTitle, setCustomTitle] = useState<string>('')

  const pendingRestoreRef = useRef<PersistedAssignment[]>([])

  // Initial load — stage + enfants + calque + persisted state
  useEffect(() => {
    if (!stageId) return
    let cancelled = false
    setLoading(true)
    ;(async () => {
      try {
        const persisted = loadState(stageId)
        const [stageRes, enfantsRes, calqueParsed] = await Promise.all([
          getStage(stageId),
          listStageChildren(stageId),
          loadCalque(CALQUE_URL),
        ])
        if (cancelled) return
        if (!stageRes) {
          setLoadError('Stage introuvable')
          return
        }
        setStage(stageRes)
        setEnfants(enfantsRes)
        setCalque(calqueParsed)
        pendingRestoreRef.current = persisted.assignments
        if (persisted.customTitle) setCustomTitle(persisted.customTitle)
      } catch (err) {
        if (!cancelled) {
          if (process.env.NODE_ENV !== 'production') console.error('[panini] init load failed:', err)
          setLoadError(err instanceof Error ? err.message : String(err))
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [stageId])

  // Persistance debouncée (500ms)
  useEffect(() => {
    if (!stageId) return
    const handle = setTimeout(() => {
      saveState(stageId, {
        version: 1,
        stageId,
        assignments: assignments
          .map((a) => {
            const photo = photos.find((p) => p.id === a.photoId)
            if (!photo) return null
            return {
              enfantId      : a.enfantId,
              photoFileName : photo.file.name,
              cropState     : a.cropState,
              autoMatched   : a.autoMatched,
            } as PersistedAssignment
          })
          .filter((x): x is PersistedAssignment => x !== null),
        customTitle: customTitle.trim() || null,
      })
    }, 500)
    return () => clearTimeout(handle)
  }, [stageId, assignments, photos, customTitle])

  const childCardStage = useMemo<ChildCardStage | null>(() => {
    if (!stage) return null
    const effectiveTitle = customTitle.trim() || stage.name
    return {
      titre      : effectiveTitle,
      titreCourt : customTitle.trim() || (stage.seasonLabel ?? stage.name),
      dates      : formatStageDates(stage.startDate, stage.endDate),
      categorie  : stage.type ?? '',
    }
  }, [stage, customTitle])

  const enfantsForCards = useMemo<ChildCardEnfant[]>(
    // NOM en MAJUSCULES + Prénom Capitalisé — convention Panini Aureak.
    () => enfants.map((e) => ({ id: e.id, prenom: formatPrenom(e.prenom), nom: formatNom(e.nom) })),
    [enfants],
  )

  const handleFilesDrop = useCallback((files: FileList) => {
    const newPhotos: PoolPhoto[] = Array.from(files)
      .filter((f) => f.type.startsWith('image/'))
      .map((file) => ({
        id         : `${file.name}-${file.size}-${Date.now()}-${Math.random()}`,
        file,
        previewUrl : URL.createObjectURL(file),
        assignedTo : null,
      }))

    const takenEnfantIds = new Set(assignments.map((a) => a.enfantId))
    const pendingRestore = pendingRestoreRef.current
    const newAssignments: PhotoAssignment[] = []

    for (const photo of newPhotos) {
      const restore = pendingRestore.find((a) => a.photoFileName === photo.file.name)
      if (restore && !takenEnfantIds.has(restore.enfantId)) {
        photo.assignedTo = restore.enfantId
        takenEnfantIds.add(restore.enfantId)
        newAssignments.push({
          enfantId    : restore.enfantId,
          photoId     : photo.id,
          cropState   : restore.cropState,
          autoMatched : restore.autoMatched,
        })
        continue
      }

      const enfantId = autoMatch(photo.file.name, enfantsForCards)
      if (enfantId && !takenEnfantIds.has(enfantId)) {
        photo.assignedTo = enfantId
        takenEnfantIds.add(enfantId)
        newAssignments.push({
          enfantId,
          photoId    : photo.id,
          cropState  : DEFAULT_CROP,
          autoMatched: true,
        })
      }
    }

    pendingRestoreRef.current = pendingRestore.filter(
      (a) => !newAssignments.some((n) => n.enfantId === a.enfantId),
    )

    setPhotos((prev) => [...prev, ...newPhotos])
    if (newAssignments.length > 0) {
      setAssignments((prev) => [...prev, ...newAssignments])
    }
  }, [assignments, enfantsForCards])

  const handleReset = () => {
    if (!stageId) return
    if (!window.confirm('Réinitialiser toutes les assignations ? Les photos uploadées seront aussi retirées.')) {
      return
    }
    photos.forEach((p) => URL.revokeObjectURL(p.previewUrl))
    setPhotos([])
    setAssignments([])
    setSelectedPhotoId(null)
    pendingRestoreRef.current = []
    clearState(stageId)
  }

  const handleSelectPhoto = (photoId: string) => {
    setSelectedPhotoId((prev) => (prev === photoId ? null : photoId))
  }

  const handleAssign = (enfantId: string, photoId: string) => {
    setPhotos((prev) =>
      prev.map((p) => {
        if (p.id === photoId) return { ...p, assignedTo: enfantId }
        if (p.assignedTo === enfantId) return { ...p, assignedTo: null }
        return p
      }),
    )
    setAssignments((prev) => {
      const without = prev.filter((a) => a.enfantId !== enfantId && a.photoId !== photoId)
      return [...without, { enfantId, photoId, cropState: DEFAULT_CROP, autoMatched: false }]
    })
    setSelectedPhotoId((prev) => (prev === photoId ? null : prev))
  }

  const handleCardTap = (enfantId: string) => {
    if (selectedPhotoId) {
      handleAssign(enfantId, selectedPhotoId)
      return
    }
    const existing = assignments.find((a) => a.enfantId === enfantId)
    if (existing) {
      setAdjustingEnfantId(enfantId)
    }
  }

  const handleUnassign = (enfantId: string) => {
    const assignment = assignments.find((a) => a.enfantId === enfantId)
    if (assignment) {
      setPhotos((prev) =>
        prev.map((p) => (p.id === assignment.photoId ? { ...p, assignedTo: null } : p)),
      )
    }
    setAssignments((prev) => prev.filter((a) => a.enfantId !== enfantId))
  }

  const handleRemovePhoto = (photoId: string) => {
    const photo = photos.find((p) => p.id === photoId)
    if (photo) URL.revokeObjectURL(photo.previewUrl)
    setPhotos((prev) => prev.filter((p) => p.id !== photoId))
    setAssignments((prev) => prev.filter((a) => a.photoId !== photoId))
    setSelectedPhotoId((prev) => (prev === photoId ? null : prev))
  }

  const handleAdjustSave = (enfantId: string, crop: CropState) => {
    setAssignments((prev) =>
      prev.map((a) => (a.enfantId === enfantId ? { ...a, cropState: crop } : a)),
    )
    setAdjustingEnfantId(null)
  }

  const pendingRestoreCount = useMemo(() => {
    if (!stageId) return 0
    const uploadedFileNames = new Set(photos.map((p) => p.file.name))
    return pendingRestoreRef.current.filter((a) => !uploadedFileNames.has(a.photoFileName))
      .length
  }, [photos, stageId, assignments])

  if (loadError) {
    return (
      <div style={{ ...paniniStyles.root, ...paniniStyles.loadingWrap }}>
        <h1 style={paniniStyles.errorTitle}>Erreur de chargement</h1>
        <p>{loadError}</p>
        <button style={paniniStyles.btnSecondary} onClick={() => router.back()}>Retour</button>
      </div>
    )
  }

  if (loading || !calque || !stage || !childCardStage) {
    return (
      <div style={{ ...paniniStyles.root, ...paniniStyles.loadingWrap }}>
        <p>Chargement…</p>
      </div>
    )
  }

  const adjustingAssignment = assignments.find((a) => a.enfantId === adjustingEnfantId)
  const adjustingPhoto      = adjustingAssignment
    ? photos.find((p) => p.id === adjustingAssignment.photoId)
    : null
  const adjustingEnfant     = enfantsForCards.find((e) => e.id === adjustingEnfantId)

  return (
    <div style={paniniStyles.root}>
      <header style={paniniStyles.header}>
        <h1 style={paniniStyles.headerTitle}>Cartes Panini — {stage.name}</h1>
        <div style={paniniStyles.headerRight}>
          <Link
            href={`/evenements/stages/${stageId}` as never}
            style={{ ...paniniStyles.btnSecondary, textDecoration: 'none', color: colors.text.dark } as never}
          >
            Retour au stage
          </Link>
          <button style={paniniStyles.btnSecondary} onClick={handleReset}>
            Réinitialiser
          </button>
        </div>
      </header>

      {enfants.length === 0 ? (
        <div style={paniniStyles.loadingWrap}>
          <p>Aucun enfant inscrit à ce stage — rien à générer.</p>
        </div>
      ) : (
        <main style={isDesktop ? paniniStyles.mainDesktop : paniniStyles.mainMobile}>
          <aside style={{ ...paniniStyles.pool, ...(isDesktop ? paniniStyles.poolDesktop : {}) }}>
            <PhotoPool
              photos={photos}
              autoMatchedCount={assignments.filter((a) => a.autoMatched).length}
              selectedPhotoId={selectedPhotoId}
              isDesktop={isDesktop}
              onFilesDrop={handleFilesDrop}
              onSelectPhoto={handleSelectPhoto}
              onRemovePhoto={handleRemovePhoto}
            />
          </aside>

          <section style={{ ...paniniStyles.cards, ...(isDesktop ? paniniStyles.cardsDesktop : {}) }}>
            <div style={paniniStyles.cardsHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <input
                  type="text"
                  value={customTitle || stage.name}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder={stage.name}
                  aria-label="Titre affiché sur les cartes Panini"
                  style={{
                    ...paniniStyles.cardsHeaderTitle,
                    border         : '1px solid transparent',
                    borderRadius   : 6,
                    padding        : '4px 8px',
                    background     : 'transparent',
                    width          : '100%',
                    maxWidth       : 640,
                    outline        : 'none',
                    cursor         : 'text',
                  } as never}
                  onFocus={(e) => { e.currentTarget.style.borderColor = colors.accent.gold; e.currentTarget.style.background = colors.light.surface }}
                  onBlur ={(e) => { e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.background = 'transparent' }}
                />
                {customTitle.trim() && customTitle.trim() !== stage.name && (
                  <button
                    type="button"
                    onClick={() => setCustomTitle('')}
                    title="Réinitialiser le titre"
                    style={{
                      ...paniniStyles.btnSecondary,
                      padding: '4px 8px',
                      fontSize: 12,
                    } as never}
                  >
                    ↻ Titre du stage
                  </button>
                )}
              </div>
              <p style={paniniStyles.cardsHint}>
                Clique le titre pour le modifier — il s'imprimera ainsi sur chaque carte et dans le nom des fichiers exportés.
              </p>
              {pendingRestoreCount > 0 && (
                <div style={paniniStyles.restoreBanner}>
                  Re-uploade tes {pendingRestoreCount} photo{pendingRestoreCount > 1 ? 's' : ''} précédente{pendingRestoreCount > 1 ? 's' : ''} — tes ajustements seront restaurés automatiquement par nom de fichier.
                </div>
              )}
            </div>
            <div style={isDesktop ? paniniStyles.childGridDesktop : paniniStyles.childGridMobile}>
              {enfantsForCards.map((enfant) => {
                const assignment = assignments.find((a) => a.enfantId === enfant.id)
                const photo      = assignment
                  ? photos.find((p) => p.id === assignment.photoId) ?? null
                  : null
                return (
                  <ChildCard
                    key={enfant.id}
                    enfant={enfant}
                    stage={childCardStage}
                    calque={calque}
                    photo={photo}
                    cropState={assignment?.cropState ?? null}
                    autoMatched={assignment?.autoMatched ?? false}
                    hasPendingSelection={selectedPhotoId !== null}
                    onDropPhoto={(photoId) => handleAssign(enfant.id, photoId)}
                    onTap={() => handleCardTap(enfant.id)}
                    onUnassign={() => handleUnassign(enfant.id)}
                    onAdjust={() => setAdjustingEnfantId(enfant.id)}
                  />
                )
              })}
            </div>
          </section>

          <footer style={{ ...paniniStyles.footer, ...(isDesktop ? paniniStyles.footerDesktop : {}) }}>
            <ExportButtons
              stage={childCardStage}
              enfants={enfantsForCards}
              calque={calque}
              photos={photos}
              assignments={assignments}
            />
          </footer>
        </main>
      )}

      {adjustingAssignment && adjustingPhoto && adjustingEnfant && childCardStage && (
        <PhotoAdjuster
          photoUrl={adjustingPhoto.previewUrl}
          initialCrop={adjustingAssignment.cropState}
          photoSlot={calque.photoSlot}
          enfantLabel={`${adjustingEnfant.prenom} ${adjustingEnfant.nom}`}
          calque={calque}
          isDesktop={isDesktop}
          tokens={{
            prenom      : adjustingEnfant.prenom,
            nom         : adjustingEnfant.nom,
            nom_prenom  : `${adjustingEnfant.nom.toUpperCase()} ${adjustingEnfant.prenom}`,
            prenom_nom  : `${adjustingEnfant.prenom} ${adjustingEnfant.nom}`,
            titre       : childCardStage.titre,
            stage       : childCardStage.titre,
            stage_court : childCardStage.titreCourt,
            date        : childCardStage.dates,
            categorie   : childCardStage.categorie,
          }}
          onCancel={() => setAdjustingEnfantId(null)}
          onValidate={(crop) => handleAdjustSave(adjustingEnfant.id, crop)}
        />
      )}
    </div>
  )
}
