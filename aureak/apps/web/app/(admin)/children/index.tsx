'use client'
// Annuaire joueurs — child_directory (import Notion)
// Terminologie officielle : joueur = enfant = child
// Story 18.2 : refonte UI cards + grille responsive + photos + filtres améliorés
// UI v2 : infos gauche · avatar droite · filtres avancés repliables
import React, { useEffect, useState, useCallback, useMemo } from 'react'
import { View, StyleSheet, ScrollView, TextInput, Pressable, Image, Platform } from 'react-native'
import { useRouter } from 'expo-router'
import { listJoueurs, type JoueurListItem } from '@aureak/api-client'
import { AureakText, Button } from '@aureak/ui'
import { colors, space, shadows, radius } from '@aureak/theme'
import { ACADEMY_STATUS_CONFIG } from '@aureak/business-logic'
import { formatNomPrenom } from '@aureak/types'
import type { AcademyStatus } from '@aureak/types'

const PAGE_SIZE = 50

// ── Filter types ───────────────────────────────────────────────────────────────

type AcadStatusFilter = 'all' | AcademyStatus
type SeasonFilter     = 'all' | 'eq1' | 'eq2' | 'gte3'
type StageFilter      = 'all' | 'eq0' | 'eq1' | 'eq2' | 'gte3'

const SEASON_TABS: { key: SeasonFilter; label: string }[] = [
  { key: 'all',  label: 'Toutes'    },
  { key: 'eq1',  label: '1 saison'  },
  { key: 'eq2',  label: '2 saisons' },
  { key: 'gte3', label: '3+'        },
]

const STAGE_TABS: { key: StageFilter; label: string }[] = [
  { key: 'all',  label: 'Tous'       },
  { key: 'eq0',  label: 'Aucun'      },
  { key: 'eq1',  label: '1 stage'    },
  { key: 'eq2',  label: '2 stages'   },
  { key: 'gte3', label: '3+'         },
]

// Années de naissance dynamiques : 2004 → 2018
const BIRTH_YEAR_TABS: { key: string; label: string }[] = [
  { key: 'all', label: 'Toutes' },
  ...Array.from({ length: 15 }, (_, i) => {
    const y = (2018 - i).toString()
    return { key: y, label: y }
  }),
]

// ── PhotoAvatar — cercle photo ou initiales en fallback ────────────────────────

function getInitials(displayName: string, nom?: string | null, prenom?: string | null): string {
  if (nom && prenom) return (nom.charAt(0) + prenom.charAt(0)).toUpperCase()
  if (nom)           return nom.charAt(0).toUpperCase()
  const parts = displayName.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
}

function avatarBgColor(id: string): string {
  const COLORS = ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#06B6D4']
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash)
  return COLORS[Math.abs(hash) % COLORS.length]
}

function PhotoAvatar({ photoUrl, displayName, id, size = 52, nom, prenom }: {
  photoUrl   : string | null
  displayName: string
  id         : string
  size?      : number
  nom?       : string | null
  prenom?    : string | null
}) {
  const [imgError, setImgError] = useState(false)
  const showPhoto = photoUrl && !imgError
  const bg = avatarBgColor(id)
  const initials = getInitials(displayName, nom, prenom)

  return (
    <View style={[av.circle, { width: size, height: size, borderRadius: size / 2, backgroundColor: showPhoto ? 'transparent' : bg }]}>
      {showPhoto ? (
        <Image
          source={{ uri: photoUrl }}
          style={{ width: size, height: size, borderRadius: size / 2 }}
          onError={() => setImgError(true)}
          resizeMode="cover"
        />
      ) : (
        <AureakText style={[av.initials, { fontSize: size * 0.32 }] as never}>
          {initials}
        </AureakText>
      )}
    </View>
  )
}

