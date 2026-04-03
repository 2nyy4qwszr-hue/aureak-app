'use client'
// Annuaire joueurs — child_directory (import Notion)
// Terminologie officielle : joueur = enfant = child
// Story 18.2 : refonte UI cards + grille responsive + photos + filtres améliorés
// UI v2 : infos gauche · avatar droite · filtres avancés repliables
import React, { useEffect, useState, useCallback, useMemo } from 'react'
import { View, StyleSheet, ScrollView, TextInput, Pressable, Image, Platform } from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { listJoueurs, createChildDirectoryEntry, type JoueurListItem } from '@aureak/api-client'
import { AureakText, Button, EmptyState } from '@aureak/ui'
import { colors, space, shadows, radius } from '@aureak/theme'
import { ACADEMY_STATUS_CONFIG } from '@aureak/business-logic'
import { formatNomPrenom } from '@aureak/types'
import type { AcademyStatus } from '@aureak/types'
import { usePersistedFilters } from '../../../hooks/usePersistedFilters'

const PAGE_SIZE = 50

// ── Filter types ───────────────────────────────────────────────────────────────

type AcadStatusFilter = 'all' | AcademyStatus | 'current-season'
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
          style={[card.metaLine, !dob && card.placeholder] as never}
          accessibilityLabel={!dob ? 'Date de naissance inconnue' : dob}
        >
          {dob || '—'}
        </AureakText>
        <AureakText
          variant="caption"
          style={[card.metaLine, !item.currentClub && card.placeholder] as never}
          numberOfLines={1}
          accessibilityLabel={!item.currentClub ? 'Club inconnu' : item.currentClub}
        >
          {item.currentClub || '—'}
        </AureakText>
        <AureakText
          variant="caption"
          style={[card.metaLine, !item.niveauClub && card.placeholder] as never}
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
    boxShadow: shadows.sm,
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
              <AureakText style={[pZone.infoSubLabel, pZone.infoSubLabelRaised] as never}>
                {item.totalAcademySeasons <= 1 ? 'Saison' : 'Saisons'}
              </AureakText>
            </View>
            <View style={pZone.zoneHistoStage}>
              <AureakText style={pZone.infoValue as never}>{item.totalStages}</AureakText>
              <AureakText style={[pZone.infoSubLabel, pZone.infoSubLabelRaised] as never}>
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
        {/* zone-niveau (x:113→167) — centré dans la zone bleue */}
        <View style={pZone.zoneNiveau}>
          <AureakText style={pZone.infoLabelCenter as never}>NIVEAU</AureakText>
          <StarRating count={item.teamLevelStars ?? 0} />
        </View>
        {/* zone-club (x:205→268) — centré dans la zone verte */}
        <View style={pZone.zoneClub}>
          <AureakText style={pZone.infoLabelCenter as never}>CLUB</AureakText>
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
    boxShadow: shadows.md,
  },
  pressed: { opacity: 0.92 },
})

