'use client'
// Story 91.2 — Médiathèque : vue role-aware (coach = upload + liste perso ; admin/marketeur = galerie validation)
import React, { useEffect, useState } from 'react'
import { View, StyleSheet, ScrollView } from 'react-native'
import { useAuthStore } from '@aureak/business-logic'
import { listMediaItems } from '@aureak/api-client'
import type { MediaItem } from '@aureak/types'
import { AureakText } from '@aureak/ui'
import { colors, space } from '@aureak/theme'
import { useCurrentRole } from '../../../../hooks/admin/useCurrentRole'
import { UploadForm } from './_components/UploadForm'
import { MediaGrid } from './_components/MediaGrid'
import { MediaCard } from './_components/MediaCard'

export default function MediathequePage() {
  const { user } = useAuthStore()
  const { activeRole } = useCurrentRole()
  const isAdminOrMarketeur = activeRole === 'admin' || activeRole === 'marketeur'
  const isCoach = activeRole === 'coach'

  const [myItems, setMyItems] = useState<MediaItem[]>([])
  const [reloadToken, setReloadToken] = useState(0)

  useEffect(() => {
    if (!isCoach || !user?.id) return
    let cancelled = false
    listMediaItems({ uploadedBy: user.id })
      .then(data => { if (!cancelled) setMyItems(data) })
      .catch(err => {
        if (process.env.NODE_ENV !== 'production') console.error('[mediatheque] myItems error:', err)
      })
    return () => { cancelled = true }
  }, [isCoach, user?.id, reloadToken])

  if (!activeRole) {
    return (
      <View style={s.stateCenter}>
        <AureakText style={s.muted as never}>Chargement…</AureakText>
      </View>
    )
  }

  if (isAdminOrMarketeur) {
    return (
      <ScrollView contentContainerStyle={s.container}>
        <View style={s.header}>
          <AureakText variant="h1" style={s.title as never}>Médiathèque</AureakText>
          <AureakText style={s.sub as never}>
            Valide ou rejette les photos et vidéos soumises par les coachs.
          </AureakText>
        </View>
        <MediaGrid />
      </ScrollView>
    )
  }

  if (isCoach) {
    return (
      <ScrollView contentContainerStyle={s.container}>
        <View style={s.header}>
          <AureakText variant="h1" style={s.title as never}>Médiathèque</AureakText>
          <AureakText style={s.sub as never}>
            Uploade photos et vidéos. Elles passent en validation avant publication.
          </AureakText>
        </View>

        <UploadForm onSuccess={() => setReloadToken(t => t + 1)} />

        <View style={s.section}>
          <AureakText variant="h3" style={s.sectionTitle as never}>Mes envois</AureakText>
          {myItems.length === 0 ? (
            <AureakText style={s.muted as never}>Aucun média envoyé pour l'instant.</AureakText>
          ) : (
            <View style={s.list}>
              {myItems.map(item => (
                <MediaCard key={item.id} item={item} showActions={false} />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    )
  }

  return (
    <View style={s.stateCenter}>
      <AureakText style={s.muted as never}>
        Accès réservé aux coachs, admins et marketeurs.
      </AureakText>
    </View>
  )
}

const s = StyleSheet.create({
  container: {
    padding        : space.xl,
    gap            : space.lg,
    backgroundColor: colors.light.primary,
    flexGrow       : 1,
  },
  header     : { gap: space.xs },
  title      : { color: colors.text.dark, fontWeight: '700' },
  sub        : { color: colors.text.muted, fontSize: 13 },
  section    : { gap: space.md },
  sectionTitle: { color: colors.text.dark, fontWeight: '700' },
  list       : { gap: space.md },
  muted      : { color: colors.text.muted, fontSize: 13 },
  stateCenter: {
    flex          : 1,
    alignItems    : 'center',
    justifyContent: 'center',
    backgroundColor: colors.light.primary,
    padding        : space.xl,
  },
})
