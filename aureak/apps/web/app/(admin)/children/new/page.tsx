'use client'
// Formulaire de création d'un joueur dans l'annuaire child_directory
// Story 18.4 — bouton "Ajouter un joueur" + page de création
// Story 22.1A — Historique académique dès la création (saisons académie + suggestion statut)
// Terminologie : joueur = enfant = child

import React, { useState, useEffect, useMemo, useRef } from 'react'
import {
  View, StyleSheet, ScrollView, Pressable, Switch, TextInput, type TextStyle,
} from 'react-native'
import { useRouter } from 'expo-router'
import {
  createChildDirectoryEntry,
  listAcademySeasons,
  addChildAcademyMembership,
  listClubDirectory,
} from '@aureak/api-client'
import { useAuthStore } from '@aureak/business-logic'
import { AureakText, Input, Button } from '@aureak/ui'
import { colors, space, shadows, radius } from '@aureak/theme'
import { FOOTBALL_TEAM_LEVELS } from '@aureak/types'
import type { AcademySeason } from '@aureak/types'
import { useToast } from '../../../../components/ToastContext'

// ── Statuts disponibles ────────────────────────────────────────────────────────
// Valeurs string libres — ne pas confondre avec AcademyStatus (computed depuis la vue)

const STATUT_OPTIONS = ['Académicien', 'Nouveau', 'Ancien', 'Stagiaire', 'Prospect'] as const
type StatutOption = (typeof STATUT_OPTIONS)[number]

// ── Main ───────────────────────────────────────────────────────────────────────