const pZone = StyleSheet.create({
  // Zone badge — Figma: X=-1556,Y=-1774,W=220,H=200 → scale 0.2732 → top:22, right:12, Ø68
  badge: {
    position      : 'absolute' as never,
    top           : 29,
    right         : 25,
    width         : 68,
    height        : 68,
    alignItems    : 'center',
    justifyContent: 'center',
  },
  badgeImage: {
    width : 68,
    height: 68,
  },

  // Zone nom — Figma prenom(220,175,50,44) nom(146,190,458,76) → aligné droite, -10px left
  nameBlock: {
    position  : 'absolute' as never,
    top       : 175,
    left      : 136,
    right     : 28,
    alignItems: 'flex-end',
    gap       : 2,
  },
  prenomText: {
    fontSize    : 12,
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

  // Rangée infos 1 — conteneur de zones absolues (calibré JPEG)
  infoRow1: {
    position: 'absolute' as never,
    bottom  : 100,
    left    : 0,
    right   : 0,
    height  : 68,
  },
  // zone-date — -10px left → left:39
  zoneDate: {
    position      : 'absolute' as never,
    top           : 0,
    left          : 35,
    width         : 115,
    bottom        : 0,
    alignItems    : 'flex-start',
    justifyContent: 'flex-start',
    gap           : 4,
  },
  // zone-histo — -10px left → left:164
  zoneHisto: {
    position      : 'absolute' as never,
    top           : 0,
    left          : 170,
    right         : 10,
    bottom        : 0,
    alignItems    : 'flex-start',
    justifyContent: 'flex-start',
    gap           : 4,
  },
  historiqueValues: {
    flexDirection: 'row',
    gap          : 0,
    marginLeft   : -5,
  },
  // Saison — centré, sublabel 10px plus haut via gap réduit
  zoneHistoSaison: {
    width     : 36,
    alignItems: 'center',
    gap       : 0,
  },
  // Stage — centré, sublabel 10px plus haut via gap réduit
  zoneHistoStage: {
    paddingLeft: 20,
    flex       : 1,
    alignItems : 'center',
    gap        : 0,
  },

  // Rangée infos 2 — conteneur de zones absolues (calibré JPEG), +5px vers le haut
  infoRow2: {
    position: 'absolute' as never,
    bottom  : 20,
    left    : 0,
    right   : 0,
    height  : 80,
  },
  // zone-equipe — -10px left → left:38
  zoneEquipe: {
    position      : 'absolute' as never,
    top           : 0,
    left          : 38,
    width         : 72,
    bottom        : 0,
    alignItems    : 'flex-start',
    justifyContent: 'flex-start',
    gap           : 4,
  },
  // zone-niveau — -10px left → left:102
  zoneNiveau: {
    position      : 'absolute' as never,
    top           : 0,
    left          : 95,
    width         : 93,
    bottom        : 0,
    alignItems    : 'center',
    justifyContent: 'flex-start',
    gap           : 4,
  },
  // zone-club — -10px left → left:218, right:18
  zoneClub: {
    position      : 'absolute' as never,
    top           : 0,
    left          : 200,
    right         : 30,
    bottom        : 0,
    alignItems    : 'center',
    justifyContent: 'flex-start',
    gap           : 4,
  },
  // Figma W:100,H:100 → 100×0.2732 = 27px
  clubLogo: {
    width : 27,
    height: 27,
  },
  clubLogoFallback: {
    width          : 27,
    height         : 27,
    borderRadius   : 14,
    backgroundColor: 'rgba(212,175,55,0.30)',
    alignItems     : 'center',
    justifyContent : 'center',
  },
  clubLogoFallbackText: {
    fontSize  : 8,
    fontWeight: '700',
    color     : colors.accent.gold,
  },

  // Styles texte communs aux zones infos
  infoLabel: {
    width       : '100%' as never,
    fontSize    : 8,
    color       : 'rgba(80,80,80,0.75)',
    letterSpacing: 0.8,
    textTransform: 'uppercase' as never,
    fontWeight  : '600' as never,
  },
  // Variante centrée pour zones niveau et club
  infoLabelCenter: {
    width       : '100%' as never,
    fontSize    : 8,
    color       : 'rgba(80,80,80,0.75)',
    letterSpacing: 0.8,
    textTransform: 'uppercase' as never,
    fontWeight  : '600' as never,
    textAlign   : 'center' as never,
  },
  infoValue: {
    width     : '100%' as never,
    fontSize  : 18,
    color     : 'rgba(10,10,10,0.90)',
    fontWeight: '800' as never,
  },
  infoSubLabel: {
    width     : '100%' as never,
    fontSize  : 8,
    color     : 'rgba(80,80,80,0.65)',
    fontWeight: '500' as never,
  },
  // Saison/Stage : remonte de 10px
  infoSubLabelRaised: {
    marginTop: -7,
    marginRight: 10
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
    boxShadow: shadows.sm,
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
  const params = useLocalSearchParams<{ search?: string; status?: string; season?: string; stage?: string; birthYear?: string }>()

  const [joueurs,            setJoueurs]            = useState<JoueurListItem[]>([])
  const [total,              setTotal]              = useState(0)
  const [page,               setPage]               = useState(0)
  const [loading,            setLoading]            = useState(true)
  const [showAdvFilters,     setShowAdvFilters]     = useState(false)

  const [searchInput,  setSearchInput]  = useState(params.search ?? '')
  const [search,       setSearch]       = useState(params.search ?? '')
  const [acadStatus,   setAcadStatus]   = usePersistedFilters<AcadStatusFilter>(
    'children-filter-acadStatus',
    (params.status as AcadStatusFilter | undefined) ?? 'all',
  )
  const [seasonFilter, setSeasonFilter] = usePersistedFilters<SeasonFilter>(
    'children-filter-season',
    (params.season as SeasonFilter | undefined) ?? 'all',
  )
  const [stageFilter,  setStageFilter]  = usePersistedFilters<StageFilter>(
    'children-filter-stage',
    (params.stage as StageFilter | undefined) ?? 'all',
  )
  const [birthYear,    setBirthYear]    = usePersistedFilters<string>(
    'children-filter-birthYear',
    params.birthYear ?? 'all',
  )

  // Sync filters to URL so the browser Back button restores state
  useEffect(() => {
    router.setParams({
      search   : search || undefined,
      status   : acadStatus   !== 'all' ? acadStatus   : undefined,
      season   : seasonFilter !== 'all' ? seasonFilter : undefined,
      stage    : stageFilter  !== 'all' ? stageFilter  : undefined,
      birthYear: birthYear    !== 'all' ? birthYear    : undefined,
    } as never)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, acadStatus, seasonFilter, stageFilter, birthYear])

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

  // Extrait "2025-2026" depuis "AK.2025-2026" ou tout autre format — résistant aux préfixes DB
  const seasonYearRange = useMemo(
    () => currentSeasonLabel?.match(/\d{4}-\d{4}/)?.[0] ?? null,
    [currentSeasonLabel]
  )

  const acadStatusTabs = useMemo<{ key: AcadStatusFilter; label: string }[]>(() => [
    { key: 'all',               label: 'Tous'                                                        },
    { key: 'current-season',    label: seasonYearRange ?? 'Saison actuelle'                          },
    { key: 'NOUVEAU_ACADÉMICIEN', label: 'Nouveau'                                                   },
    { key: 'ANCIEN',            label: 'Ancien'                                                      },
    { key: 'STAGE_UNIQUEMENT',  label: 'Stage seul'                                                  },
    { key: 'PROSPECT',          label: 'Prospect'                                                    },
  ], [seasonYearRange])

  const load = useCallback(async () => {
    // Aucune saison active configurée → filtre 'current-season' retourne 0 résultat (pas tous les joueurs)
    if (acadStatus === 'current-season' && !seasonYearRange) {
      setJoueurs([])
      setTotal(0)
      return
    }
    setLoading(true)
    try {
      const { data, count } = await listJoueurs({
        search         : search || undefined,
        computedStatus : (acadStatus !== 'all' && acadStatus !== 'current-season') ? acadStatus : undefined,
        academySaison  : acadStatus === 'current-season' ? (seasonYearRange ?? undefined) : undefined,
        totalSeasonsCmp: seasonFilter !== 'all' ? seasonFilter : undefined,
        totalStagesCmp : stageFilter  !== 'all' ? stageFilter  : undefined,
        birthYear      : birthYear !== 'all' ? birthYear : undefined,
        page,
        pageSize: PAGE_SIZE,
      })
      setJoueurs(data)
      setTotal(count)
    } catch (e) {
      if (process.env.NODE_ENV !== 'production') console.error('[JoueursPage] load error', e)
    } finally {
      setLoading(false)
    }
  }, [search, acadStatus, seasonFilter, stageFilter, birthYear, page, seasonYearRange])

  useEffect(() => { load() }, [load])
  useEffect(() => { setPage(0) }, [search, acadStatus, seasonFilter, stageFilter, birthYear, seasonYearRange])

  const handleSearch = () => setSearch(searchInput.trim())

  const handleResetFilters = () => {
    setAcadStatus('all')
    setSeasonFilter('all')
    setStageFilter('all')
    setBirthYear('all')
  }

  // ── CSV Import ──────────────────────────────────────────────────────────────
  const [showImportModal, setShowImportModal] = useState(false)
  const [csvPreview,      setCsvPreview]      = useState<Record<string, string>[]>([])
  const [csvError,        setCsvError]        = useState<string | null>(null)
  const [importing,       setImporting]       = useState(false)
  const [importResult,    setImportResult]    = useState<{ ok: number; err: number } | null>(null)

  const handleCsvFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setCsvError(null)
    setCsvPreview([])
    setImportResult(null)
    const reader = new FileReader()
    reader.onload = (evt) => {
      const text = evt.target?.result as string
      const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
      if (lines.length < 2) { setCsvError('Le fichier doit contenir au moins une ligne de données.'); return }
      const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''))
      const rows = lines.slice(1).map(line => {
        const vals = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''))
        return Object.fromEntries(headers.map((h, i) => [h, vals[i] ?? '']))
      })
      setCsvPreview(rows.slice(0, 5))
    }
    reader.readAsText(file, 'utf-8')
  }

  const handleImportCsv = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (csvPreview.length === 0) return
    const fileInput = (e.currentTarget.elements.namedItem('csvFile') as HTMLInputElement)
    const file = fileInput?.files?.[0]
    if (!file) return
    setImporting(true)
    setCsvError(null)
    try {
      const text  = await file.text()
      const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
      const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''))
      const rows = lines.slice(1).map(line => {
        const vals = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''))
        return Object.fromEntries(headers.map((h, i) => [h, vals[i] ?? '']))
      })
      // Récupérer le tenant_id depuis la session
      const { supabase } = await import('@aureak/api-client')
      const { data: { session } } = await supabase.auth.getSession()
      const tenantId = (session?.user?.app_metadata?.tenant_id ?? session?.user?.user_metadata?.tenant_id ?? '') as string
      let ok = 0, errCount = 0
      for (const row of rows) {
        const displayName = row['displayName'] || row['display_name'] || row['nom_complet'] || `${row['prenom'] ?? ''} ${row['nom'] ?? ''}`.trim()
        if (!displayName) { errCount++; continue }
        try {
          await createChildDirectoryEntry({
            tenantId,
            displayName,
            nom        : row['nom']        || null,
            prenom     : row['prenom']     || null,
            birthDate  : row['birthDate']  || row['birth_date']  || null,
            statut     : row['statut']     || null,
            currentClub: row['currentClub']|| row['current_club']|| null,
          })
          ok++
        } catch {
          errCount++
        }
      }
      setImportResult({ ok, err: errCount })
      if (ok > 0) { await load() }
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[CsvImport] error:', err)
      setCsvError('Erreur lors du traitement du fichier.')
    } finally {
      setImporting(false)
    }
  }

  // ── Bulk selection ──────────────────────────────────────────────────────────
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkMode,    setBulkMode]    = useState(false)

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectAll   = () => setSelectedIds(new Set(joueurs.map(j => j.id)))
  const deselectAll = () => setSelectedIds(new Set())

  const handleExportCSV = () => {
    const targets = joueurs.filter(j => selectedIds.has(j.id))
    const header  = ['id', 'nom', 'prenom', 'displayName', 'statut', 'club', 'actif', 'nbSaisons', 'nbStages'].join(',')
    const rows = targets.map(j => [
      j.id,
      j.nom ?? '',
      j.prenom ?? '',
      j.displayName,
      j.computedStatus ?? '',
      j.currentClub ?? '',
      j.inCurrentSeason ? 'oui' : 'non',
      j.totalAcademySeasons ?? 0,
      j.totalStages ?? 0,
    ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
    const csv  = [header, ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url
    a.download = `joueurs-selection-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // CSS grid natif web — colonnes fixes 280px (Story 25.5 — ratio exact avec le background 560×840)
  const gridStyle = Platform.OS === 'web'
    ? { display: 'grid' as never, gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 280px))', gap: 16 }
    : s.gridFallback

  return (
    <>
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
          <Pressable
            style={{
              paddingHorizontal: space.md,
              paddingVertical  : 6,
              borderRadius     : 6,
              borderWidth      : 1,
              borderColor      : colors.border.light,
              backgroundColor  : colors.light.surface,
            }}
            onPress={() => { setCsvPreview([]); setCsvError(null); setImportResult(null); setShowImportModal(true) }}
          >
            <AureakText variant="caption" style={{ color: colors.text.muted, fontWeight: '600' }}>
              Importer CSV
            </AureakText>
          </Pressable>
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
          onSelect={(v) => setAcadStatus(v as AcadStatusFilter)}
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
              onSelect={(v) => setSeasonFilter(v as SeasonFilter)}
            />
            <FilterRow
              label="Expérience stage"
              tabs={STAGE_TABS}
              active={stageFilter}
              onSelect={(v) => setStageFilter(v as StageFilter)}
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

      {/* ── Barre bulk actions ── */}
      {Platform.OS === 'web' && !loading && joueurs.length > 0 && (
        <View style={s.bulkBar}>
          <Pressable onPress={() => { setBulkMode(v => !v); deselectAll() }}>
            <AureakText variant="caption" style={{ color: colors.text.muted }}>
              {bulkMode ? 'Quitter la sélection' : 'Sélectionner'}
            </AureakText>
          </Pressable>
          {bulkMode && (
            <>
              <Pressable onPress={selectedIds.size === joueurs.length ? deselectAll : selectAll}>
                <AureakText variant="caption" style={{ color: colors.accent.gold, fontWeight: '700' as never }}>
                  {selectedIds.size === joueurs.length ? 'Tout désélectionner' : 'Tout sélectionner'}
                </AureakText>
              </Pressable>
              {selectedIds.size > 0 && (
                <>
                  <AureakText variant="caption" style={{ color: colors.text.muted }}>
                    {selectedIds.size} sélectionné{selectedIds.size > 1 ? 's' : ''}
                  </AureakText>
                  <Pressable style={s.bulkBtn} onPress={handleExportCSV}>
                    <AureakText variant="caption" style={{ color: colors.text.dark, fontWeight: '700' as never }}>
                      Exporter CSV
                    </AureakText>
                  </Pressable>
                </>
              )}
            </>
          )}
        </View>
      )}

      {/* ── Grille joueurs — PremiumJoueurCard (Story 25.1) ── */}
      {loading ? (
        <View style={gridStyle as never}>
          {[0,1,2,3,4,5].map(i => <PremiumSkeletonCard key={i} />)}
        </View>
      ) : joueurs.length === 0 ? (
        <EmptyState
          icon="⚽"
          title="Aucun joueur trouvé"
          subtitle={search.trim() ? 'Modifiez votre recherche.' : 'Modifiez vos filtres ou ajoutez un nouveau joueur.'}
          ctaLabel="Ajouter un joueur"
          onCta={() => router.push('/children/new' as never)}
        />
      ) : (
        <View style={gridStyle as never}>
          {joueurs.map(item => (
            <View key={item.id} style={{ position: 'relative' as never }}>
              {bulkMode && Platform.OS === 'web' && (
                <Pressable
                  onPress={() => toggleSelect(item.id)}
                  style={[s.checkboxOverlay, selectedIds.has(item.id) && s.checkboxActive]}
                >
                  <AureakText variant="caption" style={{ color: selectedIds.has(item.id) ? colors.accent.gold : colors.text.subtle, fontWeight: '700' as never }}>
                    {selectedIds.has(item.id) ? '☑' : '☐'}
                  </AureakText>
                </Pressable>
              )}
              <PremiumJoueurCard
                item={item}
              />
            </View>
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

    {/* ── Modal import CSV ── */}
    {showImportModal && (
      <div
        onClick={() => setShowImportModal(false)}
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.35)', zIndex: 100,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32,
        }}
      >
        <div
          onClick={e => e.stopPropagation()}
          style={{
            backgroundColor: colors.light.surface,
            borderRadius   : 12,
            padding        : 24,
            width          : '100%',
            maxWidth       : 520,
            display        : 'flex',
            flexDirection  : 'column',
            gap            : 16,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 16, fontWeight: 700, color: colors.text.dark }}>Importer des joueurs depuis un CSV</span>
            <button onClick={() => setShowImportModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: colors.text.muted }}>✕</button>
          </div>

          <div style={{ fontSize: 12, color: colors.text.muted }}>
            Format attendu : colonnes <code>displayName</code> (ou <code>nom</code> + <code>prenom</code>),
            optionnelles : <code>statut</code>, <code>currentClub</code>, <code>birthDate</code>.
          </div>

          <form onSubmit={handleImportCsv} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <input
              type="file"
              name="csvFile"
              accept=".csv,text/csv"
              onChange={handleCsvFile}
              style={{ fontSize: 13 }}
            />

            {csvError && (
              <span style={{ fontSize: 12, color: colors.accent.red }}>{csvError}</span>
            )}

            {csvPreview.length > 0 && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: colors.text.muted, textTransform: 'uppercase', marginBottom: 6 }}>
                  Aperçu ({csvPreview.length} premières lignes)
                </div>
                <div style={{ overflow: 'auto', fontSize: 11, backgroundColor: colors.light.muted, borderRadius: 6, padding: 8 }}>
                  {csvPreview.map((row, i) => (
                    <div key={i} style={{ marginBottom: 4, color: colors.text.dark }}>
                      {Object.entries(row).slice(0, 5).map(([k, v]) => `${k}: ${v}`).join(' · ')}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {importResult && (
              <div style={{ fontSize: 13, color: importResult.err === 0 ? colors.status.present : colors.status.attention, fontWeight: 600 }}>
                {importResult.ok} importé{importResult.ok > 1 ? 's' : ''}{importResult.err > 0 ? `, ${importResult.err} erreur(s)` : ''}.
              </div>
            )}

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                style={{ padding: '8px 16px', borderRadius: 6, border: `1px solid ${colors.border.light}`, background: 'none', cursor: 'pointer', fontSize: 13, color: colors.text.muted }}
              >
                Fermer
              </button>
              <button
                type="submit"
                disabled={csvPreview.length === 0 || importing}
                style={{
                  padding: '8px 16px', borderRadius: 6, border: 'none',
                  backgroundColor: csvPreview.length > 0 && !importing ? colors.accent.gold : colors.light.muted,
                  cursor: csvPreview.length > 0 && !importing ? 'pointer' : 'not-allowed',
                  fontSize: 13, fontWeight: 700, color: colors.light.primary,
                }}
              >
                {importing ? 'Import en cours…' : 'Importer'}
              </button>
            </div>
          </form>
        </div>
      </div>
    )}
    </>
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

  // Bulk actions bar
  bulkBar: {
    flexDirection   : 'row',
    alignItems      : 'center',
    gap             : 12,
    paddingVertical : 8,
    paddingHorizontal: 12,
    backgroundColor : colors.light.surface,
    borderRadius    : 8,
    borderWidth     : 1,
    borderColor     : colors.border.divider,
  },
  bulkBtn: {
    paddingHorizontal: 12,
    paddingVertical  : 6,
    borderRadius     : 6,
    backgroundColor  : colors.accent.gold,
  },
  checkboxOverlay: {
    position   : 'absolute',
    top        : 8,
    left       : 8,
    zIndex     : 10,
    width      : 28,
    height     : 28,
    borderRadius: 6,
    backgroundColor: colors.light.surface,
    borderWidth: 1,
    borderColor: colors.border.light,
    alignItems : 'center',
    justifyContent: 'center',
    boxShadow: shadows.sm,
  },
  checkboxActive: {
    borderColor    : colors.accent.gold,
    backgroundColor: colors.accent.gold + '18',
  },
})
