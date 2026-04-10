'use client'
// Story 10.2 — Consentements parentaux par enfant
import React, { useEffect, useState, useCallback } from 'react'
import { View, StyleSheet, ScrollView, Pressable } from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import { listConsentsByChild, grantConsent, revokeConsent } from '@aureak/api-client'
import type { Consent, ConsentType } from '@aureak/api-client'
import { AureakText } from '@aureak/ui'
import { colors, space } from '@aureak/theme'

const CONSENT_LABELS: Record<ConsentType, { title: string; desc: string }> = {
  photos_videos  : { title: 'Photos & Vidéos',       desc: 'Autorisation de prendre et publier des photos/vidéos de votre enfant lors des séances.' },
  data_processing: { title: 'Traitement des données', desc: 'Consentement au traitement des données personnelles dans le cadre de l\'activité.' },
  marketing      : { title: 'Communications marketing', desc: 'Réception de communications promotionnelles et d\'actualités de l\'académie.' },
  sharing_clubs  : { title: 'Partage avec les clubs',  desc: 'Partage des données de performance avec les clubs partenaires (avec anonymisation).' },
}

const CONSENT_TYPES: ConsentType[] = ['photos_videos', 'data_processing', 'marketing', 'sharing_clubs']

export default function ChildConsentsPage() {
  const { childId } = useLocalSearchParams<{ childId: string }>()

  const [consents,  setConsents]  = useState<Consent[]>([])
  const [loading,   setLoading]   = useState(true)
  const [saving,    setSaving]    = useState<ConsentType | null>(null)
  const [error,     setError]     = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!childId) return
    setLoading(true)
    try {
      const { data } = await listConsentsByChild(childId)
      setConsents(data)
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[ChildConsents] load error:', err)
    } finally {
      setLoading(false)
    }
  }, [childId])

  useEffect(() => { load() }, [load])

  const isGranted = (type: ConsentType): boolean => {
    const c = consents.find(c => c.consent_type === type)
    return c?.granted === true && !c.revoked_at
  }

  const handleToggle = async (type: ConsentType) => {
    if (!childId || saving) return
    setSaving(type)
    try {
      if (isGranted(type)) {
        const { error } = await revokeConsent(childId, type)
        if (error) throw error
      } else {
        const { error } = await grantConsent(childId, type, 1)
        if (error) throw error
      }
      await load()
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[ChildConsents] toggle error:', err)
      setError('Une erreur est survenue. Veuillez réessayer.')
    } finally {
      setSaving(null)
    }
  }

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      <AureakText variant="h2" style={{ marginBottom: space.xs }}>Consentements</AureakText>
      <AureakText variant="body" style={{ color: colors.text.muted, marginBottom: space.lg }}>
        Gérez les autorisations données à l'académie concernant votre enfant.
      </AureakText>

      {error && (
        <AureakText variant="caption" style={{ color: colors.status.errorStrong, marginBottom: space.md }}>
          {error}
        </AureakText>
      )}

      {loading ? (
        <AureakText variant="body" style={{ color: colors.text.muted }}>Chargement…</AureakText>
      ) : (
        <View style={{ gap: space.md }}>
          {CONSENT_TYPES.map(type => {
            const granted = isGranted(type)
            const isSaving = saving === type
            const info = CONSENT_LABELS[type]
            return (
              <View key={type} style={s.card}>
                <View style={s.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <AureakText variant="body" style={{ fontWeight: '700' }}>{info.title}</AureakText>
                    <AureakText variant="caption" style={{ color: colors.text.muted, marginTop: 4 }}>
                      {info.desc}
                    </AureakText>
                  </View>
                  <Pressable
                    onPress={() => handleToggle(type)}
                    disabled={!!isSaving}
                    style={[s.toggle, granted ? s.toggleOn : s.toggleOff]}
                  >
                    <View style={[s.toggleThumb, granted ? s.toggleThumbOn : s.toggleThumbOff]} />
                  </Pressable>
                </View>
                <View style={s.cardFooter}>
                  <View style={[s.dot, { backgroundColor: granted ? colors.status.present : colors.text.muted }]} />
                  <AureakText variant="caption" style={{ color: granted ? colors.status.present : colors.text.muted }}>
                    {isSaving ? 'Mise à jour…' : granted ? 'Accordé' : 'Non accordé'}
                  </AureakText>
                </View>
              </View>
            )
          })}
        </View>
      )}

      <View style={s.notice}>
        <AureakText variant="caption" style={{ color: colors.text.muted, lineHeight: 18 }}>
          ℹ️  La révocation d'un consentement prend effet immédiatement. Certaines données
          déjà partagées ne peuvent pas être rappelées. Pour toute question, contactez l'académie via
          la section "Mes demandes".
        </AureakText>
      </View>
    </ScrollView>
  )
}

const s = StyleSheet.create({
  container   : { flex: 1, backgroundColor: colors.light.primary },
  content     : { padding: space.xl, gap: space.sm },
  card        : {
    backgroundColor: colors.light.surface,
    borderRadius   : 10,
    padding        : space.md,
    borderWidth    : 1,
    borderColor    : colors.border.light,
    gap            : space.sm,
  },
  cardHeader  : { flexDirection: 'row', alignItems: 'flex-start', gap: space.md },
  cardFooter  : { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot         : { width: 7, height: 7, borderRadius: 4 },
  toggle      : {
    width        : 44,
    height       : 24,
    borderRadius : 12,
    padding      : 2,
    justifyContent: 'center',
  },
  toggleOn    : { backgroundColor: colors.status.present },
  toggleOff   : { backgroundColor: colors.border.light },
  toggleThumb : {
    width       : 20,
    height      : 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
  },
  toggleThumbOn : { alignSelf: 'flex-end' },
  toggleThumbOff: { alignSelf: 'flex-start' },
  notice      : {
    marginTop      : space.lg,
    backgroundColor: colors.light.muted,
    borderRadius   : 8,
    padding        : space.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.border.gold,
  },
})