const av = StyleSheet.create({
  circle  : { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  initials: { color: '#fff', fontWeight: '700' as never, letterSpacing: 0.5 },
})

// ── Chips ──────────────────────────────────────────────────────────────────────

function StatusChip({ status }: { status: string }) {
  const cfg = ACADEMY_STATUS_CONFIG[status as AcademyStatus]
  if (!cfg) return null
  return (
    <View style={[chip.base, { backgroundColor: cfg.bg, borderColor: cfg.color + '40' }]}>
      <AureakText style={[chip.label, { color: cfg.color }] as never}>{cfg.label}</AureakText>
    </View>
  )
}

function InfoChip({ label, color }: { label: string; color: string }) {
  return (
    <View style={[chip.base, { backgroundColor: color + '14', borderColor: color + '30' }]}>
      <AureakText style={[chip.label, { color }] as never}>{label}</AureakText>
    </View>
  )
}

const chip = StyleSheet.create({
  base : { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 4, borderWidth: 1, alignSelf: 'flex-start' },
  label: { fontSize: 10, fontWeight: '600' as never, letterSpacing: 0.3 },
})

// ── Pagination ─────────────────────────────────────────────────────────────────

function Pagination({
  page, total, onPrev, onNext,
}: { page: number; total: number; onPrev: () => void; onNext: () => void }) {
  const totalPages = Math.ceil(total / PAGE_SIZE) || 1
  const start = page * PAGE_SIZE + 1
  const end   = Math.min((page + 1) * PAGE_SIZE, total)
  return (
    <View style={pag.row}>
      <AureakText variant="caption" style={{ color: colors.text.muted }}>
        {total > 0 ? `${start}–${end} sur ${total}` : '0 résultat'}
      </AureakText>
      <View style={pag.btnRow}>
        <Pressable style={[pag.btn, page === 0 && pag.disabled]} onPress={onPrev} disabled={page === 0}>
          <AureakText variant="caption" style={{ color: page === 0 ? colors.text.muted : colors.text.dark }}>←</AureakText>
        </Pressable>
        <AureakText variant="caption" style={{ color: colors.text.muted, paddingHorizontal: space.sm }}>
          {page + 1} / {totalPages}
        </AureakText>
        <Pressable style={[pag.btn, end >= total && pag.disabled]} onPress={onNext} disabled={end >= total}>
          <AureakText variant="caption" style={{ color: end >= total ? colors.text.muted : colors.text.dark }}>→</AureakText>
        </Pressable>
      </View>
    </View>
  )
}
const pag = StyleSheet.create({
  row    : { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: space.sm },
  btnRow : { flexDirection: 'row', alignItems: 'center' },
  btn    : { width: 30, height: 30, borderRadius: radius.xs, borderWidth: 1, borderColor: colors.border.light, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.light.surface },
  disabled: { opacity: 0.35 },
})

// ── JoueurCard — layout vertical : photo en haut · infos en dessous ──────────

function formatBirthDate(iso: string | null): string | null {
  if (!iso) return null
  try {
    // Parsing manuel pour éviter l'interprétation UTC de new Date('YYYY-MM-DD')
    // qui décalerait la date d'un jour dans les fuseaux horaires négatifs.
    const [y, m, d] = iso.split('-').map(Number)
    return new Date(y, m - 1, d).toLocaleDateString('fr-BE', { day: '2-digit', month: '2-digit', year: 'numeric' })
  } catch { return null }
}

function JoueurCard({ item, onPress }: { item: JoueurListItem; onPress: () => void }) {
  const dob      = formatBirthDate(item.birthDate)
  const nomComplet = formatNomPrenom(item.nom, item.prenom, item.displayName)

  return (
    <Pressable
      style={({ pressed }) => [card.container, pressed && card.pressed]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Voir la fiche de ${nomComplet}`}
    >
      {/* Photo centrée en haut */}
      <PhotoAvatar
        photoUrl={item.currentPhotoUrl}
        displayName={item.displayName}
        nom={item.nom}
        prenom={item.prenom}
        id={item.id}
        size={80}
      />

      {/* Infos en dessous */}
      <View style={card.infoBlock}>
        <AureakText style={card.name} numberOfLines={1}>
          {nomComplet}
        </AureakText>

        {/* Métadonnées — toujours visibles, "—" si absent (AC: #1, #2, #3) */}
        <AureakText
          variant="caption"
          style={[card.metaLine, !dob && card.placeholder]}
          accessibilityLabel={!dob ? 'Date de naissance inconnue' : dob}
        >
          {dob || '—'}
        </AureakText>
        <AureakText
          variant="caption"
          style={[card.metaLine, !item.currentClub && card.placeholder]}
          numberOfLines={1}
          accessibilityLabel={!item.currentClub ? 'Club inconnu' : item.currentClub}
        >
          {item.currentClub || '—'}
        </AureakText>
        <AureakText
          variant="caption"
          style={[card.metaLine, !item.niveauClub && card.placeholder]}
          numberOfLines={1}
          accessibilityLabel={!item.niveauClub ? 'Niveau inconnu' : item.niveauClub}
        >
          {item.niveauClub || '—'}
        </AureakText>

        {(item.computedStatus || item.totalAcademySeasons > 0 || item.totalStages > 0 || item.isClubPartner) && (
          <View style={card.chips}>
            {item.computedStatus && <StatusChip status={item.computedStatus} />}
            {item.totalAcademySeasons > 0 && (
              <InfoChip
                label={`${item.totalAcademySeasons} saison${item.totalAcademySeasons > 1 ? 's' : ''}`}
                color="#9E9E9E"
              />
            )}
            {item.totalStages > 0 && (
              <InfoChip
                label={`${item.totalStages} stage${item.totalStages > 1 ? 's' : ''}`}
                color="#4FC3F7"
              />
            )}
            {item.isClubPartner && (
              <InfoChip label="Club partenaire" color={colors.accent.gold} />
            )}
          </View>
        )}
      </View>

    </Pressable>
  )
}

const card = StyleSheet.create({
  container: {
    flexDirection  : 'column',
    alignItems     : 'center',
    backgroundColor: colors.light.surface,
    borderRadius   : 10,
    borderWidth    : 1,
    borderColor    : colors.border.light,
    padding        : 12,
    minHeight      : 210,
    ...shadows.sm,
  },
  pressed: {
    backgroundColor: colors.light.hover ?? colors.light.muted,
    transform      : [{ scale: 0.99 }],
  },
  infoBlock: {
    width     : '100%',
    gap       : 3,
    marginTop : 10,
    alignItems: 'center',        // Story 22.2B — centrage horizontal
  },
  name: {
    fontWeight   : '700' as never,
    fontSize     : 13,
    color        : colors.text.dark,
    letterSpacing: 0.1,
    textAlign    : 'center' as never, // Story 22.2B
  },
  metaLine: {
    color     : colors.text.muted,
    fontSize  : 11,
    lineHeight: 17,
    textAlign : 'center' as never, // Story 22.2B
  },
  placeholder: {
    color  : colors.text.subtle,
    opacity: 0.65,
  },
  chips: {
    flexDirection  : 'row',
    gap            : 4,
    flexWrap       : 'wrap',
    marginTop      : 4,
    justifyContent : 'center',   // Story 22.2B
  },
})

// ── PremiumJoueurCard — helpers + assets (Story 25.2) ────────────────────────

// Background JPEG optimisé (115 Ko, 560×840px) — inclut triangles, filets dorés,
// cercle badge haut-droite, séparateurs horizontaux et verticaux (pas besoin d'en ajouter en code)
const CARD_BG = require('../../../assets/cards/background-card.jpg') as number

// Badges statut — require() STATIQUES (Metro/Expo ne supporte pas les require dynamiques)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const BADGE_ASSETS: Partial<Record<string, any>> = {
  ACADÉMICIEN        : require('../../../assets/badges/badge-academicien.webp'),
  NOUVEAU_ACADÉMICIEN: require('../../../assets/badges/badge-nouveau.webp'),
  ANCIEN             : require('../../../assets/badges/badge-ancien.webp'),
  STAGE_UNIQUEMENT   : require('../../../assets/badges/badge-stage.webp'),
  PROSPECT           : require('../../../assets/badges/badge-prospect.webp'),
}

/** DD.MM.YYYY avec points — parsing local pour éviter UTC drift (AC #3) */
function formatDotDate(iso: string | null): string {
  if (!iso) return '—'
  try {
    const [y, m, d] = iso.split('-').map(Number)
    return `${String(d).padStart(2, '0')}.${String(m).padStart(2, '0')}.${y}`
  } catch { return '—' }
}

/** Étoiles colorées or/gris selon count (AC #6) */
function StarRating({ count, max = 5 }: { count: number; max?: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {Array.from({ length: max }, (_, i) => (
        <AureakText
          key={i}
          style={{ fontSize: 16, color: i < count ? colors.accent.gold : 'rgba(0,0,0,0.2)' } as never}
        >
          {i < count ? '★' : '☆'}
        </AureakText>
      ))}
    </View>
  )
}

/** Logo club : image si URL disponible, fallback initiales sur fond doré (AC #7) */
function ClubLogo({ url, clubName }: { url: string | null; clubName: string | null }) {
  const [imgError, setImgError] = useState(false)
  // Reset error si l'URL change (ex: signed URL rafraîchie, ou changement de filtre)
  useEffect(() => { setImgError(false) }, [url])
  if (url && !imgError) {
    return (
      <Image
        source={{ uri: url }}
        style={pZone.clubLogo}
        resizeMode="contain"
        accessible={false}
        onError={() => setImgError(true)}
      />
    )
  }
  const trimmed = clubName?.trim()
  const initials = trimmed
    ? trimmed.split(/\s+/).map(w => w.charAt(0)).slice(0, 2).join('').toUpperCase()
    : '—'
  return (
    <View style={pZone.clubLogoFallback}>
      <AureakText style={pZone.clubLogoFallbackText as never}>{initials}</AureakText>
    </View>
  )
}

/** Photo joueur dans la zone diagonale — masquage par le background JPEG (Story 25.3) */
function PremiumPhotoZone({ photoUrl, displayName, nom, prenom, id }: {
  photoUrl   : string | null
  displayName: string
  nom?       : string | null
  prenom?    : string | null
  id         : string
}) {
  const [imgError, setImgError] = useState(false)
  // Reset si l'URL change (signed URL rafraîchie / re-rendu) — AC #6
  useEffect(() => { setImgError(false) }, [photoUrl])
  const showPhoto = photoUrl && !imgError
  if (showPhoto) {
    return (
      <Image
        source={{ uri: photoUrl }}
        style={pPhoto.img}
        resizeMode="cover"
        accessible={false}
        onError={() => setImgError(true)}
      />
    )
  }
  // Fallback décoratif — accessible={false} car la Pressable parente porte le label complet
  return (
    <View style={pPhoto.fallbackContainer} accessible={false}>
      <View style={[pPhoto.fallback, { backgroundColor: avatarBgColor(id) }]}>
        <AureakText style={pPhoto.initials as never}>
          {getInitials(displayName, nom, prenom)}
        </AureakText>
      </View>
    </View>
  )
}

const pPhoto = StyleSheet.create({
  // Photo JPEG — couvre la zone diagonale, masquée à droite par le background PNG (z=1)
  img: {
    position: 'absolute' as never,
    top     : 0,
    left    : 0,
    right   : 0,
    height  : 230,
  },
  // Fallback — centré dans la moitié gauche (zone visible avant la diagonale)
  fallbackContainer: {
    position      : 'absolute' as never,
    top           : 0,
    left          : 0,
    width         : '50%' as never,
    height        : 230,
    alignItems    : 'center',
    justifyContent: 'center',
  },
  fallback: {
    width         : 110,
    height        : 110,
    borderRadius  : 55,
    alignItems    : 'center',
    justifyContent: 'center',
  },
  initials: {
    color     : '#fff',
    fontWeight: '700' as never,
    fontSize  : 36,
  },
})

const PremiumJoueurCard = React.memo(function PremiumJoueurCard({ item }: { item: JoueurListItem }) {
  const router = useRouter()
  const handlePress = useCallback(() => {
    router.push(`/children/${item.id}` as never)
  }, [router, item.id])
  const badgeAsset = BADGE_ASSETS[item.computedStatus ?? '']
  const prenomDisplay = item.prenom?.toUpperCase() ?? null
  const nomDisplay = (item.nom ?? item.displayName).toUpperCase()

  return (
    <Pressable
      style={({ pressed }) => [pCard.container, pressed && pCard.pressed]}
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={`Voir la fiche de ${formatNomPrenom(item.nom, item.prenom, item.displayName)}`}
    >
      {/* Photo joueur — z=0, masquée en diagonal par le background PNG (z=1) — AC #1, #2, #4 */}
      <PremiumPhotoZone
        photoUrl   ={item.currentPhotoUrl}
        displayName={item.displayName}
        nom        ={item.nom}
        prenom     ={item.prenom}
        id         ={item.id}
      />

      {/* Background JPEG — z=1 (AU-DESSUS de la zone photo pour que la diagonale blanche masque la photo) */}
      {/* Fix : dimensions explicites 280×420 (= 560×840 × 0.5). absoluteFillObject ne contraint pas
          la taille de l'image sur web — elle se rendait à 560×840 naturels, overflow:hidden la rognait. */}
      <Image
        source={CARD_BG}
        style={{ position: 'absolute', top: 0, left: 0, width: 280, height: 420 }}
        resizeMode="stretch"
        accessible={false}
      />

      {/* Zone badge statut — cercle doré haut-droite (dessiné dans le background) — AC #8 */}
      <View style={pZone.badge}>
        {badgeAsset ? (
          <Image source={badgeAsset} style={pZone.badgeImage} resizeMode="contain" />
        ) : null}
      </View>

      {/* Zone nom — droite-centre, sur fond blanc du background — AC #1, #2 */}
      <View style={pZone.nameBlock}>
        {prenomDisplay ? (
          <AureakText style={pZone.prenomText as never}>{prenomDisplay}</AureakText>
        ) : null}
        <AureakText style={pZone.nomText as never}>{nomDisplay}</AureakText>
      </View>

      {/* Rangée infos 1 — DATE DE NAISSANCE | HISTORIQUE — Story 25.7 : zones absolues */}
      <View style={pZone.infoRow1}>
        {/* zone-date (x:12→112) */}
        <View style={pZone.zoneDate}>
          <AureakText style={pZone.infoLabel as never}>DATE DE NAISSANCE</AureakText>
          <AureakText style={pZone.infoValue as never}>{formatDotDate(item.birthDate)}</AureakText>
        </View>
        {/* zone-histo (x:118→268) — séparateur JPEG tombe dans le gap x:112→118 */}
        <View style={pZone.zoneHisto}>
          <AureakText style={pZone.infoLabel as never}>HISTORIQUE</AureakText>
          <View style={pZone.historiqueValues}>
            <View style={pZone.zoneHistoSaison}>
              <AureakText style={pZone.infoValue as never}>{item.totalAcademySeasons}</AureakText>
              <AureakText style={pZone.infoSubLabel as never}>
                {item.totalAcademySeasons <= 1 ? 'Saison' : 'Saisons'}
              </AureakText>
            </View>
            <View style={pZone.zoneHistoStage}>
              <AureakText style={pZone.infoValue as never}>{item.totalStages}</AureakText>
              <AureakText style={pZone.infoSubLabel as never}>
                {item.totalStages <= 1 ? 'Stage' : 'Stages'}
              </AureakText>
            </View>
          </View>
        </View>
      </View>

      {/* Rangée infos 2 — EQUIPE | NIVEAU | CLUB — Story 25.7 : zones absolues */}
      <View style={pZone.infoRow2}>
        {/* zone-equipe (x:12→86) */}
        <View style={pZone.zoneEquipe}>
          <AureakText style={pZone.infoLabel as never}>ÉQUIPE</AureakText>
          <AureakText style={pZone.infoValue as never}>{item.ageCategory ?? '—'}</AureakText>
        </View>
        {/* zone-niveau (x:93→187) — séparateurs JPEG tombent dans les gaps x:86→93 et x:187→194 */}
        <View style={pZone.zoneNiveau}>
          <AureakText style={pZone.infoLabel as never}>NIVEAU</AureakText>
          <StarRating count={item.teamLevelStars ?? 0} />
        </View>
        {/* zone-club (x:194→268) */}
        <View style={pZone.zoneClub}>
          <AureakText style={pZone.infoLabel as never}>CLUB</AureakText>
          <ClubLogo url={item.clubLogoUrl} clubName={item.currentClub} />
        </View>
      </View>
    </Pressable>
  )
})

// ── Styles PremiumJoueurCard ───────────────────────────────────────────────────

const pCard = StyleSheet.create({
  container: {
    position    : 'relative' as never,
    overflow    : 'hidden',
    borderRadius: radius.cardLg,  // 24
    width       : 280,            // Story 25.5 — ratio exact 2:3 avec le background 560×840
    height      : 420,
    ...shadows.md,
  },
  pressed: { opacity: 0.92 },
})

const pZone = StyleSheet.create({
  // Zone badge — cercle doré haut-droite (pré-dessiné dans le background)
  // Story 25.6 : réduit 100→68px, repositionné top:20→22 right:18→12
  // Le cercle doré du JPEG 280×420 fait ~68px de ∅, centré à top:22 right:12
  badge: {
    position: 'absolute' as never,
    top     : 22,
    right   : 12,
    width   : 68,
    height  : 68,
  },
  badgeImage: {
    width : 68,
    height: 68,
  },

  // Zone nom — droite-centre, sur la zone blanche du background
  // Story 25.6 : aligné à droite (flex-end), top:185→170 (recalibrage post-fix 25.5),
  // fontSize:20→17 pour absorber les noms longs sans débordement
  nameBlock: {
    position  : 'absolute' as never,
    top       : 185,
    left      : '38%' as never,
    right     : 10,
    alignItems: 'flex-end',
    gap       : 2,
  },
  prenomText: {
    fontSize    : 13,
    color       : colors.text.muted,
    fontFamily  : 'Montserrat-Regular',
    letterSpacing: 0.5,
    textAlign   : 'right' as never,
  },
  nomText: {
    fontSize    : 22,
    color       : '#0A0A0A',
    fontFamily  : 'Montserrat-ExtraBold',
    letterSpacing: 0.2,
    lineHeight  : 26,
    textAlign   : 'right' as never,
  },

  // Rangée infos 1 — conteneur de zones absolues (Story 25.7 : flex retiré)
  // y : bottom:100, height:68 → occupe y:252→320 dans la carte 280×420
  infoRow1: {
    position: 'absolute' as never,
    bottom  : 100,
    left    : 0,
    right   : 0,
    height  : 68,
  },
  // zone-date (mauve) : x:12→124 (width:112) — Story 25.8 : recalibré +12px
  zoneDate: {
    position      : 'absolute' as never,
    top           : 4,
    left          : 12,
    width         : 112,
    bottom        : 0,
    alignItems    : 'flex-start',
    justifyContent: 'flex-start',
    gap           : 2,
  },
  // zone-histo (orange) : x:150→268 (width:118) — Story 25.8 : left:118→150, right:12→width:118
  // Gap date/histo : x:124→150 (26px) — séparateur JPEG ≈ x:135 tombe dans le gap ✓
  zoneHisto: {
    position      : 'absolute' as never,
    top           : 4,
    left          : 150,
    width         : 118,
    bottom        : 0,
    alignItems    : 'flex-start',
    justifyContent: 'flex-start',
    gap           : 2,
  },
  historiqueValues: {
    flexDirection: 'row',
    gap          : 0,
  },
  // zone-histo-saison : width:60 dans la zone-histo
  zoneHistoSaison: {
    width     : 60,
    alignItems: 'flex-start',
    gap       : 1,
  },
  // zone-histo-stage : paddingLeft:14 pour dépasser le séparateur interne (≈x:68 dans zone-histo)
  zoneHistoStage: {
    paddingLeft: 14,
    flex       : 1,
    alignItems : 'flex-start',
    gap        : 1,
  },

  // Rangée infos 2 — conteneur de zones absolues (Story 25.7 : flex retiré)
  // y : bottom:8, height:80 → occupe y:332→412 dans la carte 280×420
  infoRow2: {
    position: 'absolute' as never,
    bottom  : 8,
    left    : 0,
    right   : 0,
    height  : 80,
  },
  // zone-equipe (jaune) : x:12→86
  zoneEquipe: {
    position      : 'absolute' as never,
    top           : 6,
    left          : 12,
    width         : 74,
    bottom        : 0,
    alignItems    : 'flex-start',
    justifyContent: 'flex-start',
    gap           : 2,
  },
  // zone-niveau (bleue) : x:100→180 (left:100, right:100) — Story 25.8 : 93→100 (centrage symétrique)
  // Gap equipe/niveau : x:86→100 (14px) — séparateur JPEG ≈ x:89 ✓
  // Gap niveau/club  : x:180→194 (14px) — séparateur JPEG ≈ x:187 ✓
  zoneNiveau: {
    position      : 'absolute' as never,
    top           : 6,
    left          : 100,
    right         : 100,
    bottom        : 0,
    alignItems    : 'flex-start',
    justifyContent: 'flex-start',
    gap           : 2,
  },
  // zone-club (verte) : x:194→268
  zoneClub: {
    position      : 'absolute' as never,
    top           : 6,
    right         : 12,
    width         : 74,
    bottom        : 0,
    alignItems    : 'flex-start',
    justifyContent: 'flex-start',
    gap           : 2,
  },
  clubLogo: {
    width : 36,
    height: 36,
  },
  clubLogoFallback: {
    width          : 36,
    height         : 36,
    borderRadius   : 18,
    backgroundColor: 'rgba(212,175,55,0.30)',
    alignItems     : 'center',
    justifyContent : 'center',
  },
  clubLogoFallbackText: {
    fontSize  : 10,
    fontWeight: '700',
    color     : colors.accent.gold,
  },

  // Styles texte communs aux zones infos
  infoLabel: {
    width       : '100%' as never,  // Story 25.7 : remplit la zone conteneur, évite le flottement libre
    fontSize    : 8,
    color       : 'rgba(80,80,80,0.75)',
    letterSpacing: 0.8,
    textTransform: 'uppercase' as never,
    fontWeight  : '600' as never,
  },
  infoValue: {
    width     : '100%' as never,  // Story 25.7 : remplit la zone conteneur
    fontSize  : 17,
    color     : 'rgba(10,10,10,0.90)',
    fontWeight: '800' as never,
  },
  infoSubLabel: {
    width     : '100%' as never,
    fontSize  : 8,
    color     : 'rgba(80,80,80,0.65)',
    fontWeight: '500' as never,
  },
})

// ── Skeleton card — miroir de la nouvelle structure ────────────────────────────

function SkeletonCard() {
  return (
    <View style={[card.container, sk.root]}>
      {/* Cercle placeholder centré en haut */}
      <View style={sk.circle} />
      {/* Lignes placeholder */}
      <View style={sk.infoBlock}>
        <View style={[sk.line, { width: '65%', height: 13 }]} />
        <View style={[sk.line, { width: '80%', height: 11, marginTop: 3 }]} />
        <View style={[sk.line, { width: '70%', height: 11, marginTop: 2 }]} />
        <View style={[sk.line, { width: '55%', height: 11, marginTop: 2 }]} />
        <View style={sk.chipsRow}>
          <View style={sk.chipSm} />
          <View style={sk.chipSm} />
        </View>
      </View>
    </View>
  )
}

const sk = StyleSheet.create({
  root    : { opacity: 0.55 },
  circle  : { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.border.divider },
  infoBlock: { width: '100%', marginTop: 10, gap: 3, alignItems: 'center' },  // Story 22.2B
  line    : { backgroundColor: colors.border.divider, borderRadius: 4, alignSelf: 'center' },  // Story 22.2B
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4, justifyContent: 'center' },  // Story 22.2B
  chipSm  : { width: 52, height: 17, borderRadius: 4, backgroundColor: colors.border.divider },
})

// ── PremiumSkeletonCard — Skeleton dimensions identiques à PremiumJoueurCard ──

function PremiumSkeletonCard() {
  return (
    <View style={psk.container} />
  )
}

const psk = StyleSheet.create({
  container: {
    width           : 280,            // Story 25.5 — cohérent avec PremiumJoueurCard
    height          : 420,
    borderRadius    : radius.cardLg,  // 24
    backgroundColor : colors.border.divider,
    opacity         : 0.55,
    ...shadows.sm,
  },
})

// ── FilterRow ─────────────────────────────────────────────────────────────────

function FilterRow<K extends string>({
  label, tabs, active, onSelect,
}: {
  label   : string
  tabs    : { key: K; label: string }[]
  active  : K
  onSelect: (key: K) => void
}) {
  return (
    <View style={fr.wrap}>
      <AureakText variant="caption" style={fr.label}>{label}</AureakText>
      <View style={fr.row}>
        {tabs.map(t => {
          const isActive = active === t.key
          return (
            <Pressable
              key={t.key}
              style={[fr.tab, isActive && fr.tabActive]}
              onPress={() => onSelect(t.key)}
            >
              <AureakText
                variant="caption"
                style={{ color: isActive ? colors.text.dark : colors.text.muted, fontWeight: isActive ? '700' : '400' } as never}
              >
                {t.label}
              </AureakText>
            </Pressable>
          )
        })}
      </View>
    </View>
  )
}

const fr = StyleSheet.create({
  wrap    : { gap: 5 },
  label   : { color: colors.text.muted, fontSize: 10, letterSpacing: 0.8, textTransform: 'uppercase' as never, fontWeight: '700' as never },
  row     : { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  tab     : { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 5, borderWidth: 1, borderColor: colors.border.light, backgroundColor: 'transparent' },
  tabActive: { borderColor: colors.accent.gold, backgroundColor: colors.accent.gold + '18' },
})

// ── Main ───────────────────────────────────────────────────────────────────────

export default function JoueursPage() {
  const router = useRouter()

  const [joueurs,            setJoueurs]            = useState<JoueurListItem[]>([])
  const [total,              setTotal]              = useState(0)
  const [page,               setPage]               = useState(0)
  const [loading,            setLoading]            = useState(true)
  const [showAdvFilters,     setShowAdvFilters]     = useState(false)

  const [searchInput,  setSearchInput]  = useState('')
  const [search,       setSearch]       = useState('')
  const [acadStatus,   setAcadStatus]   = useState<AcadStatusFilter>('all')
  const [seasonFilter, setSeasonFilter] = useState<SeasonFilter>('all')
  const [stageFilter,  setStageFilter]  = useState<StageFilter>('all')
  const [birthYear,    setBirthYear]    = useState<string>('all')

  // Nombre total de filtres actifs (hors recherche)
  const activeFilterCount = useMemo(() => {
    let n = 0
    if (acadStatus   !== 'all') n++
    if (seasonFilter !== 'all') n++
    if (stageFilter  !== 'all') n++
    if (birthYear    !== 'all') n++
    return n
  }, [acadStatus, seasonFilter, stageFilter, birthYear])

  // Filtres avancés actifs uniquement (pour le badge sur le toggle)
  const advFilterCount = useMemo(() => {
    let n = 0
    if (seasonFilter !== 'all') n++
    if (stageFilter  !== 'all') n++
    if (birthYear    !== 'all') n++
    return n
  }, [seasonFilter, stageFilter, birthYear])

  // Saison effective — lue directement depuis les données déjà chargées (v_child_academy_status).
  // Tous les joueurs du même tenant partagent le même current_season_label calculé par la vue SQL.
  // Zéro appel supplémentaire, zéro logique de priorité côté JS.
  const currentSeasonLabel = useMemo(
    () => joueurs.find(j => j.currentSeasonLabel != null)?.currentSeasonLabel ?? null,
    [joueurs]
  )

  const acadStatusTabs = useMemo<{ key: AcadStatusFilter; label: string }[]>(() => [
    { key: 'all',               label: 'Tous'                                                        },
    { key: 'ACADÉMICIEN',       label: currentSeasonLabel ? `Acad. ${currentSeasonLabel}` : 'Académicien' },
    { key: 'NOUVEAU_ACADÉMICIEN', label: 'Nouveau'                                                   },
    { key: 'ANCIEN',            label: 'Ancien'                                                      },
    { key: 'STAGE_UNIQUEMENT',  label: 'Stage seul'                                                  },
    { key: 'PROSPECT',          label: 'Prospect'                                                    },
  ], [currentSeasonLabel])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data, count } = await listJoueurs({
        search         : search || undefined,
        computedStatus : acadStatus !== 'all' ? acadStatus : undefined,
        totalSeasonsCmp: seasonFilter !== 'all' ? seasonFilter : undefined,
        totalStagesCmp : stageFilter  !== 'all' ? stageFilter  : undefined,
        birthYear      : birthYear !== 'all' ? birthYear : undefined,
        page,
        pageSize: PAGE_SIZE,
      })
      setJoueurs(data)
      setTotal(count)
    } catch (e) {
      console.error('[JoueursPage] load error', e)
    }
    setLoading(false)
  }, [search, acadStatus, seasonFilter, stageFilter, birthYear, page])

  useEffect(() => { load() }, [load])
  useEffect(() => { setPage(0) }, [search, acadStatus, seasonFilter, stageFilter, birthYear])

  const handleSearch = () => setSearch(searchInput.trim())

  const handleResetFilters = () => {
    setAcadStatus('all')
    setSeasonFilter('all')
    setStageFilter('all')
    setBirthYear('all')
  }

  // CSS grid natif web — colonnes fixes 280px (Story 25.5 — ratio exact avec le background 560×840)
  const gridStyle = Platform.OS === 'web'
    ? { display: 'grid' as never, gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 280px))', gap: 16 }
    : s.gridFallback

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>

      {/* ── En-tête ── */}
      <View style={s.header}>
        <View>
          <AureakText variant="h2" color={colors.accent.gold}>Joueurs</AureakText>
          {!loading && (
            <AureakText variant="caption" style={s.headerSub}>
              {total} joueur{total !== 1 ? 's' : ''}
              {activeFilterCount > 0 && `  ·  ${activeFilterCount} filtre${activeFilterCount > 1 ? 's' : ''} actif${activeFilterCount > 1 ? 's' : ''}`}
            </AureakText>
          )}
        </View>
        <View style={s.headerActions}>
          {activeFilterCount > 0 && (
            <Pressable style={s.resetBtn} onPress={handleResetFilters}>
              <AureakText variant="caption" style={{ color: colors.accent.gold, fontWeight: '600' as never }}>
                Réinitialiser
              </AureakText>
            </Pressable>
          )}
          <Button
            label="Ajouter un joueur"
            variant="primary"
            onPress={() => router.push('/children/new' as never)}
          />
        </View>
      </View>

      {/* ── Barre de recherche ── */}
      <View style={s.searchRow}>
        <TextInput
          style={s.searchInput}
          value={searchInput}
          onChangeText={setSearchInput}
          onSubmitEditing={handleSearch}
          placeholder="Rechercher par nom…"
          placeholderTextColor={colors.text.muted}
          returnKeyType="search"
          autoComplete="off"
          autoCorrect={false}
          autoCapitalize="none"
          spellCheck={false}
          inputMode="search"
        />
        <Pressable style={s.searchBtn} onPress={handleSearch}>
          <AureakText variant="caption" style={{ color: colors.text.dark, fontWeight: '700' as never }}>
            Chercher
          </AureakText>
        </Pressable>
        {search !== '' && (
          <Pressable style={s.clearBtn} onPress={() => { setSearch(''); setSearchInput('') }}>
            <AureakText variant="caption" style={{ color: colors.text.muted }}>✕</AureakText>
          </Pressable>
        )}
      </View>

      {/* ── Filtres ── */}
      <View style={s.filtersBlock}>

        {/* Statut — toujours visible */}
        <FilterRow
          label="Statut"
          tabs={acadStatusTabs}
          active={acadStatus}
          onSelect={setAcadStatus}
        />

        {/* Toggle filtres avancés */}
        <Pressable
          style={[s.advToggle, showAdvFilters && s.advToggleOpen]}
          onPress={() => setShowAdvFilters(v => !v)}
        >
          <AureakText
            variant="caption"
            style={[s.advToggleLabel, advFilterCount > 0 && s.advToggleLabelActive] as never}
          >
            {advFilterCount > 0
              ? `Filtres avancés  ·  ${advFilterCount} actif${advFilterCount > 1 ? 's' : ''}`
              : 'Filtres avancés'
            }
          </AureakText>
          <AureakText variant="caption" style={{ color: colors.text.muted, fontSize: 10 }}>
            {showAdvFilters ? '▲' : '▼'}
          </AureakText>
        </Pressable>

        {/* Filtres avancés repliables */}
        {showAdvFilters && (
          <View style={s.advFilters}>
            <FilterRow
              label="Expérience académie"
              tabs={SEASON_TABS}
              active={seasonFilter}
              onSelect={setSeasonFilter}
            />
            <FilterRow
              label="Expérience stage"
              tabs={STAGE_TABS}
              active={stageFilter}
              onSelect={setStageFilter}
            />
            <FilterRow
              label="Année de naissance"
              tabs={BIRTH_YEAR_TABS}
              active={birthYear}
              onSelect={setBirthYear}
            />
          </View>
        )}
      </View>

      {/* ── Grille joueurs — PremiumJoueurCard (Story 25.1) ── */}
      {loading ? (
        <View style={gridStyle as never}>
          {[0,1,2,3,4,5].map(i => <PremiumSkeletonCard key={i} />)}
        </View>
      ) : joueurs.length === 0 ? (
        <View style={s.emptyState}>
          <AureakText variant="h3" style={{ color: colors.text.muted }}>Aucun joueur</AureakText>
          <AureakText variant="caption" style={{ color: colors.text.muted, marginTop: 4 }}>
            {search.trim() ? 'Modifiez votre recherche.' : 'Aucun joueur ne correspond aux filtres.'}
          </AureakText>
        </View>
      ) : (
        <View style={gridStyle as never}>
          {joueurs.map(item => (
            <PremiumJoueurCard
              key={item.id}
              item={item}
            />
          ))}
        </View>
      )}

      {/* ── Pagination ── */}
      {!loading && total > PAGE_SIZE && (
        <Pagination
          page={page}
          total={total}
          onPrev={() => setPage(p => Math.max(0, p - 1))}
          onNext={() => setPage(p => p + 1)}
        />
      )}
    </ScrollView>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.light.primary },
  content  : { padding: space.xl, gap: space.md },

  // En-tête
  header      : { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  headerSub   : { color: colors.text.muted, marginTop: 3, fontSize: 12 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: space.sm },

  // Recherche
  searchRow : { flexDirection: 'row', gap: space.sm, alignItems: 'center' },
  searchInput: {
    flex             : 1,
    backgroundColor  : colors.light.surface,
    borderWidth      : 1,
    borderColor      : colors.border.light,
    borderRadius     : 8,
    paddingHorizontal: space.md,
    paddingVertical  : 9,
    color            : colors.text.dark,
    fontSize         : 13,
  },
  searchBtn: {
    backgroundColor  : colors.light.muted,
    borderWidth      : 1,
    borderColor      : colors.border.light,
    paddingHorizontal: space.md,
    paddingVertical  : 9,
    borderRadius     : 8,
  },
  clearBtn: {
    width          : 34,
    height         : 34,
    alignItems     : 'center',
    justifyContent : 'center',
    borderRadius   : 8,
    borderWidth    : 1,
    borderColor    : colors.border.light,
    backgroundColor: colors.light.surface,
  },
  resetBtn: {
    paddingHorizontal: space.sm,
    paddingVertical  : 5,
    borderRadius     : 6,
    borderWidth      : 1,
    borderColor      : colors.accent.gold + '60',
    backgroundColor  : colors.accent.gold + '08',
  },

  // Bloc filtres
  filtersBlock: { gap: space.sm },

  advToggle: {
    flexDirection    : 'row',
    alignItems       : 'center',
    justifyContent   : 'space-between',
    paddingVertical  : 8,
    paddingHorizontal: 12,
    borderRadius     : 7,
    borderWidth      : 1,
    borderColor      : colors.border.light,
    backgroundColor  : colors.light.surface,
  },
  advToggleOpen: {
    borderColor    : colors.accent.gold + '50',
    backgroundColor: colors.accent.gold + '08',
  },
  advToggleLabel: {
    color     : colors.text.muted,
    fontSize  : 11,
    fontWeight: '600' as never,
  },
  advToggleLabelActive: {
    color: colors.text.dark,
  },
  advFilters: {
    backgroundColor: colors.light.muted,
    borderRadius   : 8,
    borderWidth    : 1,
    borderColor    : colors.border.divider,
    padding        : 12,
    gap            : 12,
  },

  // Grille — gap 16 cohérent avec le CSS grid web (Story 25.5)
  gridFallback: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },

  // État vide
  emptyState: {
    backgroundColor: colors.light.surface,
    borderRadius   : 10,
    padding        : space.xxl,
    alignItems     : 'center',
    borderWidth    : 1,
    borderColor    : colors.border.light,
    ...shadows.sm,
  },
})
