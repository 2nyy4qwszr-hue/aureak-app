'use client'
// Formulaire de création d'un joueur dans l'annuaire child_directory
// Story 18.4 — bouton "Ajouter un joueur" + page de création
// Terminologie : joueur = enfant = child

import React, { useState } from 'react'
import {
  View, StyleSheet, ScrollView, Pressable, Switch, type TextStyle,
} from 'react-native'
import { useRouter } from 'expo-router'
import { createChildDirectoryEntry } from '@aureak/api-client'
import { useAuthStore } from '@aureak/business-logic'
import { AureakText, Input, Button } from '@aureak/ui'
import { colors, space, shadows } from '@aureak/theme'

// ── Statuts disponibles ────────────────────────────────────────────────────────
// Valeurs string libres — ne pas confondre avec AcademyStatus (computed depuis la vue)

const STATUT_OPTIONS = ['Académicien', 'Nouveau', 'Ancien', 'Stagiaire', 'Prospect'] as const
type StatutOption = (typeof STATUT_OPTIONS)[number]

// ── Main ───────────────────────────────────────────────────────────────────────

export default function NewJoueurPage() {
  const router   = useRouter()
  const tenantId = useAuthStore((s) => s.tenantId)

  const [nom,         setNom]         = useState('')
  const [prenom,      setPrenom]      = useState('')
  const [birthDate,   setBirthDate]   = useState('')
  const [statut,      setStatut]      = useState<StatutOption | ''>('')
  const [currentClub, setCurrentClub] = useState('')
  const [niveauClub,  setNiveauClub]  = useState('')
  const [actif,       setActif]       = useState(true)

  const [saving,       setSaving]       = useState(false)
  const [error,        setError]        = useState<string | null>(null)
  const [nomError,     setNomError]     = useState<string | null>(null)
  const [dateError,    setDateError]    = useState<string | null>(null)

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
    setSaving(true)
    try {
      const entry = await createChildDirectoryEntry({
        tenantId,
        displayName,
        nom         : nom.trim()         || null,
        prenom      : prenom.trim()      || null,
        birthDate   : trimmedBirthDate   || null,
        statut      : statut             || null,
        currentClub : currentClub.trim() || null,
        niveauClub  : niveauClub.trim()  || null,
        actif,
      })
      setSaving(false)
      router.replace(`/children/${entry.id}` as never)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur lors de la création du joueur.')
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

      {/* ── Formulaire ── */}
      <View style={s.card}>

        {/* Identité */}
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

        {/* Statut */}
        <View style={{ marginTop: space.sm, gap: 6 }}>
          <AureakText variant="label" style={{ color: colors.text.muted }}>Statut</AureakText>
          <View style={s.statutRow}>
            {STATUT_OPTIONS.map(opt => (
              <Pressable
                key={opt}
                style={[s.statutPill, statut === opt && s.statutPillActive]}
                onPress={() => setStatut(prev => prev === opt ? '' : opt)}
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
        </View>

      </View>

      {/* ── Club ── */}
      <View style={s.card}>
        <AureakText variant="caption" style={s.sectionLabel}>CLUB ACTUEL</AureakText>

        <Input
          label="Nom du club"
          value={currentClub}
          onChangeText={setCurrentClub}
          placeholder="ex: Onhaye"
          variant="light"
          autoCapitalize="words"
        />

        <Input
          label="Niveau de compétition"
          value={niveauClub}
          onChangeText={setNiveauClub}
          placeholder="ex: Elite 1, Provincial…"
          variant="light"
          style={{ marginTop: space.sm }}
        />
      </View>

      {/* ── Options ── */}
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
        <Pressable style={s.cancelBtn} onPress={() => router.back()} disabled={saving}>
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
    ...shadows.sm,
  },

  sectionLabel: {
    color        : colors.text.muted,
    fontSize     : 10,
    fontWeight   : '700' as never,
    letterSpacing: 1,
    textTransform: 'uppercase' as never,
    marginBottom : 4,
  },

  statutRow: {
    flexDirection: 'row',
    flexWrap     : 'wrap',
    gap          : 6,
  },
  statutPill: {
    paddingHorizontal: 12,
    paddingVertical  : 5,
    borderRadius     : 12,
    borderWidth      : 1,
    borderColor      : colors.border.light,
    backgroundColor  : 'transparent',
  },
  statutPillActive: {
    borderColor    : colors.accent.gold,
    backgroundColor: colors.accent.gold + '15',
  },

  switchRow: {
    flexDirection : 'row',
    justifyContent: 'space-between',
    alignItems    : 'center',
    paddingVertical: 4,
  },

  errorBox: {
    backgroundColor: colors.status.attention + '12',
    borderWidth    : 1,
    borderColor    : colors.status.attention + '40',
    borderRadius   : 8,
    padding        : space.sm,
  },

  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems   : 'center',
    gap          : space.sm,
    marginTop    : space.xs,
  },
  cancelBtn: {
    paddingHorizontal: space.md,
    paddingVertical  : 10,
    borderRadius     : 8,
    borderWidth      : 1,
    borderColor      : colors.border.light,
  },
})