export default function NewJoueurPage() {
  const router   = useRouter()
  const tenantId = useAuthStore((s) => s.tenantId)
  const toast    = useToast()

  // ── Form state ────────────────────────────────────────────────────────────────
  const [nom,       setNom]       = useState('')
  const [prenom,    setPrenom]    = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [statut,    setStatut]    = useState<StatutOption | ''>('')
  const [actif,     setActif]     = useState(true)

  // ── Club autocomplete state (Story 22.1B) ─────────────────────────────────────
  const [clubQuery,       setClubQuery]       = useState('')
  const [currentClub,     setCurrentClub]     = useState<string | null>(null)
  const [clubDirectoryId, setClubDirectoryId] = useState<string | null>(null)
  const [clubResults,     setClubResults]     = useState<Array<{ id: string; nom: string; ville: string | null }>>([])
  const [clubLoading,     setClubLoading]     = useState(false)
  const clubDebounceRef  = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Compteur de génération pour ignorer les résultats d'appels API périmés (M2)
  const clubSearchGenRef = useRef(0)

  // ── Niveau de compétition state (Story 22.1B) ─────────────────────────────────
  const [niveauClub, setNiveauClub] = useState<string | null>(null)

  // ── Académie state (Story 22.1A) ──────────────────────────────────────────────
  const [seasons,           setSeasons]           = useState<AcademySeason[]>([])
  const [seasonsLoading,    setSeasonsLoading]    = useState(true)
  const [seasonsError,      setSeasonsError]      = useState(false)
  const [selectedSeasonIds, setSelectedSeasonIds] = useState<string[]>([])
  const [enrollWarning,     setEnrollWarning]     = useState<string | null>(null)

  // Ref pour éviter que la suggestion écrase un statut choisi manuellement (AC: #4)
  const statutManuallyOverridden = useRef(false)
  // Ref pour annuler le setTimeout de navigation en cas de démontage ou annulation (M1)
  const navTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── UI state ──────────────────────────────────────────────────────────────────
  const [saving,    setSaving]    = useState(false)
  const [error,     setError]     = useState<string | null>(null)
  const [nomError,  setNomError]  = useState<string | null>(null)
  const [dateError, setDateError] = useState<string | null>(null)

  // ── Chargement des saisons académie au montage ────────────────────────────────
  useEffect(() => {
    listAcademySeasons()
      .then(({ data }) => { setSeasons(data); setSeasonsLoading(false) })
      .catch(() => { setSeasonsError(true); setSeasonsLoading(false) })
    // Nettoyage des timers au démontage (M1 — évite double navigation + fuite mémoire debounce)
    return () => {
      if (navTimerRef.current)    clearTimeout(navTimerRef.current)
      if (clubDebounceRef.current) clearTimeout(clubDebounceRef.current)
    }
  }, [])

  // ── Suggestion automatique du statut (AC: #3) ─────────────────────────────────
  const suggestedStatut = useMemo<StatutOption | ''>(() => {
    if (selectedSeasonIds.length === 0) return ''
    const hasCurrent = seasons.some(s => s.isCurrent && selectedSeasonIds.includes(s.id))
    const pastCount  = seasons.filter(s => !s.isCurrent && selectedSeasonIds.includes(s.id)).length
    if (hasCurrent && pastCount >= 1) return 'Académicien'
    if (hasCurrent && pastCount === 0) return 'Nouveau'
    if (!hasCurrent && pastCount > 0) return 'Ancien'
    return ''
  }, [selectedSeasonIds, seasons])

  // Applique la suggestion si l'admin n'a pas encore sélectionné manuellement (AC: #3, #4)
  useEffect(() => {
    if (!statutManuallyOverridden.current) {
      setStatut(suggestedStatut)
    }
  }, [suggestedStatut])

  // ── Handlers ──────────────────────────────────────────────────────────────────

  /** Click sur un pill de statut — marque l'override manuel (AC: #4) */
  const handleStatutClick = (opt: StatutOption) => {
    statutManuallyOverridden.current = true
    setStatut(prev => prev === opt ? '' : opt)
  }

  /** Frappe dans le champ club — debounce 300ms avant appel API (AC: #2, #3)
   *  Note : currentClub n'est PAS mis à jour ici — uniquement via handleClubSelect
   *  (AC #7 : texte tapé sans sélection → currentClub reste null en base) */
  const handleClubChange = (text: string) => {
    setClubQuery(text)
    // M1 fix : ne pas persister le texte libre — seule la sélection dropdown compte
    setClubDirectoryId(null)
    if (clubDebounceRef.current) clearTimeout(clubDebounceRef.current)
    if (text.length < 2) { setClubResults([]); return }
    // M2 fix : compteur de génération pour ignorer les résultats périmés
    const gen = ++clubSearchGenRef.current
    clubDebounceRef.current = setTimeout(async () => {
      setClubLoading(true)
      try {
        const { data } = await listClubDirectory({ search: text, actif: true, pageSize: 8 })
        if (gen === clubSearchGenRef.current) {
          setClubResults(data.map(c => ({ id: c.id, nom: c.nom, ville: c.ville })))
        }
      } catch { if (gen === clubSearchGenRef.current) setClubResults([]) }
      if (gen === clubSearchGenRef.current) setClubLoading(false)
    }, 300)
  }

  /** Sélection d'un club dans le dropdown — lie nom + UUID (AC: #5) */
  const handleClubSelect = (club: { id: string; nom: string; ville: string | null }) => {
    setClubQuery(club.nom)
    setCurrentClub(club.nom)
    setClubDirectoryId(club.id)
    setClubResults([])
    setClubLoading(false)
  }

  /** Efface la sélection de club (AC: #6) */
  const clearClub = () => {
    setClubQuery('')
    setCurrentClub(null)
    setClubDirectoryId(null)
    setClubResults([])
    setClubLoading(false)                                    // M3 fix : reset loading
    clubSearchGenRef.current++                               // M2 fix : invalide in-flight
    if (clubDebounceRef.current) clearTimeout(clubDebounceRef.current)
  }

  /** Toggle de sélection d'une saison académie */
  const toggleSeason = (seasonId: string) => {
    setSelectedSeasonIds(prev =>
      prev.includes(seasonId)
        ? prev.filter(id => id !== seasonId)
        : [...prev, seasonId],
    )
  }

  const handleSave = async () => {
    // Validation
    if (!nom.trim()) {
      setNomError('Le nom est requis.')
      return
    }
    const trimmedBirthDate = birthDate.trim()
    if (trimmedBirthDate && !/^\d{4}-\d{2}-\d{2}$/.test(trimmedBirthDate)) {
      setDateError('Format de date invalide. Attendu : AAAA-MM-JJ')
      return
    }
    if (!tenantId) {
      setError('Session invalide. Veuillez vous reconnecter.')
      return
    }

    // displayName auto-calculé depuis nom + prénom
    const displayName = [nom.trim(), prenom.trim()].filter(Boolean).join(' ')

    setNomError(null)
    setDateError(null)
    setError(null)
    setEnrollWarning(null)
    setSaving(true)

    try {
      // 1. Création du joueur (AC: #5)
      const entry = await createChildDirectoryEntry({
        tenantId,
        displayName,
        nom            : nom.trim()       || null,
        prenom         : prenom.trim()    || null,
        birthDate      : trimmedBirthDate || null,
        statut         : statut           || null,
        currentClub    : currentClub      || null,
        niveauClub     : niveauClub       || null,
        clubDirectoryId: clubDirectoryId,
        actif,
      })

      // 2. Enrôlement dans les saisons sélectionnées (AC: #5, #6)
      if (selectedSeasonIds.length > 0) {
        const results = await Promise.allSettled(
          selectedSeasonIds.map(seasonId =>
            addChildAcademyMembership({ tenantId, childId: entry.id, seasonId }),
          ),
        )
        const failedCount = results.filter(r => r.status === 'rejected').length
        if (failedCount > 0) {
          // Warning non-bloquant — navigation maintenue après délai (AC: #8)
          setEnrollWarning(
            `${failedCount} inscription(s) académique(s) n'ont pas pu être enregistrées. ` +
            'Vous pouvez les ajouter depuis la fiche joueur.',
          )
          navTimerRef.current = setTimeout(
            () => router.replace(`/children/${entry.id}` as never),
            2000,
          )
          return
        }
      }

      const displayNameFinal = [nom.trim(), prenom.trim()].filter(Boolean).join(' ')
      toast.success(`Joueur "${displayNameFinal}" créé avec succès.`)
      router.replace(`/children/${entry.id}` as never)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erreur lors de la création du joueur.'
      setError(msg)
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>

      {/* ── Navigation ── */}
      <Pressable onPress={() => router.back()} style={s.backRow}>
        <AureakText variant="caption" style={{ color: colors.accent.gold }}>← Retour</AureakText>
      </Pressable>

      {/* ── Titre ── */}
      <View style={s.titleRow}>
        <AureakText variant="h2" color={colors.accent.gold}>Nouveau joueur</AureakText>
      </View>

      {/* ── IDENTITÉ ── */}
      <View style={s.card}>
        <AureakText variant="caption" style={s.sectionLabel}>IDENTITÉ</AureakText>

        <Input
          label="Nom *"
          value={nom}
          onChangeText={v => { setNom(v); if (nomError) setNomError(null) }}
          placeholder="ex: DUPONT"
          variant="light"
          autoCapitalize="characters"
          error={nomError ?? undefined}
        />

        <Input
          label="Prénom"
          value={prenom}
          onChangeText={v => { setPrenom(v); if (nomError) setNomError(null) }}
          placeholder="ex: Marie"
          variant="light"
          autoCapitalize="words"
          style={{ marginTop: space.sm }}
        />

        <Input
          label="Date de naissance"
          value={birthDate}
          onChangeText={v => { setBirthDate(v); if (dateError) setDateError(null) }}
          placeholder="AAAA-MM-JJ"
          variant="light"
          autoComplete="off"
          style={{ marginTop: space.sm }}
          error={dateError ?? undefined}
        />

        {/* Statut — pills avec suggestion automatique */}
        <View style={{ marginTop: space.sm, gap: 6 }}>
          <AureakText variant="label" style={{ color: colors.text.muted }}>Statut</AureakText>
          <View style={s.pillRow}>
            {STATUT_OPTIONS.map(opt => (
              <Pressable
                key={opt}
                style={[s.pill, statut === opt && s.pillActive]}
                onPress={() => handleStatutClick(opt)}
              >
                <AureakText
                  variant="caption"
                  style={{ color: statut === opt ? colors.accent.gold : colors.text.muted, fontWeight: (statut === opt ? '700' : '400') as TextStyle['fontWeight'] }}
                >
                  {opt}
                </AureakText>
              </Pressable>
            ))}
          </View>
          {/* Indicateur de suggestion automatique */}
          {suggestedStatut !== '' && statut === suggestedStatut && selectedSeasonIds.length > 0 && (
            <AureakText variant="caption" style={s.suggestionHint}>
              Statut suggéré automatiquement d'après les saisons sélectionnées.
            </AureakText>
          )}
        </View>
      </View>

      {/* ── CLUB ACTUEL (Story 22.1B — autocomplete + niveau pills) ── */}
      <View style={[s.card, { zIndex: 20 }]}>
        <AureakText variant="caption" style={s.sectionLabel}>CLUB ACTUEL</AureakText>
        <AureakText variant="caption" style={s.academieHint}>
          Optionnel — sélectionne depuis l'annuaire pour lier le joueur au club.
        </AureakText>

        {/* Autocomplétion club — AC: #1-#6 */}
        <View style={{ position: 'relative' as never, zIndex: 10 }}>
          <View style={s.clubInputRow}>
            <TextInput
              style={s.clubTextInput}
              value={clubQuery}
              onChangeText={handleClubChange}
              onBlur={() => setTimeout(() => setClubResults([]), 200)}
              placeholder="Rechercher un club (min. 2 caractères)…"
              placeholderTextColor={colors.text.muted}
              autoComplete="off"
              autoCorrect={false}
              autoCapitalize="none"
            />
            {clubLoading && (
              <AureakText variant="caption" style={s.clubLoadingDot}>…</AureakText>
            )}
            {clubDirectoryId !== null && (
              <Pressable style={s.clubClearBtn} onPress={clearClub}>
                <AureakText variant="caption" style={{ color: colors.text.muted, fontSize: 16, lineHeight: 20 }}>✕</AureakText>
              </Pressable>
            )}
          </View>

          {clubResults.length > 0 && (
            <View style={s.clubDropdown}>
              {clubResults.map(c => (
                <Pressable key={c.id} style={s.clubDropdownItem} onPress={() => handleClubSelect(c)}>
                  <AureakText variant="caption" style={{ color: colors.text.dark, fontSize: 12 }}>
                    {c.nom}{c.ville ? ` — ${c.ville}` : ''}
                  </AureakText>
                </Pressable>
              ))}
            </View>
          )}
        </View>

        {clubDirectoryId !== null && (
          <AureakText variant="caption" style={{ color: colors.accent.gold, fontSize: 11, marginTop: 2 }}>
            ✓ Club lié à l'annuaire
          </AureakText>
        )}

        {/* Niveau de compétition — pills standardisés (AC: #8-#10) */}
        <View style={{ marginTop: space.sm, gap: 6 }}>
          <AureakText variant="label" style={{ color: colors.text.muted }}>Niveau de compétition</AureakText>
          <View style={s.pillRow}>
            {FOOTBALL_TEAM_LEVELS.map(level => (
              <Pressable
                key={level}
                style={[s.pill, niveauClub === level && s.pillActive]}
                onPress={() => setNiveauClub(prev => prev === level ? null : level)}
              >
                <AureakText
                  variant="caption"
                  style={{ color: niveauClub === level ? colors.accent.gold : colors.text.muted, fontWeight: (niveauClub === level ? '700' : '400') as TextStyle['fontWeight'] }}
                >
                  {level}
                </AureakText>
              </Pressable>
            ))}
          </View>
        </View>
      </View>

      {/* ── ACADÉMIE (Story 22.1A) ── */}
      <View style={s.card}>
        <AureakText variant="caption" style={s.sectionLabel}>ACADÉMIE</AureakText>
        <AureakText variant="caption" style={s.academieHint}>
          Optionnel — sélectionne les saisons où ce joueur était à l'académie Aureak.
          La saison courante est marquée d'une étoile (★).
        </AureakText>

        {seasonsLoading ? (
          <AureakText variant="caption" style={s.italicMuted}>Chargement des saisons…</AureakText>
        ) : seasonsError ? (
          <AureakText variant="caption" style={[s.italicMuted, { color: colors.status.attention }] as never}>
            Impossible de charger les saisons. La section académie sera disponible depuis la fiche joueur après création.
          </AureakText>
        ) : seasons.length === 0 ? (
          <AureakText variant="caption" style={s.italicMuted}>
            Aucune saison académie disponible. Créez-en depuis la gestion de l'académie.
          </AureakText>
        ) : (
          <View style={s.pillRow}>
            {seasons.map(season => {
              const selected = selectedSeasonIds.includes(season.id)
              return (
                <Pressable
                  key={season.id}
                  style={[s.pill, selected && s.pillActive]}
                  onPress={() => toggleSeason(season.id)}
                >
                  <AureakText
                    variant="caption"
                    style={{
                      fontSize  : 11,
                      color     : selected ? colors.accent.gold : colors.text.muted,
                      fontWeight: (selected ? '700' : '400') as TextStyle['fontWeight'],
                    }}
                  >
                    {season.label}{season.isCurrent ? ' ★' : ''}
                  </AureakText>
                </Pressable>
              )
            })}
          </View>
        )}

        {selectedSeasonIds.length > 0 && (
          <AureakText variant="caption" style={{ color: colors.accent.gold, fontSize: 11, marginTop: 4 }}>
            {selectedSeasonIds.length} saison{selectedSeasonIds.length > 1 ? 's' : ''} sélectionnée{selectedSeasonIds.length > 1 ? 's' : ''}
          </AureakText>
        )}
      </View>

      {/* ── OPTIONS ── */}
      <View style={s.card}>
        <AureakText variant="caption" style={s.sectionLabel}>OPTIONS</AureakText>

        <View style={s.switchRow}>
          <AureakText variant="body" style={{ color: colors.text.dark }}>Joueur actif</AureakText>
          <Switch
            value={actif}
            onValueChange={setActif}
            trackColor={{ false: colors.border.light, true: colors.accent.gold + '80' }}
            thumbColor={actif ? colors.accent.gold : colors.text.muted}
          />
        </View>
      </View>

      {/* ── Warning inscription académique non-bloquant (AC: #8) ── */}
      {enrollWarning && (
        <View style={s.warningBox}>
          <AureakText variant="caption" style={{ color: colors.accent.gold }}>
            ⚠ {enrollWarning}
          </AureakText>
        </View>
      )}

      {/* ── Erreur globale ── */}
      {error && (
        <View style={s.errorBox}>
          <AureakText variant="caption" style={{ color: colors.status.attention }}>
            {error}
          </AureakText>
        </View>
      )}

      {/* ── Actions ── */}
      <View style={s.actions}>
        <Pressable
          style={s.cancelBtn}
          onPress={() => { if (navTimerRef.current) clearTimeout(navTimerRef.current); router.back() }}
          disabled={saving}
        >
          <AureakText variant="caption" style={{ color: colors.text.muted }}>Annuler</AureakText>
        </Pressable>
        <Button
          label={saving ? 'Création…' : 'Créer le joueur'}
          variant="primary"
          onPress={handleSave}
          disabled={saving}
          loading={saving}
        />
      </View>

    </ScrollView>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.light.primary },
  content  : { padding: space.xl, gap: space.md, maxWidth: 600 },

  backRow  : { marginBottom: space.xs },
  titleRow : { marginBottom: space.xs },

  card: {
    backgroundColor: colors.light.surface,
    borderRadius   : 10,
    borderWidth    : 1,
    borderColor    : colors.border.light,
    padding        : space.md,
    gap            : space.xs,
    boxShadow: shadows.sm,
  },

  sectionLabel: {
    color        : colors.text.muted,
    fontSize     : 10,
    fontWeight   : '700' as never,
    letterSpacing: 1,
    textTransform: 'uppercase' as never,
    marginBottom : 4,
  },

  pillRow: {
    flexDirection: 'row',
    flexWrap     : 'wrap',
    gap          : 6,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical  : 5,
    borderRadius     : 12,
    borderWidth      : 1,
    borderColor      : colors.border.light,
    backgroundColor  : 'transparent',
  },
  pillActive: {
    borderColor    : colors.accent.gold,
    backgroundColor: colors.accent.gold + '15',
  },

  // Hints texte
  suggestionHint: {
    color     : colors.text.muted,
    fontSize  : 10,
    fontStyle : 'italic' as never,
    marginTop : 2,
  },
  academieHint: {
    color    : colors.text.muted,
    fontSize : 11,
    marginBottom: 4,
  },
  italicMuted: {
    color    : colors.text.muted,
    fontStyle: 'italic' as never,
  },

  switchRow: {
    flexDirection : 'row',
    justifyContent: 'space-between',
    alignItems    : 'center',
    paddingVertical: 4,
  },

  warningBox: {
    backgroundColor: colors.accent.gold + '15',
    borderWidth    : 1,
    borderColor    : colors.accent.gold + '60',
    borderRadius   : 8,
    padding        : space.sm,
  },

  errorBox: {
    backgroundColor: colors.status.attention + '12',
    borderWidth    : 1,
    borderColor    : colors.status.attention + '40',
    borderRadius   : 8,
    padding        : space.sm,
  },

  actions: {
    flexDirection : 'row',
    justifyContent: 'flex-end',
    alignItems    : 'center',
    gap           : space.sm,
    marginTop     : space.xs,
  },
  cancelBtn: {
    paddingHorizontal: space.md,
    paddingVertical  : 10,
    borderRadius     : 8,
    borderWidth      : 1,
    borderColor      : colors.border.light,
  },

  // ── Club autocomplete (Story 22.1B) ────────────────────────────────────────
  clubInputRow: {
    flexDirection : 'row',
    alignItems    : 'center',
    borderWidth   : 1,
    borderColor   : colors.border.light,
    borderRadius  : 8,
    backgroundColor: colors.light.surface,
    paddingHorizontal: 10,
    minHeight     : 40,
  },
  clubTextInput: {
    flex      : 1,
    fontSize  : 13,
    color     : colors.text.dark,
    paddingVertical: 8,
    outlineStyle: 'none' as never,
  },
  clubLoadingDot: {
    color  : colors.text.muted,
    fontSize: 14,
    paddingHorizontal: 4,
  },
  clubClearBtn: {
    paddingHorizontal: 6,
    paddingVertical  : 4,
  },
  clubDropdown: {
    position       : 'absolute' as never,
    top            : '100%' as never,
    left           : 0,
    right          : 0,
    backgroundColor: colors.light.surface,
    borderWidth    : 1,
    borderColor    : colors.accent.gold + '60',
    borderRadius   : radius.xs,
    zIndex         : 999,
    elevation      : 8,
    marginTop      : 2,
  },
  clubDropdownItem: {
    paddingHorizontal: space.sm,
    paddingVertical  : 9,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.divider,
  },
})
